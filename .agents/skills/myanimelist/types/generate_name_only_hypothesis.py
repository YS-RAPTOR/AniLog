from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
TYPES_DIR = Path(__file__).resolve().parent
OUTPUT = TYPES_DIR / "hypothesis.md"

REFERENCE_FILES = {
    "anime": ROOT / "references" / "commonanimefields.md",
    "manga": ROOT / "references" / "commonmangafields.md",
}


def parse_fields(path: Path) -> list[str]:
    fields: list[str] = []
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("- `") and line.endswith("`"):
            fields.append(line[3:-1])
    return fields


def build_children_index(fields: set[str]) -> dict[str, list[str]]:
    children = {field: [] for field in fields}
    for field in fields:
        for candidate in fields:
            if candidate == field:
                continue
            if candidate.startswith(field + ".") or candidate.startswith(field + "[]"):
                children[field].append(candidate)
    return children


def leaf_name(field: str) -> str:
    normalized = field[:-2] if field.endswith("[]") else field
    return normalized.split(".")[-1]


def infer_leaf_type(field: str) -> str:
    name = leaf_name(field)

    if field.startswith("statistics.status."):
        return "integer"

    if name in {"large", "medium", "thumbnail", "url"}:
        return "url_string"
    if name in {"created_at", "updated_at"}:
        return "datetime_string"
    if name == "start_time":
        return "time_string"
    if name in {"start_date", "end_date", "finish_date"}:
        return "date_string"
    if name == "mean":
        return "bounded_number"
    if name in {"score", "priority", "rewatch_value", "reread_value"}:
        return "enum_number"
    if name.startswith("is_"):
        return "boolean"
    if name == "id" or name.endswith("_id"):
        return "integer"
    if name.startswith("num_"):
        return "integer"
    if name in {
        "year",
        "rank",
        "previous_rank",
        "popularity",
        "average_episode_duration",
    }:
        return "integer"
    if name in {
        "nsfw",
        "status",
        "media_type",
        "rating",
        "source",
        "season",
        "day_of_the_week",
        "relation_type",
        "relation_type_formatted",
        "role",
    }:
        return "enum_string"
    return "string"


def infer_type(field: str, fields: set[str], children: dict[str, list[str]]) -> str:
    field_children = children.get(field, [])

    if field.endswith("[]"):
        if any(child.startswith(field + ".") for child in field_children):
            return "object"
        return infer_leaf_type(field)

    if any(child.startswith(field + "[]") for child in field_children):
        item_field = field + "[]"
        item_type = (
            infer_type(item_field, fields, children)
            if item_field in fields
            else "unknown"
        )
        return f"array<{item_type}>"

    if any(child.startswith(field + ".") for child in field_children):
        return "object"

    return infer_leaf_type(field)


def render_section(
    title: str, fields: list[str], fields_set: set[str], children: dict[str, list[str]]
) -> list[str]:
    lines = [f"## {title}", "", "| Field | Hypothesis |", "| --- | --- |"]
    for field in fields:
        lines.append(f"| `{field}` | `{infer_type(field, fields_set, children)}` |")
    lines.append("")
    return lines


def main() -> None:
    anime_fields = set(parse_fields(REFERENCE_FILES["anime"]))
    manga_fields = set(parse_fields(REFERENCE_FILES["manga"]))
    all_fields = anime_fields | manga_fields
    children = build_children_index(all_fields)

    shared = sorted(anime_fields & manga_fields)
    anime_only = sorted(anime_fields - manga_fields)
    manga_only = sorted(manga_fields - anime_fields)

    lines = [
        "# Hypothesis",
        "",
        "Best-guess field type hypotheses derived from field names and path structure only.",
        "No live payload validation or endpoint-document confirmation has been applied yet.",
        "",
        "Type labels come from `possible types.md`.",
        "",
        f"- Shared field paths: {len(shared)}",
        f"- Anime-only field paths: {len(anime_only)}",
        f"- Manga-only field paths: {len(manga_only)}",
        "",
    ]

    lines.extend(
        render_section("Shared Anime + Manga Fields", shared, all_fields, children)
    )
    lines.extend(render_section("Anime-Only Fields", anime_only, all_fields, children))
    lines.extend(render_section("Manga-Only Fields", manga_only, all_fields, children))

    OUTPUT.write_text("\n".join(lines))
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
