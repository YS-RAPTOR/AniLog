from __future__ import annotations

import gzip
import json
import re
from pathlib import Path
from typing import Any


TYPES_DIR = Path(__file__).resolve().parent
UPDATED_HYPOTHESIS_PATH = TYPES_DIR / "updated-hypothesis.md"
OUTPUT_PATH = TYPES_DIR / "finalized types.md"
CACHE_DIR = TYPES_DIR / "api-frequency" / "output" / "responses"


TABLE_HEADER = "| Field | Updated Hypothesis | Evidence Notes |"
ROW_PATTERN = re.compile(r"^\| `([^`]+)` \| `([^`]+)` \| ?(.*?) ?\|$")


TYPE_OVERRIDES = {
    "end_date": "nullable<partial_date_string>",
    "media_type": "enum_string",
    "my_list_status.finish_date": "nullable<partial_date_string>",
    "my_list_status.start_date": "nullable<partial_date_string>",
    "num_chapters": "nullable<integer>",
    "num_episodes": "nullable<integer>",
    "num_volumes": "nullable<integer>",
    "related_anime[].node.media_type": "enum_string",
    "related_anime[].node.my_list_status.finish_date": "nullable<partial_date_string>",
    "related_anime[].node.my_list_status.start_date": "nullable<partial_date_string>",
    "related_anime[].node.num_episodes": "nullable<integer>",
    "related_manga[].node.media_type": "enum_string",
    "related_manga[].node.my_list_status.finish_date": "nullable<partial_date_string>",
    "related_manga[].node.my_list_status.start_date": "nullable<partial_date_string>",
    "related_manga[].node.num_chapters": "nullable<integer>",
    "related_manga[].node.num_volumes": "nullable<integer>",
    "statistics.status.completed": "integer_string",
    "statistics.status.dropped": "integer_string",
    "statistics.status.on_hold": "integer_string",
    "statistics.status.plan_to_watch": "integer_string",
    "statistics.status.watching": "integer_string",
    "videos[].created_at": "timestamp_ms_integer",
    "videos[].updated_at": "timestamp_ms_integer",
}


NOTE_OVERRIDES = {
    "end_date": "Live payloads only showed partial-date strings when present; omitted values should be normalized to null.",
    "media_type": "Live payloads observed 17 distinct values including `unknown`, so this is treated as an open enum rather than a closed one.",
    "my_list_status.finish_date": "Live payloads include year-only values such as `2011`, so this is a nullable partial date rather than a full date.",
    "my_list_status.start_date": "Live payloads include year-only values such as `2009`, so this is a nullable partial date rather than a full date.",
    "nsfw": "Live payloads only observed `white` and `gray`; keep this open because the sample does not prove exhaustiveness.",
    "num_chapters": "Live payloads encoded this as an integer when present; omitted values should be normalized to null.",
    "num_episodes": "Live payloads encoded this as an integer when present; omitted values should be normalized to null.",
    "num_volumes": "Live payloads encoded this as an integer when present; omitted values should be normalized to null.",
    "rating": "Live payloads matched the six expected wire values: `g`, `pg`, `pg_13`, `r`, `r+`, and `rx`.",
    "source": "Live payloads exposed at least 16 source values including `card_game` and `radio`, so this remains an open enum.",
    "status": "Live payloads matched the seven expected anime+manga wire values with no extra states observed.",
    "genres[].name": "Website genre filters are fully covered by the observed set; the live API adds `Eligible Titles for You Should Read This`, so this remains an enum string with 80 known values.",
    "authors[].role": "Live payloads observed only `Story & Art`, `Story`, and `Art`, but this is still treated as open without explicit doc confirmation.",
    "broadcast.day_of_the_week": "Live payloads observed weekday values plus `other`, so this remains an open enum.",
    "related_anime[].node.broadcast.day_of_the_week": "Live payloads observed weekday values plus `other`, so this remains an open enum.",
    "related_anime[].node.media_type": "Live payloads observed 17 distinct media types at the top level including `unknown`, so related media types stay open as well.",
    "related_anime[].node.my_list_status.finish_date": "List-status dates are nullable partial-date strings on the wire.",
    "related_anime[].node.my_list_status.start_date": "List-status dates are nullable partial-date strings on the wire.",
    "related_anime[].node.num_episodes": "Live payloads encoded this as an integer when present; omitted values should be normalized to null.",
    "related_anime[].node.rating": "Live payloads matched the six expected wire values: `g`, `pg`, `pg_13`, `r`, `r+`, and `rx`.",
    "related_anime[].node.source": "Live payloads exposed at least 16 source values including `card_game` and `radio`, so this remains an open enum.",
    "related_manga[].node.authors[].role": "Live payloads observed only `Story & Art`, `Story`, and `Art`, but this is still treated as open without explicit doc confirmation.",
    "related_manga[].node.media_type": "Live payloads observed 17 distinct media types at the top level including `unknown`, so related media types stay open as well.",
    "related_manga[].node.my_list_status.finish_date": "List-status dates are nullable partial-date strings on the wire.",
    "related_manga[].node.my_list_status.start_date": "List-status dates are nullable partial-date strings on the wire.",
    "related_manga[].node.num_chapters": "Live payloads encoded this as an integer when present; omitted values should be normalized to null.",
    "related_manga[].node.num_volumes": "Live payloads encoded this as an integer when present; omitted values should be normalized to null.",
    "related_anime[].relation_type": "Live payloads observed 11 wire values such as `sequel`, `prequel`, `side_story`, and `full_story`; treat as open.",
    "related_anime[].relation_type_formatted": "Live payloads observed 11 formatted relation labels; treat as open formatting rather than a closed enum.",
    "related_manga[].relation_type": "Live payloads observed 10 wire values such as `spin_off`, `adaptation`, and `parent_story`; treat as open.",
    "related_manga[].relation_type_formatted": "Live payloads observed 10 formatted relation labels; treat as open formatting rather than a closed enum.",
    "statistics.status.completed": "Live payloads return these per-status counts as decimal strings, not JSON integers.",
    "statistics.status.dropped": "Live payloads return these per-status counts as decimal strings, not JSON integers.",
    "statistics.status.on_hold": "Live payloads return these per-status counts as decimal strings, not JSON integers.",
    "statistics.status.plan_to_watch": "Live payloads return these per-status counts as decimal strings, not JSON integers.",
    "statistics.status.watching": "Live payloads return these per-status counts as decimal strings, not JSON integers.",
    "videos[].created_at": "Live payloads return video timestamps as Unix epoch milliseconds, not ISO datetime strings.",
    "videos[].updated_at": "Live payloads return video timestamps as Unix epoch milliseconds, not ISO datetime strings.",
}


ENUM_METADATA_HINTS = {
    "genres[].name": {
        "basis": "union of website genre/theme/demographic filters and live API observed values",
        "values": [
            "Action",
            "Adult Cast",
            "Adventure",
            "Anthropomorphic",
            "Avant Garde",
            "Award Winning",
            "Boys Love",
            "CGDCT",
            "Childcare",
            "Combat Sports",
            "Comedy",
            "Crossdressing",
            "Delinquents",
            "Detective",
            "Drama",
            "Ecchi",
            "Educational",
            "Eligible Titles for You Should Read This",
            "Erotica",
            "Fantasy",
            "Gag Humor",
            "Girls Love",
            "Gore",
            "Gourmet",
            "Harem",
            "Hentai",
            "High Stakes Game",
            "Historical",
            "Horror",
            "Idols (Female)",
            "Idols (Male)",
            "Isekai",
            "Iyashikei",
            "Josei",
            "Kids",
            "Love Polygon",
            "Love Status Quo",
            "Magical Sex Shift",
            "Mahou Shoujo",
            "Martial Arts",
            "Mecha",
            "Medical",
            "Memoir",
            "Military",
            "Music",
            "Mystery",
            "Mythology",
            "Organized Crime",
            "Otaku Culture",
            "Parody",
            "Performing Arts",
            "Pets",
            "Psychological",
            "Racing",
            "Reincarnation",
            "Reverse Harem",
            "Romance",
            "Samurai",
            "School",
            "Sci-Fi",
            "Seinen",
            "Shoujo",
            "Shounen",
            "Showbiz",
            "Slice of Life",
            "Space",
            "Sports",
            "Strategy Game",
            "Super Power",
            "Supernatural",
            "Survival",
            "Suspense",
            "Team Sports",
            "Time Travel",
            "Urban Fantasy",
            "Vampire",
            "Video Game",
            "Villainess",
            "Visual Arts",
            "Workplace",
        ],
    },
    "media_type": {
        "basis": "live API observed values; open enum because `unknown` appears on the wire",
        "mode": "observed",
    },
    "my_list_status.priority": {
        "basis": "official MAL API docs",
        "values": list(range(0, 3)),
    },
    "my_list_status.score": {
        "basis": "official MAL API docs",
        "values": list(range(0, 11)),
    },
    "my_list_status.status": {
        "basis": "official MAL API docs",
        "values": [
            "watching",
            "completed",
            "on_hold",
            "dropped",
            "plan_to_watch",
            "reading",
            "plan_to_read",
        ],
    },
    "nsfw": {
        "basis": "live API observed values; open enum because no exhaustive MAL doc set was confirmed",
        "mode": "observed",
    },
    "related_anime[].relation_type": {
        "basis": "live API observed values from anime detail payloads",
        "mode": "observed",
    },
    "related_anime[].relation_type_formatted": {
        "basis": "live API observed values from anime detail payloads",
        "mode": "observed",
    },
    "related_manga[].relation_type": {
        "basis": "live API observed values from manga detail payloads",
        "mode": "observed",
    },
    "related_manga[].relation_type_formatted": {
        "basis": "live API observed values from manga detail payloads",
        "mode": "observed",
    },
    "status": {
        "basis": "website-confirmed families plus live API observed wire values",
        "values": [
            "finished_airing",
            "currently_airing",
            "not_yet_aired",
            "finished",
            "currently_publishing",
            "on_hiatus",
            "discontinued",
            "not_yet_published",
        ],
    },
    "broadcast.day_of_the_week": {
        "basis": "live API observed values from anime detail and list payloads",
        "mode": "observed",
    },
    "rating": {
        "basis": "official MAL API docs and live API observed wire values",
        "values": ["g", "pg", "pg_13", "r", "r+", "rx"],
    },
    "related_manga[].node.authors[].role": {
        "basis": "live API observed values from related manga author payloads",
        "copy_from": "authors[].role",
    },
    "source": {
        "basis": "live API observed values; open enum because the domain is broader than the website subset",
        "mode": "observed",
    },
    "authors[].role": {
        "basis": "live API observed values from manga detail payloads",
        "mode": "observed",
    },
    "my_list_status.rewatch_value": {
        "basis": "official MAL API docs",
        "values": list(range(0, 6)),
    },
    "related_manga[].node.media_type": {
        "basis": "live API observed values; open enum because `unknown` appears on the wire",
        "copy_from": "media_type",
    },
    "related_manga[].node.my_list_status.priority": {
        "basis": "official MAL API docs",
        "values": list(range(0, 3)),
    },
    "related_manga[].node.my_list_status.reread_value": {
        "basis": "official MAL API docs",
        "values": list(range(0, 6)),
    },
    "related_manga[].node.my_list_status.score": {
        "basis": "official MAL API docs",
        "values": list(range(0, 11)),
    },
    "related_manga[].node.my_list_status.status": {
        "basis": "official MAL API docs",
        "values": ["reading", "completed", "on_hold", "dropped", "plan_to_read"],
    },
    "related_manga[].node.status": {
        "basis": "website-confirmed manga status family",
        "values": [
            "finished",
            "currently_publishing",
            "on_hiatus",
            "discontinued",
            "not_yet_published",
        ],
    },
    "start_season.season": {
        "basis": "official MAL API docs",
        "values": ["winter", "spring", "summer", "fall"],
    },
    "my_list_status.reread_value": {
        "basis": "official MAL API docs",
        "values": list(range(0, 6)),
    },
    "related_anime[].node.broadcast.day_of_the_week": {
        "basis": "live API observed values from related anime payloads",
        "copy_from": "broadcast.day_of_the_week",
    },
    "related_anime[].node.media_type": {
        "basis": "live API observed values; open enum because `unknown` appears on the wire",
        "copy_from": "media_type",
    },
    "related_anime[].node.my_list_status.priority": {
        "basis": "official MAL API docs",
        "values": list(range(0, 3)),
    },
    "related_anime[].node.my_list_status.rewatch_value": {
        "basis": "official MAL API docs",
        "values": list(range(0, 6)),
    },
    "related_anime[].node.my_list_status.score": {
        "basis": "official MAL API docs",
        "values": list(range(0, 11)),
    },
    "related_anime[].node.my_list_status.status": {
        "basis": "official MAL API docs",
        "values": ["watching", "completed", "on_hold", "dropped", "plan_to_watch"],
    },
    "related_anime[].node.rating": {
        "basis": "official MAL API docs and live API observed wire values",
        "values": ["g", "pg", "pg_13", "r", "r+", "rx"],
    },
    "related_anime[].node.source": {
        "basis": "live API observed values; open enum because the domain is broader than the website subset",
        "copy_from": "source",
    },
    "related_anime[].node.start_season.season": {
        "basis": "official MAL API docs",
        "values": ["winter", "spring", "summer", "fall"],
    },
    "related_anime[].node.status": {
        "basis": "website-confirmed anime status family",
        "values": ["finished_airing", "currently_airing", "not_yet_aired"],
    },
    "serialization[].role": {
        "basis": "unresolved; field is documented but no values were observed in cached payloads",
        "values": [],
    },
}


BOUNDED_METADATA_HINTS = {
    "mean": {
        "basis": "derived from the MAL 0-10 score scale plus live API observed values",
        "lower": 0,
        "upper": 10,
    },
}


def parse_sections(text: str) -> list[tuple[str, list[tuple[str, str, str]]]]:
    sections: list[tuple[str, list[tuple[str, str, str]]]] = []
    current_title: str | None = None
    current_rows: list[tuple[str, str, str]] = []
    in_target_table = False

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if line.startswith("## "):
            if current_title is not None and current_rows:
                sections.append((current_title, current_rows))
            current_title = line[3:]
            current_rows = []
            in_target_table = False
            continue

        if line == TABLE_HEADER:
            in_target_table = True
            continue

        if not in_target_table:
            continue

        if line.startswith("| ---"):
            continue

        if not line.startswith("|"):
            continue

        match = ROW_PATTERN.match(line)
        if not match:
            continue

        field, field_type, notes = match.groups()
        current_rows.append((field, field_type, notes))

    if current_title is not None and current_rows:
        sections.append((current_title, current_rows))

    return sections


def unwrap_nullable(type_name: str) -> str:
    while type_name.startswith("nullable<") and type_name.endswith(">"):
        type_name = type_name[len("nullable<") : -1]
    return type_name


def canonicalize_path(path: str) -> str:
    if path == "data[].list_status":
        return "my_list_status"
    if path.startswith("data[].list_status."):
        return "my_list_status." + path[len("data[].list_status.") :]
    if path == "data[].ranking":
        return "ranking"
    if path.startswith("data[].ranking."):
        return "ranking." + path[len("data[].ranking.") :]
    if path.startswith("data[].node."):
        return path[len("data[].node.") :]
    return path


def walk_json(value: Any, path: str, out: dict[str, list[Any]]) -> None:
    canonical = canonicalize_path(path) if path else ""
    if canonical:
        out.setdefault(canonical, []).append(value)

    if isinstance(value, dict):
        for key, nested in value.items():
            next_path = f"{path}.{key}" if path else key
            walk_json(nested, next_path, out)
    elif isinstance(value, list):
        next_path = f"{path}[]" if path else "[]"
        for item in value:
            walk_json(item, next_path, out)


def collect_observed_metadata(target_fields: set[str]) -> dict[str, dict[str, Any]]:
    observed: dict[str, dict[str, Any]] = {
        field: {
            "string_values": set(),
            "number_values": set(),
            "min": None,
            "max": None,
        }
        for field in target_fields
    }

    if not CACHE_DIR.exists():
        return observed

    for cache_file in sorted(CACHE_DIR.glob("*.json.gz")):
        with gzip.open(cache_file, "rt", encoding="utf-8") as handle:
            record = json.load(handle)
        flattened: dict[str, list[Any]] = {}
        walk_json(record.get("response"), "", flattened)
        for field in target_fields:
            for value in flattened.get(field, []):
                bucket = observed[field]
                string_values = bucket["string_values"]
                number_values = bucket["number_values"]
                current_min = bucket["min"]
                current_max = bucket["max"]
                if isinstance(value, str):
                    string_values.add(value)
                elif isinstance(value, bool):
                    string_values.add("true" if value else "false")
                elif isinstance(value, int) and not isinstance(value, bool):
                    number_values.add(value)
                    bucket["min"] = (
                        value if current_min is None else min(current_min, value)
                    )
                    bucket["max"] = (
                        value if current_max is None else max(current_max, value)
                    )
                elif isinstance(value, float):
                    number_values.add(value)
                    bucket["min"] = (
                        value if current_min is None else min(current_min, value)
                    )
                    bucket["max"] = (
                        value if current_max is None else max(current_max, value)
                    )

    return observed


def format_values(values: list[Any]) -> str:
    if not values:
        return "_(none observed)_"
    return ", ".join(f"`{value}`" for value in values)


def sort_values(values: set[Any]) -> list[Any]:
    if not values:
        return []
    if all(isinstance(value, (int, float)) for value in values):
        return sorted(values)
    return sorted(values, key=lambda value: str(value))


def build_enum_metadata_rows(
    rows: list[tuple[str, str, str]], observed: dict[str, dict[str, Any]]
) -> list[tuple[str, str, str, str]]:
    result: list[tuple[str, str, str, str]] = []
    for field, field_type, _ in rows:
        resolved_type = final_type(field, field_type)
        base_type = unwrap_nullable(resolved_type)
        if base_type not in {
            "enum_string",
            "enum_number",
            "closed_enum_string",
            "closed_enum_number",
        }:
            continue

        hint = ENUM_METADATA_HINTS.get(field, {})
        basis = hint.get("basis", "live API observed values")
        if "values" in hint:
            values = list(hint["values"])
        else:
            source_field = str(hint.get("copy_from", field))
            bucket = observed.get(source_field, {})
            raw_values = bucket.get(
                "number_values" if "number" in base_type else "string_values", set()
            )
            values = sort_values(raw_values or set())
        result.append((field, resolved_type, str(basis), format_values(list(values))))
    return result


def build_bounded_metadata_rows(
    rows: list[tuple[str, str, str]], observed: dict[str, dict[str, Any]]
) -> list[tuple[str, str, str, str, str, str, str]]:
    result: list[tuple[str, str, str, str, str, str, str]] = []
    for field, field_type, _ in rows:
        resolved_type = final_type(field, field_type)
        base_type = unwrap_nullable(resolved_type)
        if base_type not in {"bounded_integer", "bounded_number"}:
            continue

        hint = BOUNDED_METADATA_HINTS.get(field, {})
        bucket = observed.get(field, {})
        observed_min = bucket.get("min")
        observed_max = bucket.get("max")
        result.append(
            (
                field,
                resolved_type,
                str(hint.get("basis", "")),
                str(hint.get("lower", "")),
                str(hint.get("upper", "")),
                "" if observed_min is None else str(observed_min),
                "" if observed_max is None else str(observed_max),
            )
        )
    return result


def final_type(field: str, current_type: str) -> str:
    return TYPE_OVERRIDES.get(field, current_type)


def final_note(field: str, current_note: str) -> str:
    return NOTE_OVERRIDES.get(field, current_note)


def collect_changes(
    sections: list[tuple[str, list[tuple[str, str, str]]]],
) -> list[tuple[str, str, str, str]]:
    changes: list[tuple[str, str, str, str]] = []
    for _, rows in sections:
        for field, current_type, current_note in rows:
            updated_type = final_type(field, current_type)
            updated_note = final_note(field, current_note)
            if updated_type != current_type or updated_note != current_note:
                changes.append((field, current_type, updated_type, updated_note))
    return changes


def render() -> str:
    sections = parse_sections(UPDATED_HYPOTHESIS_PATH.read_text())
    changes = collect_changes(sections)
    all_rows = [row for _, rows in sections for row in rows]
    metadata_fields = {field for field, _, _ in all_rows}
    observed = collect_observed_metadata(metadata_fields)
    enum_metadata_rows = build_enum_metadata_rows(all_rows, observed)
    bounded_metadata_rows = build_bounded_metadata_rows(all_rows, observed)

    lines = [
        "# Finalized Types",
        "",
        "Final field types synthesized from docs, website inspection, and live API frequency analysis across 2,080 cached responses.",
        "These canonical paths stay aligned with the reference field lists rather than the transport wrapper paths used in list endpoints.",
        "",
        "## Analysis Basis",
        "",
        "- Source analysis: `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_analysis.json`",
        "- Source summary: `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_summary.md`",
        "- Cached responses analyzed: `2080`",
        "- Distinct field paths observed: `225`",
        "",
        "## Additional Type Labels Used Here",
        "",
        "- `integer_string`: decimal integer encoded as a JSON string on the wire",
        "- `timestamp_ms_integer`: Unix timestamp in milliseconds encoded as a JSON integer",
        "",
        "## Key Finalization Decisions",
        "",
        "- Treat omission and nullability as equivalent at the schema layer; fields omitted by MAL should be normalized to `null`.",
        "- Downgrade `media_type` from closed to open enum because live payloads included `unknown` in addition to the documented website categories.",
        "- Promote list-status date fields to `partial_date_string` because live payloads included year-only values.",
        "- Treat `statistics.status.*` counts as `integer_string` because the API returns them as numeric strings.",
        "- Treat `videos[].created_at` and `videos[].updated_at` as `timestamp_ms_integer` because the API returns epoch milliseconds, not ISO timestamps.",
        "",
        "## Changes From `updated-hypothesis.md`",
        "",
        "| Field | Previous | Final | Why |",
        "| --- | --- | --- | --- |",
    ]

    for field, previous_type, updated_type, note in changes:
        lines.append(f"| `{field}` | `{previous_type}` | `{updated_type}` | {note} |")

    lines.extend(
        [
            "",
            "## Enum Metadata",
            "",
            "| Field | Type | Basis | Values |",
            "| --- | --- | --- | --- |",
        ]
    )

    for field, field_type, basis, values in enum_metadata_rows:
        lines.append(f"| `{field}` | `{field_type}` | {basis} | {values} |")

    lines.extend(
        [
            "",
            "## Bounded Metadata",
            "",
            "| Field | Type | Basis | Lower Bound | Upper Bound | Observed Min | Observed Max |",
            "| --- | --- | --- | --- | --- | --- | --- |",
        ]
    )

    for (
        field,
        field_type,
        basis,
        lower,
        upper,
        observed_min,
        observed_max,
    ) in bounded_metadata_rows:
        lines.append(
            f"| `{field}` | `{field_type}` | {basis} | `{lower}` | `{upper}` | `{observed_min}` | `{observed_max}` |"
        )

    lines.append("")

    for section_title, rows in sections:
        lines.extend(
            [
                f"## {section_title}",
                "",
                "| Field | Final Type | Evidence Notes |",
                "| --- | --- | --- |",
            ]
        )
        for field, current_type, current_note in rows:
            lines.append(
                f"| `{field}` | `{final_type(field, current_type)}` | {final_note(field, current_note)} |"
            )
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    OUTPUT_PATH.write_text(render())
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
