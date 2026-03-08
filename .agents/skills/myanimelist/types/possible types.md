# Possible Types

This file defines the reusable type labels for the first-pass MyAnimeList field typing work.

## Principles

- Prefer general type labels over value-specific typing.
- Use semantic string labels when format matters; otherwise use `string`.
- Use enum families without listing concrete values.
- Treat enums as open by default unless docs clearly define the full allowed set.
- Handle field omission at parse time rather than modeling `optional<T>` in this taxonomy.
- Use wrappers such as `nullable<T>` and `array<T>` instead of inventing one-off labels.
- Type container paths like `genres` or `authors[].node` structurally as `array<object>` or `object`.

## Wrappers

- `nullable<T>`: the value may be `null`.
- `array<T>`: an ordered JSON array of `T` values.

## Base Types

| Label | Meaning | Typical MAL-style examples |
| --- | --- | --- |
| `object` | JSON object with named child fields | `main_picture`, `broadcast`, `ranking` |
| `string` | Free-form text or label string | `title`, `synopsis`, `comments`, `name` |
| `integer` | Whole-number value | `id`, `num_episodes`, `year`, `rank` |
| `number` | Numeric value that may be fractional | `mean` |
| `bounded_integer` | Whole-number value constrained to a known numeric range | count-like or score-like integer ranges |
| `bounded_number` | Numeric value constrained to a known numeric range | average/rating-like derived values |
| `boolean` | True/false value | `is_rewatching`, `is_rereading` |
| `integer_like` | Decimal integer encoded as either a JSON string or a JSON integer | `statistics.status.completed` |
| `enum_string` | String categorical value; some values may be known, but the full set may be open | `status`, `media_type`, `rating`, `source` |
| `enum_number` | Numeric categorical value; some values may be known, but the full set may be open | category-like numeric codes |
| `closed_enum_string` | String categorical value with a doc-confirmed exhaustive set | documented status/ranking families |
| `closed_enum_number` | Numeric categorical value with a doc-confirmed exhaustive set | documented score/priority-style ranges |
| `date_string` | Full calendar date string | `YYYY-MM-DD` |
| `partial_date_string` | Date string that may be year-only, year-month, or full date | `2017`, `2017-10`, `2017-10-23` |
| `time_string` | Time-of-day string | `01:35` |
| `datetime_string` | Timestamp string with date, time, and timezone | `2015-03-02T06:03:11+00:00` |
| `timestamp_ms_integer` | Unix timestamp in milliseconds encoded as an integer | `videos[].created_at` |
| `url_string` | Absolute URL string | `videos[].url` |
| `unknown` | Not enough evidence yet to make a tighter guess | fallback only |

## Common Structural Combinations

- `array<string>`
- `array<integer>`
- `array<enum_string>`
- `array<object>`
- `nullable<string>`
- `nullable<number>`
- `nullable<bounded_integer>`
- `nullable<bounded_number>`
- `nullable<integer_like>`
- `nullable<enum_string>`
- `nullable<partial_date_string>`
- `nullable<datetime_string>`
- `nullable<object>`
- `nullable<array<string>>`
- `nullable<array<object>>`

## Notes For The Next Step

- Prefer `partial_date_string` for MAL fields documented as year, year-month, or full date.
- Prefer `datetime_string` for `created_at` and `updated_at` style fields.
- Prefer `url_string` for all absolute URLs, including image asset URLs.
- Treat omitted fields as equivalent to `null` during validation and schema generation.
- Prefer `bounded_number` for derived aggregates like MAL mean scores when the value is numeric and range-constrained rather than categorical.
- Prefer `bounded_integer` for numeric ranges that are not categorical enums.
- Prefer `enum_string` and `enum_number` as the safe default when a field is categorical but the domain may not be exhaustively documented.
- Upgrade to `closed_enum_string` or `closed_enum_number` only when the docs explicitly define the full allowed set.
- Prefer `object` plus typed child paths instead of introducing object-specific labels such as `ranking_object` or `broadcast_object`.
- Use `unknown` only when neither docs, field name, nor observed payload shape gives enough evidence.
