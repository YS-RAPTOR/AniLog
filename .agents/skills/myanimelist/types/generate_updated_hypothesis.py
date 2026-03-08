from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
TYPES_DIR = Path(__file__).resolve().parent
OUTPUT = TYPES_DIR / "updated-hypothesis.md"
PREVIOUS = TYPES_DIR / "hypothesis.md"

REFERENCE_FILES = {
    "anime": ROOT / "references" / "commonanimefields.md",
    "manga": ROOT / "references" / "commonmangafields.md",
}


WEBSITE_PAGES = [
    "https://myanimelist.net/anime.php",
    "https://myanimelist.net/manga.php",
    "https://myanimelist.net/topanime.php",
    "https://myanimelist.net/topmanga.php",
    "https://myanimelist.net/anime/season",
    "https://myanimelist.net/manga/adapted",
    "https://myanimelist.net/anime/52991/Sousou_no_Frieren",
    "https://myanimelist.net/manga/2/Berserk",
]

DOC_FILES = [
    ".agents/skills/myanimelist/SKILL.md",
    ".agents/skills/myanimelist/endpoints/get__anime__anime_id.md",
    ".agents/skills/myanimelist/endpoints/get__manga__manga_id.md",
    ".agents/skills/myanimelist/endpoints/get__anime__ranking.md",
    ".agents/skills/myanimelist/endpoints/get__manga__ranking.md",
    ".agents/skills/myanimelist/endpoints/get__anime__season__year__season.md",
    ".agents/skills/myanimelist/endpoints/get__users__user_name__animelist.md",
    ".agents/skills/myanimelist/endpoints/get__users__user_name__mangalist.md",
    ".agents/skills/myanimelist/endpoints/patch__anime__anime_id__my_list_status.md",
    ".agents/skills/myanimelist/endpoints/patch__manga__manga_id__my_list_status.md",
]

OFFICIAL_DOC_URLS = [
    "https://myanimelist.net/apiconfig/references/api/v2",
    "https://myanimelist.net/apiconfig/references/authorization",
]


def parse_fields(path: Path) -> list[str]:
    fields: list[str] = []
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if line.startswith("- `") and line.endswith("`"):
            fields.append(line[3:-1])
    return fields


def parse_previous_hypothesis(path: Path) -> dict[str, str]:
    mapping: dict[str, str] = {}
    pattern = re.compile(r"^\| `([^`]+)` \| `([^`]+)` \|$")
    for line in path.read_text().splitlines():
        match = pattern.match(line.strip())
        if match:
            field, field_type = match.groups()
            mapping[field] = field_type
    return mapping


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


def infer_name_only_leaf_type(field: str) -> str:
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


def infer_type_with_leaf(
    field: str, fields: set[str], children: dict[str, list[str]], infer_leaf
) -> str:
    field_children = children.get(field, [])

    if field.endswith("[]"):
        if any(child.startswith(field + ".") for child in field_children):
            return "object"
        return infer_leaf(field)

    if any(child.startswith(field + "[]") for child in field_children):
        item_field = field + "[]"
        item_type = (
            infer_type_with_leaf(item_field, fields, children, infer_leaf)
            if item_field in fields
            else "unknown"
        )
        return f"array<{item_type}>"

    if any(child.startswith(field + ".") for child in field_children):
        return "object"

    return infer_leaf(field)


GENRES_NAME_FIELDS = {
    "genres[].name",
}

PARTIAL_DATE_FIELDS = {
    "start_date",
}

NULLABLE_PARTIAL_DATE_FIELDS = {
    "end_date",
}

NULLABLE_INTEGER_FIELDS = {
    "num_episodes",
    "num_chapters",
    "num_volumes",
    "related_anime[].node.num_episodes",
    "related_manga[].node.num_chapters",
    "related_manga[].node.num_volumes",
}

NOTE_OVERRIDES = {
    "genres[].name": "Website filters expose MAL-controlled genre, theme, explicit-genre, and demographic labels.",
    "start_date": "Official MAL API docs define date values as `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`, so series dates are modeled as partial dates.",
    "end_date": "Official MAL API docs define date values as partial dates, and website detail pages show open-ended ongoing values such as `?`.",
    "num_episodes": "Seasonal anime entries can show unknown episode totals as '? eps'.",
    "num_chapters": "Manga detail and adapted pages can show unknown chapter totals as '? chp' or 'Unknown'.",
    "num_volumes": "Top manga, detail, and adapted pages can show unknown volume totals as '? vol' or 'Unknown'.",
    "media_type": "Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua.",
    "rating": "Anime search and detail pages show G, PG, PG-13, R, R+, and Rx.",
    "start_season.season": "Official MAL API docs define seasonal values as `winter|spring|summer|fall`, which aligns with website seasonal navigation.",
    "broadcast.day_of_the_week": "Anime detail pages render weekday labels such as Fridays.",
    "broadcast.start_time": "Official MAL API docs define time values like `01:35`, and anime detail pages render 24-hour broadcast times such as `23:00`.",
    "source": "Observed source labels on website pages include Manga, Light novel, and Novel.",
    "my_list_status.status": "Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`).",
    "my_list_status.score": "Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets.",
    "my_list_status.priority": "Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates.",
    "my_list_status.rewatch_value": "Official MAL API docs define anime rewatch value as `int 0-5`.",
    "my_list_status.reread_value": "Official MAL API docs define manga reread value as `int 0-5`.",
    "status": "Website filters show domain-specific closed status sets; anime uses Finished Airing/Currently Airing/Not yet aired, manga uses Finished Publishing/Publishing/On Hiatus/Discontinued/Not yet published.",
    "authors[].role": "Manga detail pages show controlled author-role labels such as Story & Art and Art.",
    "related_anime[].relation_type": "Detail pages show labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off; this set is likely incomplete.",
    "related_anime[].relation_type_formatted": "Detail pages show formatted relation labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off.",
    "related_manga[].relation_type": "Detail pages show labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off; this set is likely incomplete.",
    "related_manga[].relation_type_formatted": "Detail pages show formatted relation labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off.",
}


def infer_updated_type(
    field: str, fields: set[str], children: dict[str, list[str]]
) -> str:
    current = infer_type_with_leaf(field, fields, children, infer_name_only_leaf_type)

    if field in NULLABLE_INTEGER_FIELDS:
        return "nullable<integer>"

    if field in PARTIAL_DATE_FIELDS:
        return "partial_date_string"

    if field in NULLABLE_PARTIAL_DATE_FIELDS:
        return "nullable<partial_date_string>"

    if field in GENRES_NAME_FIELDS:
        return "enum_string"

    if field == "media_type" or field.endswith(".media_type"):
        return "closed_enum_string"

    if field == "rating" or field.endswith(".rating"):
        return "closed_enum_string"

    if field == "start_season.season" or field.endswith(".start_season.season"):
        return "closed_enum_string"

    if field == "status" or field.endswith(".node.status"):
        return "closed_enum_string"

    if field == "my_list_status.status" or field.endswith(".my_list_status.status"):
        return "closed_enum_string"

    if field == "my_list_status.score" or field.endswith(".my_list_status.score"):
        return "closed_enum_number"

    if field == "my_list_status.priority" or field.endswith(".my_list_status.priority"):
        return "closed_enum_number"

    if field == "my_list_status.rewatch_value" or field.endswith(
        ".my_list_status.rewatch_value"
    ):
        return "closed_enum_number"

    if field == "my_list_status.reread_value" or field.endswith(
        ".my_list_status.reread_value"
    ):
        return "closed_enum_number"

    return current


def note_for(field: str) -> str:
    if field in NOTE_OVERRIDES:
        return NOTE_OVERRIDES[field]

    if field.endswith(".media_type"):
        return NOTE_OVERRIDES["media_type"]
    if field.endswith(".rating"):
        return NOTE_OVERRIDES["rating"]
    if field.endswith(".start_season.season"):
        return NOTE_OVERRIDES["start_season.season"]
    if field.endswith(".my_list_status.status"):
        return NOTE_OVERRIDES["my_list_status.status"]
    if field.endswith(".my_list_status.score"):
        return NOTE_OVERRIDES["my_list_status.score"]
    if field.endswith(".my_list_status.priority"):
        return NOTE_OVERRIDES["my_list_status.priority"]
    if field.endswith(".my_list_status.rewatch_value"):
        return NOTE_OVERRIDES["my_list_status.rewatch_value"]
    if field.endswith(".my_list_status.reread_value"):
        return NOTE_OVERRIDES["my_list_status.reread_value"]
    if field.endswith(".source"):
        return NOTE_OVERRIDES["source"]
    if field.endswith(".relation_type"):
        return NOTE_OVERRIDES["related_anime[].relation_type"]
    if field.endswith(".relation_type_formatted"):
        return NOTE_OVERRIDES["related_anime[].relation_type_formatted"]
    if field.endswith(".node.num_episodes"):
        return NOTE_OVERRIDES["num_episodes"]
    if field.endswith(".node.num_chapters"):
        return NOTE_OVERRIDES["num_chapters"]
    if field.endswith(".node.num_volumes"):
        return NOTE_OVERRIDES["num_volumes"]
    if field.endswith(".start_time"):
        return NOTE_OVERRIDES["broadcast.start_time"]
    if field.endswith(".day_of_the_week"):
        return NOTE_OVERRIDES["broadcast.day_of_the_week"]
    if field.endswith(".node.status"):
        return "Website filters show domain-specific closed status sets for anime and manga entries."
    return ""


def render_table(
    title: str, fields: list[str], fields_set: set[str], children: dict[str, list[str]]
) -> list[str]:
    lines = [
        f"## {title}",
        "",
        "| Field | Updated Hypothesis | Evidence Notes |",
        "| --- | --- | --- |",
    ]
    for field in fields:
        field_type = infer_updated_type(field, fields_set, children)
        note = note_for(field)
        lines.append(f"| `{field}` | `{field_type}` | {note} |")
    lines.append("")
    return lines


def main() -> None:
    anime_fields = set(parse_fields(REFERENCE_FILES["anime"]))
    manga_fields = set(parse_fields(REFERENCE_FILES["manga"]))
    all_fields = anime_fields | manga_fields
    children = build_children_index(all_fields)
    previous = parse_previous_hypothesis(PREVIOUS)

    shared = sorted(anime_fields & manga_fields)
    anime_only = sorted(anime_fields - manga_fields)
    manga_only = sorted(manga_fields - anime_fields)
    all_sorted = sorted(all_fields)

    changes: list[tuple[str, str, str, str]] = []
    for field in all_sorted:
        old_type = previous.get(field, "unknown")
        new_type = infer_updated_type(field, all_fields, children)
        if old_type != new_type:
            changes.append((field, old_type, new_type, note_for(field)))

    lines = [
        "# Updated Hypothesis",
        "",
        "Field type hypotheses revised using local MAL docs, official MAL doc websites, plus website filters, rankings, seasonal pages, and sample detail pages.",
        "The goal is still general typing, but official-doc-backed constraints let us tighten several categorical, range, and date assumptions.",
        "",
        "## Docs Inspected",
        "",
    ]
    lines.extend(f"- `{path}`" for path in DOC_FILES)
    lines.extend(
        [
            "",
            "## Official Doc Websites Inspected",
            "",
        ]
    )
    lines.extend(f"- `{url}`" for url in OFFICIAL_DOC_URLS)
    lines.extend(
        [
            "",
            "## Pages Inspected",
            "",
        ]
    )
    lines.extend(f"- `{page}`" for page in WEBSITE_PAGES)
    lines.extend(
        [
            "",
            "## Official Docs-Derived Constraints",
            "",
            "| Family | Doc Evidence |",
            "| --- | --- |",
            "| `datetime` fields | `date-time: 2015-03-02T06:03:11+00:00` |",
            "| `partial_date` fields | `date: 2017-10-23` or `2017-10` or `2017` |",
            "| `time` fields | `time: 01:35` |",
            "| `start_season.season` | `winter|spring|summer|fall` |",
            "| `anime my_list_status.status` | `watching|completed|on_hold|dropped|plan_to_watch` |",
            "| `manga my_list_status.status` | `reading|completed|on_hold|dropped|plan_to_read` |",
            "| `score` | `int 0-10` |",
            "| `priority` | `int 0-2` |",
            "| `rewatch_value` / `reread_value` | `int 0-5` |",
            "| booleans | `is_rewatching` and `is_rereading` are documented as boolean |",
            "",
            "## Website-Derived Value Families",
            "",
            "| Family | Observed Website Values |",
            "| --- | --- |",
            "| `anime.media_type` | `TV`, `OVA`, `Movie`, `Special`, `ONA`, `Music`, `CM`, `PV`, `TV Special` |",
            "| `manga.media_type` | `Manga`, `One-shot`, `Doujinshi`, `Light Novel`, `Novel`, `Manhwa`, `Manhua` |",
            "| `anime.rating` | `G`, `PG`, `PG-13`, `R`, `R+`, `Rx` |",
            "| `anime.status` | `Finished Airing`, `Currently Airing`, `Not yet aired` |",
            "| `manga.status` | `Finished Publishing`, `Publishing`, `On Hiatus`, `Discontinued`, `Not yet published` |",
            "| `anime.my_list_status.status` | `Watching`, `Completed`, `On-Hold`, `Dropped`, `Plan to Watch` |",
            "| `manga.my_list_status.status` | `Reading`, `Completed`, `On-Hold`, `Dropped`, `Plan to Read` |",
            "| `start_season.season` | `Winter`, `Spring`, `Summer`, `Fall` |",
            "| `relation_type_formatted` examples | `Sequel`, `Adaptation`, `Side Story`, `Other`, `Spin-Off` |",
            "",
            "## Changes From `hypothesis.md`",
            "",
            "| Field | Previous | Updated | Why |",
            "| --- | --- | --- | --- |",
        ]
    )
    for field, old_type, new_type, note in changes:
        lines.append(f"| `{field}` | `{old_type}` | `{new_type}` | {note} |")
    lines.append("")

    lines.extend(
        render_table("Shared Anime + Manga Fields", shared, all_fields, children)
    )
    lines.extend(render_table("Anime-Only Fields", anime_only, all_fields, children))
    lines.extend(render_table("Manga-Only Fields", manga_only, all_fields, children))

    OUTPUT.write_text("\n".join(lines))
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
