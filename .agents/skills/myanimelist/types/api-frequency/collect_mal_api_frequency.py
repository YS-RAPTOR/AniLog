from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import random
import sys
import time
from collections import Counter, deque
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib import error, parse, request


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent.parent
ENDPOINTS_DIR = SKILL_DIR / "endpoints"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "output"

API_BASE = "https://api.myanimelist.net/v2"
REQUESTS_PER_MINUTE = 1000
REQUEST_TIMEOUT_SECONDS = 60
MAX_RETRIES = 6
STRING_VALUE_TRACK_LIMIT = 200
CHECKPOINT_INTERVAL = 25
DEFAULT_SEED = 1337

PUBLIC_USERS = [
    "MyAccount",
    "BigOnAnime",
    "BlackMagic",
    "SaeLiuS",
    "54Y4",
]

FIXED_SEASON_YEARS = [2005, 2010, 2015, 2020, 2025, 2026, 2027]
SEASONS = ["winter", "spring", "summer", "fall"]

ANIME_RANKING_TYPES = [
    "airing",
    "upcoming",
    "tv",
    "ova",
    "movie",
    "special",
    "bypopularity",
    "favorite",
]

MANGA_RANKING_TYPES = [
    "manga",
    "novels",
    "oneshots",
    "doujin",
    "manhwa",
    "manhua",
    "bypopularity",
    "favorite",
]


@dataclass(frozen=True)
class EndpointSpec:
    name: str
    doc_file: str
    selector_prefixes: tuple[str, ...]


ENDPOINT_SPECS = {
    "anime_detail": EndpointSpec("anime_detail", "get__anime__anime_id.md", ("",)),
    "manga_detail": EndpointSpec("manga_detail", "get__manga__manga_id.md", ("",)),
    "anime_ranking": EndpointSpec(
        "anime_ranking", "get__anime__ranking.md", ("data[].node.",)
    ),
    "manga_ranking": EndpointSpec(
        "manga_ranking", "get__manga__ranking.md", ("data[].node.",)
    ),
    "anime_season": EndpointSpec(
        "anime_season", "get__anime__season__year__season.md", ("data[].node.",)
    ),
    "animelist": EndpointSpec(
        "animelist",
        "get__users__user_name__animelist.md",
        ("data[].node.", "data[].list_status"),
    ),
    "mangalist": EndpointSpec(
        "mangalist",
        "get__users__user_name__mangalist.md",
        ("data[].node.", "data[].list_status"),
    ),
}


class SelectorTree:
    def __init__(self) -> None:
        self.children: dict[str, SelectorTree] = {}

    def add(self, path: str) -> None:
        normalized = path.replace("[]", "")
        parts = [part for part in normalized.split(".") if part]
        if not parts:
            return
        node = self
        for part in parts:
            node = node.children.setdefault(part, SelectorTree())

    def render(self) -> str:
        return ",".join(
            self._render_child(name, child) for name, child in self.children.items()
        )

    def _render_child(self, name: str, child: SelectorTree) -> str:
        if child.children:
            nested = ",".join(
                self._render_child(sub_name, sub_child)
                for sub_name, sub_child in child.children.items()
            )
            return f"{name}{{{nested}}}"
        return name


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self.timestamps: deque[float] = deque()

    def wait(self) -> None:
        while True:
            now = time.monotonic()
            while self.timestamps and now - self.timestamps[0] >= self.window_seconds:
                self.timestamps.popleft()
            if len(self.timestamps) < self.limit:
                self.timestamps.append(now)
                return
            sleep_for = self.window_seconds - (now - self.timestamps[0]) + 0.05
            time.sleep(max(sleep_for, 0.05))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect MyAnimeList API responses and derive field frequency analysis."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--requests-per-minute", type=int, default=REQUESTS_PER_MINUTE)
    parser.add_argument("--analyze-only", action="store_true")
    parser.add_argument("--retry-failures-only", action="store_true")
    parser.add_argument("--skip-analysis", action="store_true")
    return parser.parse_args()


def parse_doc_fields(doc_path: Path) -> list[str]:
    fields: list[str] = []
    for raw_line in doc_path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("- "):
            fields.append(line[2:])
    return fields


def build_field_selector(spec: EndpointSpec) -> str:
    fields = parse_doc_fields(ENDPOINTS_DIR / spec.doc_file)
    tree = SelectorTree()
    prefixes = sorted(spec.selector_prefixes, key=len, reverse=True)

    for field in fields:
        if field in {
            "data",
            "data[]",
            "paging",
            "paging.previous",
            "paging.next",
            "season",
            "season.year",
            "season.season",
        }:
            continue

        stripped: str | None = None
        for prefix in prefixes:
            if prefix == "":
                stripped = field
                break
            if field == prefix:
                stripped = prefix.split(".")[-1].replace("[]", "")
                break
            if field.startswith(prefix):
                stripped = field[len(prefix) :]
                break
        if stripped is None:
            continue
        tree.add(stripped)

    return tree.render()


def canonicalize_url(url: str, params: dict[str, Any] | None = None) -> str:
    parsed = parse.urlsplit(url)
    query_pairs = parse.parse_qsl(parsed.query, keep_blank_values=True)
    if params:
        for key, value in params.items():
            if value is None:
                continue
            if isinstance(value, (list, tuple)):
                for item in value:
                    query_pairs.append((key, str(item)))
            else:
                query_pairs.append((key, str(value)))
    normalized_query = parse.urlencode(sorted(query_pairs), doseq=True)
    return parse.urlunsplit(
        (parsed.scheme, parsed.netloc, parsed.path, normalized_query, parsed.fragment)
    )


def request_key(method: str, url: str, params: dict[str, Any] | None = None) -> str:
    canonical = canonicalize_url(url, params)
    digest = hashlib.sha256(f"{method.upper()} {canonical}".encode("utf-8")).hexdigest()
    return digest


def stable_dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"))


class MalCollector:
    def __init__(self, output_dir: Path, requests_per_minute: int, seed: int) -> None:
        self.output_dir = output_dir
        self.cache_dir = output_dir / "responses"
        self.failures_dir = output_dir / "failures"
        self.logs_dir = output_dir / "logs"
        self.analysis_dir = output_dir / "analysis"
        self.plan_path = output_dir / "plan.json"
        self.manifest_path = output_dir / "run_manifest.json"
        self.failed_log_path = self.logs_dir / "failed_requests.jsonl"
        self.progress_path = self.logs_dir / "progress.json"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.failures_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.analysis_dir.mkdir(parents=True, exist_ok=True)

        self.seed = seed
        self.rng = random.Random(seed)
        self.rate_limiter = RateLimiter(requests_per_minute, 60.0)
        self.selectors = {
            name: build_field_selector(spec) for name, spec in ENDPOINT_SPECS.items()
        }

        self.request_count = 0
        self.success_count = 0
        self.failure_count = 0
        self.retry_count = 0
        self.cache_hits = 0
        self.progress_dirty = False
        self.start_time = datetime.now(UTC).isoformat()

    def cache_file_for_key(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json.gz"

    def has_cached_response(self, key: str) -> bool:
        return self.cache_file_for_key(key).exists()

    def failure_file_for_key(self, key: str) -> Path:
        return self.failures_dir / f"{key}.json"

    def clear_failure_record(self, key: str) -> None:
        path = self.failure_file_for_key(key)
        if path.exists():
            path.unlink()

    def save_failure_record(self, key: str, payload: dict[str, Any]) -> None:
        path = self.failure_file_for_key(key)
        temp_path = path.with_suffix(".tmp")
        temp_path.write_text(stable_dump(payload))
        temp_path.replace(path)

    def load_cached_record(self, key: str) -> dict[str, Any]:
        path = self.cache_file_for_key(key)
        with gzip.open(path, "rt", encoding="utf-8") as handle:
            return json.load(handle)

    def save_cached_record(self, key: str, record: dict[str, Any]) -> None:
        path = self.cache_file_for_key(key)
        temp_path = path.with_suffix(path.suffix + ".tmp")
        with gzip.open(temp_path, "wt", encoding="utf-8") as handle:
            json.dump(record, handle, ensure_ascii=True, sort_keys=True)
        temp_path.replace(path)

    def write_progress(self) -> None:
        payload = {
            "seed": self.seed,
            "started_at": self.start_time,
            "updated_at": datetime.now(UTC).isoformat(),
            "request_count": self.request_count,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "retry_count": self.retry_count,
            "cache_hits": self.cache_hits,
        }
        temp_path = self.progress_path.with_suffix(".tmp")
        temp_path.write_text(stable_dump(payload))
        temp_path.replace(self.progress_path)
        self.progress_dirty = False

    def append_failure(self, payload: dict[str, Any]) -> None:
        with self.failed_log_path.open("a", encoding="utf-8") as handle:
            handle.write(stable_dump(payload) + "\n")

    def build_request_headers(self) -> dict[str, str]:
        auth = None
        try:
            import os

            auth = os.environ.get("AUTH")
        except Exception:
            auth = None
        if not auth:
            raise RuntimeError("AUTH environment variable is required for fetch mode.")
        return {
            "Authorization": f"Bearer {auth}",
            "Accept": "application/json",
            "User-Agent": "Anilog MAL frequency collector",
        }

    def fetch_json(
        self,
        *,
        label: str,
        url: str,
        params: dict[str, Any] | None,
        metadata: dict[str, Any],
    ) -> dict[str, Any] | None:
        key = request_key("GET", url, params)
        if self.has_cached_response(key):
            self.clear_failure_record(key)
            self.cache_hits += 1
            return self.load_cached_record(key)["response"]

        headers = self.build_request_headers()
        attempt = 0
        last_error: str | None = None
        final_url = canonicalize_url(url, params)

        while attempt < MAX_RETRIES:
            if attempt > 0:
                self.retry_count += 1
            attempt += 1
            self.rate_limiter.wait()
            self.request_count += 1
            req = request.Request(final_url, headers=headers, method="GET")
            started_at = time.time()
            try:
                with request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                    status_code = response.status
                    body = response.read().decode("utf-8")
                parsed_body = json.loads(body)
                record = {
                    "request": {
                        "label": label,
                        "key": key,
                        "method": "GET",
                        "url": final_url,
                        "metadata": metadata,
                    },
                    "response": parsed_body,
                    "response_meta": {
                        "status_code": status_code,
                        "fetched_at": datetime.now(UTC).isoformat(),
                        "duration_ms": int((time.time() - started_at) * 1000),
                    },
                }
                self.save_cached_record(key, record)
                self.clear_failure_record(key)
                self.success_count += 1
                self.progress_dirty = True
                if (
                    self.progress_dirty
                    and self.request_count % CHECKPOINT_INTERVAL == 0
                ):
                    self.write_progress()
                return parsed_body
            except error.HTTPError as exc:
                error_text = (
                    exc.read().decode("utf-8", errors="replace") if exc.fp else str(exc)
                )
                last_error = f"HTTP {exc.code}: {error_text}"
                if exc.code in {429, 500, 502, 503, 504} and attempt < MAX_RETRIES:
                    time.sleep((2 ** (attempt - 1)) + self.rng.random())
                    continue
                break
            except Exception as exc:  # noqa: BLE001
                last_error = str(exc)
                if attempt < MAX_RETRIES:
                    time.sleep((2 ** (attempt - 1)) + self.rng.random())
                    continue
                break

        failure_payload = {
            "key": key,
            "label": label,
            "url": final_url,
            "params": None,
            "metadata": metadata,
            "attempts": attempt,
            "error": last_error,
            "failed_at": datetime.now(UTC).isoformat(),
        }
        self.failure_count += 1
        self.progress_dirty = True
        self.save_failure_record(key, failure_payload)
        self.append_failure(failure_payload)
        if self.progress_dirty and self.request_count % CHECKPOINT_INTERVAL == 0:
            self.write_progress()
        return None

    def retry_failure_queue(self) -> None:
        for failure_path in sorted(self.failures_dir.glob("*.json")):
            payload = json.loads(failure_path.read_text())
            self.fetch_json(
                label=payload.get("label", "retry_failure"),
                url=payload["url"],
                params=payload.get("params"),
                metadata=payload.get("metadata", {}),
            )
        self.write_progress()

    def fetch_paginated(
        self,
        *,
        label: str,
        url: str,
        params: dict[str, Any],
        metadata: dict[str, Any],
        target_entries: int | None,
    ) -> list[dict[str, Any]]:
        responses: list[dict[str, Any]] = []
        next_url = url
        next_params: dict[str, Any] | None = dict(params)
        fetched_entries = 0

        while True:
            response = self.fetch_json(
                label=label, url=next_url, params=next_params, metadata=metadata
            )
            if response is None:
                break
            responses.append(response)

            data = response.get("data")
            if isinstance(data, list):
                fetched_entries += len(data)
            if target_entries is not None and fetched_entries >= target_entries:
                break

            paging = response.get("paging")
            if not isinstance(paging, dict):
                break
            next_link = paging.get("next")
            if not next_link:
                break
            next_url = next_link
            next_params = None

        return responses

    def season_tuples(self) -> list[tuple[int, str]]:
        tuples = {(year, season) for year in FIXED_SEASON_YEARS for season in SEASONS}

        now = datetime.now(UTC)
        current_index = month_to_season_index(now.month)
        dynamic_year = now.year
        dynamic = [
            (dynamic_year, current_index - 1),
            (dynamic_year, current_index),
            (dynamic_year, current_index + 1),
        ]

        for year, season_index in dynamic:
            adjusted_year = year
            adjusted_index = season_index
            while adjusted_index < 0:
                adjusted_index += 4
                adjusted_year -= 1
            while adjusted_index >= 4:
                adjusted_index -= 4
                adjusted_year += 1
            tuples.add((adjusted_year, SEASONS[adjusted_index]))

        return sorted(tuples)

    def fetch_breadth_endpoints(self) -> None:
        anime_all_fields = self.selectors["anime_ranking"]
        manga_all_fields = self.selectors["manga_ranking"]

        for offset in range(0, 5000, 500):
            self.fetch_paginated(
                label=f"anime_ranking_all_{offset}",
                url=f"{API_BASE}/anime/ranking",
                params={
                    "ranking_type": "all",
                    "limit": 500,
                    "offset": offset,
                    "fields": anime_all_fields,
                },
                metadata={
                    "endpoint": "anime_ranking",
                    "ranking_type": "all",
                    "offset": offset,
                    "medium": "anime",
                },
                target_entries=500,
            )

        for offset in range(0, 5000, 500):
            self.fetch_paginated(
                label=f"manga_ranking_all_{offset}",
                url=f"{API_BASE}/manga/ranking",
                params={
                    "ranking_type": "all",
                    "limit": 500,
                    "offset": offset,
                    "fields": manga_all_fields,
                },
                metadata={
                    "endpoint": "manga_ranking",
                    "ranking_type": "all",
                    "offset": offset,
                    "medium": "manga",
                },
                target_entries=500,
            )

        for ranking_type in ANIME_RANKING_TYPES:
            self.fetch_paginated(
                label=f"anime_ranking_{ranking_type}",
                url=f"{API_BASE}/anime/ranking",
                params={
                    "ranking_type": ranking_type,
                    "limit": 500,
                    "fields": anime_all_fields,
                },
                metadata={
                    "endpoint": "anime_ranking",
                    "ranking_type": ranking_type,
                    "medium": "anime",
                },
                target_entries=500,
            )

        for ranking_type in MANGA_RANKING_TYPES:
            self.fetch_paginated(
                label=f"manga_ranking_{ranking_type}",
                url=f"{API_BASE}/manga/ranking",
                params={
                    "ranking_type": ranking_type,
                    "limit": 500,
                    "fields": manga_all_fields,
                },
                metadata={
                    "endpoint": "manga_ranking",
                    "ranking_type": ranking_type,
                    "medium": "manga",
                },
                target_entries=500,
            )

        anime_season_fields = self.selectors["anime_season"]
        for year, season in self.season_tuples():
            self.fetch_paginated(
                label=f"anime_season_{year}_{season}",
                url=f"{API_BASE}/anime/season/{year}/{season}",
                params={"limit": 500, "fields": anime_season_fields},
                metadata={
                    "endpoint": "anime_season",
                    "medium": "anime",
                    "year": year,
                    "season": season,
                },
                target_entries=None,
            )

        animelist_fields = self.selectors["animelist"]
        mangalist_fields = self.selectors["mangalist"]

        for username in ["@me", *PUBLIC_USERS]:
            self.fetch_paginated(
                label=f"animelist_{username}",
                url=f"{API_BASE}/users/{parse.quote(username, safe='@')}/animelist",
                params={"limit": 1000, "fields": animelist_fields},
                metadata={"endpoint": "animelist", "medium": "anime", "user": username},
                target_entries=None,
            )
            self.fetch_paginated(
                label=f"mangalist_{username}",
                url=f"{API_BASE}/users/{parse.quote(username, safe='@')}/mangalist",
                params={"limit": 1000, "fields": mangalist_fields},
                metadata={"endpoint": "mangalist", "medium": "manga", "user": username},
                target_entries=None,
            )

        self.write_progress()

    def iter_cached_records(self):
        for path in sorted(self.cache_dir.glob("*.json.gz")):
            with gzip.open(path, "rt", encoding="utf-8") as handle:
                yield json.load(handle)

    def gather_ids_from_cached_rankings(self, medium: str) -> dict[str, list[int]]:
        endpoint_name = f"{medium}_ranking"
        ranked_ids_by_type: dict[str, list[tuple[int, int]]] = {}

        for record in self.iter_cached_records():
            metadata = record.get("request", {}).get("metadata", {})
            if metadata.get("endpoint") != endpoint_name:
                continue
            ranking_type = metadata.get("ranking_type")
            if not isinstance(ranking_type, str):
                continue
            data = record.get("response", {}).get("data", [])
            if not isinstance(data, list):
                continue
            bucket = ranked_ids_by_type.setdefault(ranking_type, [])
            offset = (
                int(metadata.get("offset", 0))
                if isinstance(metadata.get("offset", 0), int)
                else 0
            )
            for index, item in enumerate(data):
                if not isinstance(item, dict):
                    continue
                node = item.get("node")
                if not isinstance(node, dict):
                    continue
                anime_or_manga_id = node.get("id")
                if isinstance(anime_or_manga_id, int):
                    ranking = item.get("ranking")
                    if isinstance(ranking, dict) and isinstance(
                        ranking.get("rank"), int
                    ):
                        sort_key = int(ranking["rank"])
                    else:
                        sort_key = offset + index
                    bucket.append((sort_key, anime_or_manga_id))

        ids_by_type: dict[str, list[int]] = {}
        for ranking_type, ranked_ids in ranked_ids_by_type.items():
            ranked_ids.sort(key=lambda item: item[0])
            ids_by_type[ranking_type] = dedupe_preserve_order(
                [item_id for _, item_id in ranked_ids]
            )
        return ids_by_type

    def build_detail_plan(self) -> dict[str, Any]:
        plan = {
            "seed": self.seed,
            "created_at": datetime.now(UTC).isoformat(),
            "users": PUBLIC_USERS,
            "season_tuples": [
                {"year": year, "season": season}
                for year, season in self.season_tuples()
            ],
            "details": {},
        }

        for medium, ranking_types in (
            ("anime", ANIME_RANKING_TYPES),
            ("manga", MANGA_RANKING_TYPES),
        ):
            ids_by_type = self.gather_ids_from_cached_rankings(medium)
            top_pool = ids_by_type.get("all", [])[:500]
            top_sample = sample_unique(self.rng, top_pool, min(500, len(top_pool)))

            quotas = distribute_evenly(500, ranking_types)
            stratified = stratified_sample(
                rng=self.rng,
                ids_by_type={
                    ranking_type: ids_by_type.get(ranking_type, [])
                    for ranking_type in ranking_types
                },
                quotas=quotas,
                exclude=set(top_sample),
            )

            plan["details"][medium] = {
                "top_500_sample": top_sample,
                "ranking_type_sample": stratified,
            }

        temp_path = self.plan_path.with_suffix(".tmp")
        temp_path.write_text(stable_dump(plan))
        temp_path.replace(self.plan_path)
        return plan

    def load_or_build_plan(self) -> dict[str, Any]:
        if self.plan_path.exists():
            return json.loads(self.plan_path.read_text())
        return self.build_detail_plan()

    def fetch_detail_endpoints(self, plan: dict[str, Any]) -> None:
        for medium in ("anime", "manga"):
            endpoint = f"{API_BASE}/{medium}"
            selector = self.selectors[f"{medium}_detail"]
            top_ids = plan["details"][medium]["top_500_sample"]
            type_ids = plan["details"][medium]["ranking_type_sample"]

            for item_id in top_ids:
                self.fetch_json(
                    label=f"{medium}_detail_top_{item_id}",
                    url=f"{endpoint}/{item_id}",
                    params={"fields": selector},
                    metadata={
                        "endpoint": f"{medium}_detail",
                        "medium": medium,
                        "sample_group": "top_500",
                        "id": item_id,
                    },
                )

            for item_id in type_ids:
                self.fetch_json(
                    label=f"{medium}_detail_ranking_{item_id}",
                    url=f"{endpoint}/{item_id}",
                    params={"fields": selector},
                    metadata={
                        "endpoint": f"{medium}_detail",
                        "medium": medium,
                        "sample_group": "ranking_types",
                        "id": item_id,
                    },
                )

        self.write_progress()

    def write_manifest(self) -> None:
        payload = {
            "started_at": self.start_time,
            "finished_at": datetime.now(UTC).isoformat(),
            "request_count": self.request_count,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "retry_count": self.retry_count,
            "cache_hits": self.cache_hits,
            "cache_files": len(list(self.cache_dir.glob("*.json.gz"))),
            "failure_files": len(list(self.failures_dir.glob("*.json"))),
            "public_users": PUBLIC_USERS,
            "season_years": FIXED_SEASON_YEARS,
            "anime_ranking_types": ["all", *ANIME_RANKING_TYPES],
            "manga_ranking_types": ["all", *MANGA_RANKING_TYPES],
            "selectors": self.selectors,
        }
        temp_path = self.manifest_path.with_suffix(".tmp")
        temp_path.write_text(stable_dump(payload))
        temp_path.replace(self.manifest_path)

    def analyze_cache(self) -> None:
        field_stats: dict[str, dict[str, Any]] = {}
        endpoint_stats: dict[str, dict[str, Any]] = {}
        total_records = 0

        for record in self.iter_cached_records():
            total_records += 1
            request_meta = record.get("request", {})
            metadata = request_meta.get("metadata", {})
            endpoint_name = metadata.get("endpoint", "unknown")
            endpoint_entry = endpoint_stats.setdefault(
                endpoint_name,
                {
                    "responses": 0,
                    "labels": Counter(),
                    "mediums": Counter(),
                },
            )
            endpoint_entry["responses"] += 1
            endpoint_entry["labels"][request_meta.get("label", endpoint_name)] += 1
            endpoint_entry["mediums"][metadata.get("medium", "unknown")] += 1

            flatten_json(record.get("response"), "", field_stats, endpoint_name)

        serializable_fields = {
            path: finalize_field_stat(path, stat)
            for path, stat in sorted(field_stats.items(), key=lambda item: item[0])
        }
        serializable_endpoints = {
            endpoint: {
                "responses": stat["responses"],
                "mediums": dict(stat["mediums"].most_common()),
                "top_labels": stat["labels"].most_common(20),
            }
            for endpoint, stat in sorted(endpoint_stats.items())
        }

        analysis_payload = {
            "generated_at": datetime.now(UTC).isoformat(),
            "record_count": total_records,
            "field_count": len(serializable_fields),
            "endpoint_count": len(serializable_endpoints),
            "fields": serializable_fields,
            "endpoints": serializable_endpoints,
        }
        (self.analysis_dir / "mal_frequency_analysis.json").write_text(
            stable_dump(analysis_payload)
        )
        (self.analysis_dir / "mal_frequency_summary.md").write_text(
            render_summary_markdown(analysis_payload)
        )


def month_to_season_index(month: int) -> int:
    if month in {12, 1, 2}:
        return 0
    if month in {3, 4, 5}:
        return 1
    if month in {6, 7, 8}:
        return 2
    return 3


def dedupe_preserve_order(values: list[int]) -> list[int]:
    seen: set[int] = set()
    result: list[int] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def sample_unique(rng: random.Random, values: list[int], count: int) -> list[int]:
    if count >= len(values):
        shuffled = list(values)
        rng.shuffle(shuffled)
        return shuffled
    return rng.sample(values, count)


def distribute_evenly(total: int, keys: list[str]) -> dict[str, int]:
    base = total // len(keys)
    remainder = total % len(keys)
    quotas: dict[str, int] = {}
    for index, key in enumerate(keys):
        quotas[key] = base + (1 if index < remainder else 0)
    return quotas


def stratified_sample(
    *,
    rng: random.Random,
    ids_by_type: dict[str, list[int]],
    quotas: dict[str, int],
    exclude: set[int],
) -> list[int]:
    chosen: list[int] = []
    chosen_set = set(exclude)
    shortfall = 0

    for ranking_type, quota in quotas.items():
        pool = [
            item_id
            for item_id in ids_by_type.get(ranking_type, [])
            if item_id not in chosen_set
        ]
        take = min(quota, len(pool))
        selected = sample_unique(rng, pool, take)
        chosen.extend(selected)
        chosen_set.update(selected)
        shortfall += quota - take

    if shortfall > 0:
        fallback_pool: list[int] = []
        for ranking_type, ids in ids_by_type.items():
            fallback_pool.extend(
                item_id for item_id in ids if item_id not in chosen_set
            )
        fallback_pool = dedupe_preserve_order(fallback_pool)
        extra = sample_unique(rng, fallback_pool, min(shortfall, len(fallback_pool)))
        chosen.extend(extra)
        chosen_set.update(extra)

    return chosen


def detect_value_type(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int) and not isinstance(value, bool):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return type(value).__name__


def looks_like_date(value: str) -> bool:
    return len(value) == 10 and value[4] == "-" and value[7] == "-"


def looks_like_partial_date(value: str) -> bool:
    if len(value) == 4 and value.isdigit():
        return True
    if len(value) == 7 and value[4] == "-":
        return True
    return looks_like_date(value)


def looks_like_time(value: str) -> bool:
    return len(value) == 5 and value[2] == ":"


def looks_like_datetime(value: str) -> bool:
    return "T" in value and (
        value.endswith("Z") or "+" in value[10:] or "-" in value[10:]
    )


def ensure_field_stat(
    field_stats: dict[str, dict[str, Any]], path: str
) -> dict[str, Any]:
    return field_stats.setdefault(
        path,
        {
            "observed_count": 0,
            "types": Counter(),
            "string_values": Counter(),
            "string_overflow": 0,
            "string_unique_seen": set(),
            "numeric_min": None,
            "numeric_max": None,
            "array_length_min": None,
            "array_length_max": None,
            "datetime_like_count": 0,
            "date_like_count": 0,
            "partial_date_like_count": 0,
            "time_like_count": 0,
            "true_count": 0,
            "false_count": 0,
            "endpoints": Counter(),
        },
    )


def update_string_stats(stat: dict[str, Any], value: str) -> None:
    unique_seen: set[str] = stat["string_unique_seen"]
    if value in unique_seen or len(unique_seen) < STRING_VALUE_TRACK_LIMIT:
        unique_seen.add(value)
        stat["string_values"][value] += 1
    else:
        stat["string_overflow"] += 1


def flatten_json(
    value: Any, path: str, field_stats: dict[str, dict[str, Any]], endpoint_name: str
) -> None:
    current_type = detect_value_type(value)
    if path:
        stat = ensure_field_stat(field_stats, path)
        stat["observed_count"] += 1
        stat["types"][current_type] += 1
        stat["endpoints"][endpoint_name] += 1

        if current_type in {"integer", "number"}:
            numeric_value = float(value)
            stat["numeric_min"] = (
                numeric_value
                if stat["numeric_min"] is None
                else min(stat["numeric_min"], numeric_value)
            )
            stat["numeric_max"] = (
                numeric_value
                if stat["numeric_max"] is None
                else max(stat["numeric_max"], numeric_value)
            )
        elif current_type == "boolean":
            if value:
                stat["true_count"] += 1
            else:
                stat["false_count"] += 1
        elif current_type == "string":
            update_string_stats(stat, value)
            if looks_like_datetime(value):
                stat["datetime_like_count"] += 1
            if looks_like_date(value):
                stat["date_like_count"] += 1
            if looks_like_partial_date(value):
                stat["partial_date_like_count"] += 1
            if looks_like_time(value):
                stat["time_like_count"] += 1
        elif current_type == "array":
            length = len(value)
            stat["array_length_min"] = (
                length
                if stat["array_length_min"] is None
                else min(stat["array_length_min"], length)
            )
            stat["array_length_max"] = (
                length
                if stat["array_length_max"] is None
                else max(stat["array_length_max"], length)
            )

    if isinstance(value, dict):
        for key, nested_value in value.items():
            next_path = f"{path}.{key}" if path else key
            flatten_json(nested_value, next_path, field_stats, endpoint_name)
    elif isinstance(value, list):
        next_path = f"{path}[]" if path else "[]"
        for item in value:
            flatten_json(item, next_path, field_stats, endpoint_name)


def finalize_field_stat(path: str, stat: dict[str, Any]) -> dict[str, Any]:
    finalized = {
        "observed_count": stat["observed_count"],
        "types": dict(stat["types"].most_common()),
        "endpoints": dict(stat["endpoints"].most_common()),
    }

    if stat["numeric_min"] is not None:
        finalized["numeric_min"] = stat["numeric_min"]
        finalized["numeric_max"] = stat["numeric_max"]
    if stat["array_length_min"] is not None:
        finalized["array_length_min"] = stat["array_length_min"]
        finalized["array_length_max"] = stat["array_length_max"]
    if stat["true_count"] or stat["false_count"]:
        finalized["boolean_distribution"] = {
            "true": stat["true_count"],
            "false": stat["false_count"],
        }
    if stat["string_values"]:
        finalized["tracked_string_values"] = stat["string_values"].most_common(20)
        finalized["tracked_string_unique_count"] = len(stat["string_unique_seen"])
        finalized["string_overflow_count"] = stat["string_overflow"]
    if stat["datetime_like_count"]:
        finalized["datetime_like_count"] = stat["datetime_like_count"]
    if stat["date_like_count"]:
        finalized["date_like_count"] = stat["date_like_count"]
    if stat["partial_date_like_count"]:
        finalized["partial_date_like_count"] = stat["partial_date_like_count"]
    if stat["time_like_count"]:
        finalized["time_like_count"] = stat["time_like_count"]

    return finalized


def render_summary_markdown(payload: dict[str, Any]) -> str:
    def escape_cell(value: str) -> str:
        return value.replace("|", "\\|").replace("\n", " ")

    lines = [
        "# MAL Frequency Summary",
        "",
        f"- Generated at: `{payload['generated_at']}`",
        f"- Cached responses analyzed: `{payload['record_count']}`",
        f"- Distinct field paths: `{payload['field_count']}`",
        f"- Distinct endpoints: `{payload['endpoint_count']}`",
        "",
        "## Endpoints",
        "",
        "| Endpoint | Responses | Mediums |",
        "| --- | --- | --- |",
    ]

    for endpoint, stat in payload["endpoints"].items():
        mediums = ", ".join(
            f"{medium}:{count}" for medium, count in stat["mediums"].items()
        )
        lines.append(f"| `{endpoint}` | `{stat['responses']}` | {mediums} |")

    lines.extend(
        [
            "",
            "## High-Signal Fields",
            "",
            "| Field | Observed | Types | Top Values |",
            "| --- | --- | --- | --- |",
        ]
    )

    field_items = sorted(
        payload["fields"].items(),
        key=lambda item: item[1]["observed_count"],
        reverse=True,
    )[:100]

    for field, stat in field_items:
        types = ", ".join(
            f"{name}:{count}" for name, count in list(stat["types"].items())[:4]
        )
        top_values = ""
        if "tracked_string_values" in stat:
            top_values = ", ".join(
                f"{escape_cell(value)}:{count}"
                for value, count in stat["tracked_string_values"][:5]
            )
        elif "numeric_min" in stat:
            top_values = f"min={stat['numeric_min']}, max={stat['numeric_max']}"
        elif "boolean_distribution" in stat:
            top_values = f"true={stat['boolean_distribution']['true']}, false={stat['boolean_distribution']['false']}"
        lines.append(
            f"| `{field}` | `{stat['observed_count']}` | `{types}` | {top_values} |"
        )

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    collector = MalCollector(
        output_dir=args.output_dir,
        requests_per_minute=args.requests_per_minute,
        seed=args.seed,
    )

    try:
        if args.retry_failures_only:
            collector.retry_failure_queue()
        elif not args.analyze_only:
            collector.fetch_breadth_endpoints()
            plan = collector.load_or_build_plan()
            collector.fetch_detail_endpoints(plan)
        if not args.skip_analysis:
            collector.analyze_cache()
        collector.write_manifest()
        if collector.progress_dirty:
            collector.write_progress()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Output written to {collector.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
