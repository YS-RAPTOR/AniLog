from pathlib import Path
import re


FINALIZED_PATH = Path(__file__).resolve().parent / "finalized types.md"

WEBSITE_GENRES = [
    "Action",
    "Adventure",
    "Adult Cast",
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
]


def parse_finalized_genres() -> list[str]:
    for line in FINALIZED_PATH.read_text().splitlines():
        if line.startswith("| `genres[].name` | `enum_string` | live API"):
            return re.findall(r"`([^`]+)`", line)[2:]
    raise SystemExit("Could not find genres metadata row")


def main() -> None:
    finalized = set(parse_finalized_genres())
    website = set(WEBSITE_GENRES)
    print("website_count", len(website))
    print("finalized_count", len(finalized))
    print("missing_from_finalized", sorted(website - finalized))
    print("extra_in_finalized", sorted(finalized - website))


if __name__ == "__main__":
    main()
