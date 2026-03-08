from __future__ import annotations

import gzip
import json
from pathlib import Path


CACHE_DIR = Path(__file__).resolve().parent / "output" / "responses"


def walk(value, path):
    if path == "statistics.status.completed":
        print(path, type(value).__name__, repr(value)[:120])
    if path in {
        "videos[].created_at",
        "videos[].updated_at",
        "my_list_status.start_date",
        "my_list_status.finish_date",
    }:
        print(path, type(value).__name__, repr(value)[:120])

    if isinstance(value, dict):
        for key, nested in value.items():
            next_path = f"{path}.{key}" if path else key
            walk(nested, next_path)
    elif isinstance(value, list):
        next_path = f"{path}[]" if path else "[]"
        for item in value:
            walk(item, next_path)


def main() -> None:
    seen = 0
    for path in sorted(CACHE_DIR.glob("*.json.gz")):
        with gzip.open(path, "rt", encoding="utf-8") as handle:
            record = json.load(handle)
        response = record.get("response")
        if isinstance(response, dict):
            walk(response, "")
            seen += 1
        if seen >= 5:
            break


if __name__ == "__main__":
    main()
