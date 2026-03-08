#!/usr/bin/env python3

from __future__ import annotations

from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENDPOINTS_DIR = ROOT / "endpoints"
OUTPUT_DIR = ROOT / "references"
OUTPUT_FILE = OUTPUT_DIR / "commonanimefields.md"


def endpoint_title(path: Path) -> str:
    first = path.read_text(encoding="utf-8").splitlines()[0].strip()
    return first.removeprefix("# ").strip() if first.startswith("#") else path.name


def endpoint_method(path: Path) -> str:
    title = endpoint_title(path)
    return title.split(" ", 1)[0] if " " in title else ""


def is_anime_endpoint(path: Path) -> bool:
    name = path.name
    if not name.endswith(".md") or name == "INDEX.md":
        return False
    return "__anime" in name or "__animelist" in name


def parse_fields(path: Path) -> list[str]:
    fields: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line.startswith("- "):
            continue
        value = line[2:].strip()
        if value == "(no response schema fields)":
            continue
        fields.append(value)
    return fields


def canonicalize(field: str, endpoint_name: str) -> str | None:
    if field in {
        "data",
        "data[]",
        "data[].node",
        "paging",
        "paging.previous",
        "paging.next",
        "season",
        "season.year",
        "season.season",
    }:
        return None

    if field.startswith("data[].node."):
        return field.removeprefix("data[].node.")
    if field.startswith("data[].ranking"):
        return field.removeprefix("data[].")
    if field == "data[].list_status":
        return "my_list_status"

    if endpoint_name.startswith("patch__anime__"):
        if field.startswith("my_list_status."):
            return field
        return f"my_list_status.{field}"

    return field


def main() -> None:
    endpoint_files = sorted(p for p in ENDPOINTS_DIR.iterdir() if is_anime_endpoint(p))
    endpoint_to_fields: dict[str, set[str]] = {}
    endpoint_title_map: dict[str, str] = {}

    for path in endpoint_files:
        endpoint_title_map[path.name] = endpoint_title(path)
        canonical_fields = {
            value
            for value in (
                canonicalize(field, path.name) for field in parse_fields(path)
            )
            if value
        }
        endpoint_to_fields[path.name] = canonical_fields

    common_scope = [
        endpoint_to_fields[path.name]
        for path in endpoint_files
        if endpoint_method(path) == "GET" and endpoint_to_fields[path.name]
    ]

    non_empty_sets = (
        common_scope
        if common_scope
        else [fields for fields in endpoint_to_fields.values() if fields]
    )
    common_fields = set.intersection(*non_empty_sets) if non_empty_sets else set()

    field_to_endpoints: dict[str, set[str]] = defaultdict(set)
    for endpoint, fields in endpoint_to_fields.items():
        for field in fields:
            field_to_endpoints[field].add(endpoint)

    unique_by_endpoint = {}
    for endpoint, fields in endpoint_to_fields.items():
        uniques = sorted(
            field
            for field in fields
            if len(field_to_endpoints[field]) == 1 and field not in common_fields
        )
        unique_by_endpoint[endpoint] = uniques

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    lines: list[str] = [
        "# Common Anime Fields",
        "",
        "Generated from `.agents/skills/myanimelist/endpoints/*.md` anime endpoints.",
        "Common fields are intersected across GET anime endpoints; unique fields are computed across all included anime endpoints.",
        "",
        f"Endpoints included: {len(endpoint_files)}",
        "",
        "## Common Fields Across Anime Endpoints",
    ]

    if common_fields:
        lines.append("")
        lines.extend(f"- `{field}`" for field in sorted(common_fields))
    else:
        lines.extend(["", "- _(none)_"])

    lines.extend(["", "## Unique Fields By Endpoint"])

    for endpoint in sorted(endpoint_files, key=lambda p: endpoint_title_map[p.name]):
        title = endpoint_title_map[endpoint.name]
        lines.extend(["", f"### {title}", ""])
        uniques = unique_by_endpoint[endpoint.name]
        if uniques:
            lines.extend(f"- `{field}`" for field in uniques)
        else:
            lines.append("- _(none)_")

    OUTPUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
