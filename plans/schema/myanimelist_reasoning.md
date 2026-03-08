# MyAnimeList Schema Reasoning

This file explains why `src/lib/schema/myanimelist.ts` is shaped the way it is after the latest consolidation.

## Referenced Documents

Primary local sources:

- `src/lib/schema/myanimelist.ts`
- `.agents/skills/myanimelist/types/finalized types.md`
- `.agents/skills/myanimelist/types/updated-hypothesis.md`
- `.agents/skills/myanimelist/types/possible types.md`
- `.agents/skills/myanimelist/references/commonanimefields.md`
- `.agents/skills/myanimelist/references/commonmangafields.md`
- `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_analysis.json`
- `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_summary.md`
- `.agents/skills/myanimelist/SKILL.md`

Official and website references used during the type derivation passes:

- `https://myanimelist.net/apiconfig/references/api/v2`
- `https://myanimelist.net/apiconfig/references/authorization`
- `https://myanimelist.net/anime.php`
- `https://myanimelist.net/manga.php`
- `https://myanimelist.net/topanime.php`
- `https://myanimelist.net/topmanga.php`
- `https://myanimelist.net/anime/season`
- `https://myanimelist.net/anime/52991/Sousou_no_Frieren`
- `https://myanimelist.net/manga/2/Berserk`

## Design Summary

The schema is intentionally a normalized domain schema, not a raw transport schema.

That means it models MAL entities like:

- anime nodes
- manga nodes
- list-status objects
- related anime and related manga nodes
- details-only objects such as statistics, themes, videos, and serialization rows

It does not currently model full wrapper payloads like `{ data, paging }` because the field research and final type pass were done against canonical field paths rather than wrapper-specific response objects.

## How The Source Documents Are Interpreted

The schema design comes from combining three different document layers, each serving a different purpose.

### 1. Medium-common endpoint references

The most important structural inputs are:

- `.agents/skills/myanimelist/references/commonanimefields.md`
- `.agents/skills/myanimelist/references/commonmangafields.md`

These files answer the question:

- which fields are common across the anime GET endpoints?
- which fields are common across the manga GET endpoints?
- which fields are unique to a specific endpoint?

Those files are the main reason the implementation has medium base schemas plus endpoint-specific extensions.

### 2. Finalized field typing document

`.agents/skills/myanimelist/types/finalized types.md` answers a different question:

- what is the best final type for each canonical field path?

That document is used to decide:

- whether a field is nullable
- whether a field is open or closed enum
- whether a field is an integer, bounded number, partial date, timestamp, and so on

It is not the primary source for deciding which endpoint owns a field. That ownership split comes from the common-field reference files.

### 3. Live-analysis and website/doc evidence

The live analysis and website/doc passes justify the type choices inside those schemas.

Examples:

- `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_analysis.json` justified `integer_string` and `timestamp_ms_integer`
- `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_summary.md` summarized the observed domains
- official docs and MAL website pages justified closed enums and broad value families

So the implementation uses:

- common-field references to decide structure
- finalized types to decide field validators
- live/doc/site evidence to justify those validators

## Common Fields vs Specific Fields

This distinction is one of the most important ideas in the schema.

### Common fields

Common fields are fields that the reference documents say appear across the GET endpoints for a medium.

Examples from `.agents/skills/myanimelist/references/commonanimefields.md` include:

- `id`
- `title`
- `main_picture`
- `mean`
- `media_type`
- `my_list_status`
- `status`
- `genres`

Examples from `.agents/skills/myanimelist/references/commonmangafields.md` include:

- `id`
- `title`
- `main_picture`
- `mean`
- `media_type`
- `my_list_status`
- `status`
- `authors`

These common fields form the conceptual base of `Anime` and `Manga`.

Even though the implementation now builds `Anime` from `RelatedAnimeNode.merge(...)` and `Manga` from `RelatedMangaNode.merge(...)`, the intent is still the same:

- `Anime` should represent the reusable anime field core
- `Manga` should represent the reusable manga field core

### Specific fields

Specific fields are fields that only appear for one endpoint family.

Examples:

- `ranking.*` is ranking-specific
- `videos`, `statistics`, `opening_themes`, and `ending_themes` are anime-detail-specific
- `serialization` is manga-detail-specific

These fields should not be pushed into the base `Anime` or `Manga` schemas, because doing that would incorrectly imply that every anime or manga payload includes them.

That is why the file keeps:

- `AnimeRankingSpecific`
- `AnimeDetailsSpecific`
- `MangaRankingSpecific`
- `MangaDetailsSpecific`

and then composes endpoint-capable schemas by merging them with the base schema.

## Why The Base Schema Does Not Equal “Shared Anime + Manga Fields”

One subtle point is that the `## Shared Anime + Manga Fields` section in `.agents/skills/myanimelist/types/finalized types.md` is not the same thing as the `Anime`/`Manga` base.

That section only says:

- a field path exists in both the anime and manga universes somewhere

It does not say:

- that field belongs in the medium base schema
- that field is common across all endpoints of that medium

For example, `background` appears in both anime and manga finalized lists, but it is still detail-only in practice. So it belongs in `AnimeDetailsSpecific` and `MangaDetailsSpecific`, not in the `Anime` and `Manga` bases.

This is why the implementation prefers the common-field reference files for structure instead of blindly using the shared section of the finalized type document.

## How This Distinction Appears In `src/lib/schema/myanimelist.ts`

The current file follows this layering:

1. primitive and enum helpers
2. reusable small object schemas
3. related-node subset schemas
4. base schemas for `Anime` and `Manga`
5. endpoint-specific add-on schemas
6. merged endpoint schemas

That means the base and specific layers stay conceptually separate even though they live in one file.

### Anime layering

The anime side currently works like this:

- `RelatedAnimeNode` captures the reusable anime subset seen in related-node contexts
- `Anime` adds the rest of the anime-common/base-level fields on top of that subset
- `AnimeRankingSpecific` adds only `ranking`
- `AnimeDetailsSpecific` adds only the anime-detail-only structures
- `AnimeRanking` and `AnimeDetails` are merged endpoint-capable schemas

### Manga layering

The manga side follows the same shape:

- `RelatedMangaNode` captures the reusable manga subset seen in related-node contexts
- `Manga` adds the rest of the manga-common/base-level fields on top of that subset
- `MangaRankingSpecific` adds only `ranking`
- `MangaDetailsSpecific` adds only the manga-detail-only structures
- `MangaRanking` and `MangaDetails` are merged endpoint-capable schemas

## Why Related Nodes Still Matter To The Common-vs-Specific Split

Related nodes are not “common fields” in the endpoint-reference sense. They are detail-specific structures.

However, their internal shape is still extremely valuable because they are partial medium objects. That is why the implementation reuses them as the starting point for the base schemas.

So there are really two distinct ideas working together:

- endpoint ownership: derived from the common-field reference documents
- shape reuse: derived from the fact that related nodes are smaller versions of anime or manga records

This is why the schema can both:

- keep `related_anime` and `related_manga` inside detail-specific schemas
- still build `Anime` and `Manga` on top of the related-node subsets

## Why The Schema Lives In One File

The schema was consolidated into `src/lib/schema/myanimelist.ts` for two reasons.

First, anime and manga reuse each other through related-node payloads:

- anime details include `related_manga[].node.*`
- manga details include `related_anime[].node.*`

When those lived in separate files, the shared subset problem became awkward because each side needed part of the other side, but not the full base schema.

Second, the actual MAL wire keys do not change by context. The main variation is the allowed value domain and the amount of nested data present. A single file makes it easier to:

- keep field names consistent
- keep subset schemas next to their supersets
- avoid circular imports and duplicate helper definitions
- build larger schemas from smaller related-node schemas in a readable order

## Why `Anime` And `Manga` Are Built From Related Subsets

The current file uses the idea that related-node payloads are partial versions of the full medium object.

That is why the file defines:

- `RelatedAnimeNode`
- `RelatedMangaNode`

before defining:

- `Anime`
- `Manga`

and then composes the full schemas with `.merge(...)`.

This was chosen because the reference documents show that related nodes already contain a meaningful subset of the final medium shape:

- `related_anime[].node.*` carries a partial anime record
- `related_manga[].node.*` carries a partial manga record

Building the full medium schema on top of the related subset avoids re-declaring the same core fields twice.

## Why There Are Separate Anime And Manga Validators For Same-Named Fields

The API keeps field names like `status` and `media_type`, but the allowed values differ by medium.

Because of that, the schema keeps the MAL key names unchanged while splitting the validators:

- `status` on anime uses `AnimeStatus`
- `status` on manga uses `MangaStatus`
- `media_type` on anime uses `AnimeMediaType`
- `media_type` on manga uses `MangaMediaType`
- `my_list_status.status` on anime uses `AnimeListStatus`
- `my_list_status.status` on manga uses `MangaListStatus`

This matches the conclusions in `.agents/skills/myanimelist/types/finalized types.md`, where the keys stay the same but the enum domains are medium-specific.

## Why Open Enums Use `type.cast`

The finalized type work split enums into two families:

- closed enums: documented or strongly confirmed exhaustive sets
- open enums: known values exist, but future unseen values are possible

For open enums, the schema uses this pattern:

```ts
type KnownValue = T[number]
type OpenValue = KnownValue | (string & {})

type("string" as type.cast<OpenValue>)
```

This choice was made because it gives the best tradeoff for MAL:

- runtime validation stays permissive for future values
- TypeScript still suggests the known values collected from docs and live analysis
- the code stays close to the actual final type classification in `.agents/skills/myanimelist/types/finalized types.md`

This is especially important for fields like:

- `genres[].name`
- `media_type`
- `source`
- `broadcast.day_of_the_week`
- relation-type fields

The live analysis in `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_analysis.json` showed that some fields had broad but clearly non-exhaustive observed domains. Open enums preserve that fact better than hard unions.

## Why Closed Enums Stay Strict

Closed enums were kept strict when the docs and live payloads aligned on a fixed domain.

Examples:

- `AnimeStatus`
- `MangaStatus`
- `AnimeListStatus`
- `MangaListStatus`
- `AnimeRating`
- `AnimeSeason`
- `Priority`
- `Score`
- `RewatchValue`
- `RereadValue`

This comes from the enum metadata and doc-backed constraints recorded in `.agents/skills/myanimelist/types/finalized types.md` and `.agents/skills/myanimelist/types/updated-hypothesis.md`.

## Why Some Primitive Schemas Morph Their Output

The current `src/lib/schema/myanimelist.ts` intentionally goes beyond wire-shape validation for a few primitives.

It now normalizes these values:

- `UrlString` -> `URL`
- `DatetimeString` -> `Date`
- `PartialDateString` -> `Date`
- `IntegerString` -> `number`
- `TimestampMsInteger` -> `Date`

This is a deliberate shift from the earlier raw-wire-only interpretation.

Why this is reasonable:

- the finalized type work already distinguished semantic formats like URL, datetime, partial date, integer string, and epoch-millisecond timestamp
- these are strong candidates for immediate normalization because callers almost always want structured objects or numbers rather than the raw transport string

Why this is still compatible with the document set:

- `.agents/skills/myanimelist/types/finalized types.md` defines the semantic wire categories
- `src/lib/schema/myanimelist.ts` chooses to parse those semantic wire categories into more useful output values

Important caveat:

- `PartialDateString` is now parsed with `new Date(v)`
- for inputs like `2011` or `2011-03`, JavaScript fills missing parts implicitly
- this is convenient, but it means the output no longer preserves the original date precision

That tradeoff is acceptable if the app wants normalized date objects, but it should be revisited if precision preservation matters.

## Why Nullable Fields Stay Nullable

The final type pass explicitly decided to treat omission and nullability as equivalent at the schema layer.

That decision came from:

- `.agents/skills/myanimelist/types/finalized types.md`
- live API analysis in `.agents/skills/myanimelist/types/api-frequency/output/analysis/mal_frequency_analysis.json`

The live API showed that fields like `end_date`, `num_episodes`, `num_chapters`, `num_volumes`, and list-status dates are frequently omitted instead of explicitly set to `null`.

The schema therefore models them with nullable value domains and default-null behavior, for example:

- `NullablePartialDateString.default(null)`
- `NullableInteger.default(null)`

This keeps the schema aligned with the earlier research while still producing a stable output shape.

## Why `statistics.status.*` Uses Integer-String Parsing

The live frequency analysis showed that these fields are numeric strings on the wire, not JSON numbers:

- `statistics.status.completed`
- `statistics.status.dropped`
- `statistics.status.on_hold`
- `statistics.status.plan_to_watch`
- `statistics.status.watching`

That finding is recorded directly in `.agents/skills/myanimelist/types/finalized types.md`.

So the schema uses `IntegerString` and then parses it to a number. This keeps the validation faithful to the wire format while exposing a more useful output type.

## Why Video Timestamps Use Epoch-Millisecond Parsing

The live API pass found that:

- `videos[].created_at`
- `videos[].updated_at`

are not ISO datetime strings. They are epoch-millisecond integers.

That is why the schema uses `TimestampMsInteger` and pipes it to `new Date(v)`.

This decision is directly grounded in `.agents/skills/myanimelist/types/finalized types.md` and the cached-response analysis.

## Why Genre Values Are Carried As A Known-Values Constant

The genre field is open in the schema, but the known-values list is still included because it is unusually well-supported by the source material.

That list was assembled from:

- website filters from `https://myanimelist.net/anime.php`
- website filters from `https://myanimelist.net/manga.php`
- live API observations

The final documentation pass concluded that the website filter set was fully covered and that the API added one extra value:

- `Eligible Titles for You Should Read This`

So `genreNameValues` serves as a practical autocomplete and UI helper while `GenreName` remains runtime-open.

## Why Some Known-Value Arrays Are Smaller Than The Earlier Finalized List

You adjusted `src/lib/schema/myanimelist.ts` slightly after the first implementation. The current file now reflects your preferred current schema rather than blindly copying every earlier observed value.

Examples of that effect:

- `weekdayKnownValues` now excludes `other`
- some relation-type arrays omit `other`
- anime and manga media-type known arrays omit `unknown`
- anime source known values omit `other`

Because those validators are open enums, this does not break runtime compatibility:

- the schema still accepts any string for those fields
- the arrays now act as preferred known suggestions rather than exhaustive guards

This is one of the reasons the open-enum design was chosen in the first place.

## Why `SerializationRole` Is Open

`serialization[].role` was documented but not meaningfully observed during the live API collection.

That is why it remains an open string-like schema rather than a closed literal union.

This follows the rule established in `.agents/skills/myanimelist/types/possible types.md` and preserved in `.agents/skills/myanimelist/types/finalized types.md`:

- if the field is categorical but the domain is not proven exhaustive, keep it open

## Why There Are Separate Reference And Full Related Schemas

The detail endpoints expose both lighter and richer related-item payloads depending on context.

That is why the schema distinguishes things like:

- `AnimeReference`
- `RelatedAnimeNode`
- `RelatedAnimeReference`
- `RelatedAnime`

and similarly for manga.

The reason is simple:

- some contexts only return `id`, `title`, and `main_picture`
- other contexts return a much richer partial medium node

Trying to force all related payloads into the same schema would either over-reject valid smaller payloads or under-model richer ones.

## Why Endpoint-Specific Schemas Still Exist

Even though the file is now unified, endpoint-specific schemas are still useful because the reference field documents separate common fields from unique fields.

That distinction comes directly from:

- `.agents/skills/myanimelist/references/commonanimefields.md`
- `.agents/skills/myanimelist/references/commonmangafields.md`

The endpoint-specific schemas therefore remain:

- `AnimeRankingSpecific`
- `AnimeDetailsSpecific`
- `MangaRankingSpecific`
- `MangaDetailsSpecific`

and the composed schemas remain:

- `AnimeRanking`
- `AnimeDetails`
- `MangaRanking`
- `MangaDetails`

This gives a clean mapping between the field-analysis documents and the implementation.

## Practical Interpretation Of The Current File

`src/lib/schema/myanimelist.ts` should be read as a normalized output schema layer with three main goals:

1. preserve MAL field names
2. reflect the researched field domains from the docs, website, and live API sampling
3. return more useful output values for well-understood primitive formats

That is why the file combines:

- strict enums where the domain is closed
- open enums where MAL may expand over time
- subset-first composition for related nodes
- mild output normalization for URLs, dates, timestamps, and integer strings

## If This Schema Evolves Further

The next likely improvements, if needed, are:

- preserving partial-date precision instead of converting directly to `Date`
- adding raw wrapper schemas for `{ data, paging }`
- adding fixture-based parse tests against cached payloads
- deciding whether the smaller current known-value arrays should be re-expanded to match every previously observed value

For now, the current shape is a reasonable compromise between the research artifacts and a convenient runtime schema for app code.
