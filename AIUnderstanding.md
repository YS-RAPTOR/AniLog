# My Understanding

This document rewrites the current understanding into one coherent architecture baseline for the app.

## Core Product Model

The app is centered around saved user-defined lists. Each saved list is single-medium, so it is either an anime list or a manga list.

Each list is backed by a MyAnimeList source. A source is not just an endpoint name; it is the combination of:

- a source family, such as search, seasonal, ranking, anime user list, manga user list, suggestions, or another MAL list-producing endpoint
- the saved source parameters for that family, such as `query`, `year`, `season`, `ranking_type`, or `user_name`

Some source families should expose an `entry_limit` capability when the family can otherwise grow very large. For those families, the saved source config should always include an entry limit value, because the capability also defines a default and a hard max.

The source determines:

- which entries are fetched
- which source-specific settings are shown to the user
- which extra fields are available for that list

Example:

- a seasonal anime source with `year=2026` and `season=spring` fetches Spring 2026 anime, shows `year` and `season` in source settings, and can expose seasonal-only fields
- a ranking source with `ranking_type=bypopularity` fetches popularity-ranked entries and can expose ranking-specific fields like ranking data
- a ranking source may expose an `entry_limit` capability with something like default `500` and max `1000`, while a seasonal source may not need any entry-limit capability because the result set is already naturally bounded
- a user-list source should not expose an entry limit because the user's MAL list is already naturally bounded

Source parameters are part of the saved source config, but they are not selectable list fields.

The architecture should cover all MAL list-producing source families from the start, not just a small MVP subset.

## Source Fetching and Normalized Snapshots

A list represents the full dataset for its source, not just a visible page. That means the source layer should fetch all pages needed for correctness before grouping, sorting, tracking, or exporting.

Important source-layer decisions:

- MAL requests always use authentication
- each source family fetches a fixed source-specific field superset rather than dynamically planning fields from current list usage
- responses are normalized page-by-page and then merged
- if any page in a refresh fails, the whole refresh fails
- if a refresh fails and there is already a last good snapshot, the runtime keeps using the stale snapshot and surfaces an error state

Whether a source family supports entry limiting should be defined through a source-family capabilities set. If the capability exists, it should include at least a default and a max.

Example:

- ranking and search families may expose an `entry_limit` capability
- user-list families should not support a user-configurable limit because their datasets are already bounded by the user's own MAL list
- seasonal anime may not expose that setting because its dataset is already naturally finite and reasonably bounded

The app-facing result of a source fetch is a normalized source snapshot, not raw MAL transport wrappers and not a fully hydrated detail entity model.

Example:

- a ranking source snapshot contains normalized ranking entries plus fetch metadata, not raw `{ data, paging }` MAL pages
- a search source snapshot contains normalized search entries even if MAL returned them over multiple pages

Each normalized source snapshot should carry:

- the normalized `entries`
- minimal fetch metadata such as identity, fetch time, item count, and refresh status

Source snapshots should be cached and shared across matching lists when the effective source identity is the same. Cache entries should persist across app restarts. While the app is open, cache invalidation should happen through:

- manual refresh
- tracked polling
- source-parameter changes

Example:

- if two lists both use the same anime ranking source with the same saved params, they can reuse the same normalized cached snapshot
- if the user changes a seasonal list from `spring 2026` to `summer 2026`, the old cache identity no longer matches and a new fetch is needed

Editing source parameters inside a draft should trigger debounced preview refetching.

If changing the source would invalidate the current list config, that source change is blocked.

If source parameters change on a tracked list, the tracking baseline resets.

Example:

- if a tracked search list changes from query `mecha` to query `space`, the previous tracked baseline for `mecha` is discarded and `space` starts fresh

Field availability is determined by source family only, not by specific source parameter values.

## Persistence and Lifecycle

Saved lists should use app-generated stable ids.

Unsaved editing state should be stored separately from the saved list definition as one persisted draft object per list. Drafts should survive app restarts.

Save behavior:

- `save changes` replaces the current saved state
- `save as new list` clones the full current draft into a new list
- the new cloned list starts with a fresh tracking baseline and fresh lifecycle history
- `reset` restores the draft back to the saved state, including the saved name if the name was changed

Example:

- if the saved list is called `Spring Shows` and the draft renames it to `Best Spring Shows`, pressing `reset` returns the name and all other settings to the saved version
- if the user presses `save as new list`, the new list copies the current draft config but does not inherit the old list's tracking baseline

Dirty state should be computed by structural diff between the saved config and the draft.

Soft deletion rules:

- lists are never hard deleted through normal UX
- deleted lists preserve only the saved config
- unsaved drafts are discarded on delete
- tracking snapshots are discarded on delete
- restoring a deleted list restores only the saved config

Example:

- if a list has unsaved field layout changes and then is deleted, restoring it brings back only the last saved configuration, not the unsaved draft edits

List lifecycle timestamps should include:

- `created`
- `updated`
- `deleted`

The expectation is that registry and source evolution remain compatible enough that restore-time invalidation should not happen in practice.

## Field Registry

The app needs a shared canonical field registry. This registry is separate from the ArkType MAL schema layer, but it references the normalized schema paths.

Registry key rules:

- keys are medium-qualified, such as `anime.status` and `manga.status`
- nested fields use full leaf paths
- source-specific extras still live in the same shared registry
- the registry declares which source families expose which fields

The registry is finite and app-defined. Users do not create their own canonical registry fields.

Canonical fields should stay MAL-backed. Derived values like year, title length, rounded score, and similar derived results come from expression operators applied to base fields, not from standalone derived canonical fields.

Example:

- `anime.start_date` is a canonical field
- `Year(anime.start_date)` is an expression-operator pipeline result, not its own canonical registry field
- `length(anime.title)` is also derived at expression time, not stored as `anime.title_length`

Each registry field should declare:

- its default label
- its extracted value shape as cardinality plus scalar type
- the normalized snapshot path it reads from
- its capabilities set
- the expression operators it supports
- its renderer prop schemas and defaults
- its default grouping metadata
- its default sorting metadata
- its missing-value normalization behavior
- its source-family availability

Source availability unlocks the field for a list, and then the field's capabilities set determines whether that field can be displayed, grouped, sorted, or tracked.

Example:

- `anime.ranking.rank` may be available for ranking sources, but whether it can be sorted or tracked still depends on the registry capabilities for that field

The field access surface for tracking should match the same field access surface used by grouping and sorting.

Only curated user-facing fields should appear in the picker, not every technically present path.

Example:

- the normalized snapshot may contain a technical nested field used internally, but the picker only shows the curated display field the user is meant to add

Object-like structures should be exposed mostly through leaf fields rather than broad object fields.

Example:

- prefer `anime.main_picture.medium` and `anime.my_list_status.score` over letting the user add a giant `anime.main_picture` or `anime.my_list_status` object field directly

## Expression Operator Catalog

Functions and operators should be normalized into one shared expression-operator catalog. The main difference between them is syntax and arity, not architecture.

Each expression operator should define:

- its id
- operand requirements
- applicability rules
- evaluation behavior
- input typing
- output typing
- cardinality rules
- syntax kind, such as function-style or operator-style

Example:

- `Year(date)` takes a date-like input and returns a number
- `length(string)` takes a string and returns a number
- that allows the builder to accept `length(title) > mean` because both sides become numbers

The shared expression-operator catalog should be declarative, finite, and available everywhere discussed in the notes. The notes-defined helper transforms, comparison operators, and `encode` belong in that shared catalog.

For template usage specifically, only pure value-transform operators from that catalog should be callable.

Example:

- `encode(title)` is allowed in a template
- a helper that performs network access or writes storage would not be allowed

## Views, Field Instances, and Layout

Each list can be viewed in table view or card view. Both view configurations should be preserved in full even when one is inactive. New lists should default to table view as the active view.

Field-instance rules:

- a canonical field can be added multiple times
- each field instance gets a generated stable id
- field instances have independent config, including label overrides, placement, and renderer props
- new field instances start from both field-level defaults and applicable view-level defaults
- field-instance props must match the renderer schema exactly; no arbitrary extra prop keys
- field instances do not have their own separate conditional visibility rules

Example:

- adding `title` twice creates two different field instances with different ids, labels, and props even though they come from the same canonical field
- one `title` instance might render as large text in card view while another renders as a compact subtitle in a different location

The add-field UI should understand current instance counts, including whether a canonical field is:

- not added
- added once
- added multiple times

### Table View

Table view stores its own field-instance collection.

- field-instance order determines emitted column order
- one field instance may emit one or more concrete columns
- multi-column fields use stable sub-column ids derived from `instance id + sub id`

Example:

- a `title` field instance might emit one column
- an `external links` field instance might emit several sub-columns or column-like outputs depending on its renderer contract

### Card View

Card view stores its own field-instance collection.

- card layout is grid-based
- the maximum grid size is 3x3
- the card has separate `main` and `alt` zones
- each field instance belongs to exactly one card cell in one of those zones
- card cells are identified by grid coordinates
- each cell stores layout direction and explicit field order for the instances assigned there

Example:

- a 3x3 card could place `main_picture` in main cell `(1,1)`, `title` in main cell `(1,2)`, and `studios` in the alt zone at `(2,1)`

Empty-value display behavior belongs to the React renderer or renderer props.

Example:

- if `synopsis` is empty, one renderer might show a placeholder like `No synopsis`, while another renderer might hide the field entirely

Renderer architecture should be procedural and runtime-reflectable:

- one renderer contract per field per view
- finite prop schema
- finite defaults
- variants, if needed, are represented as prop values inside that finite prop schema

## Grouping and Filtering

Each list has at most one active grouping definition.

Filtering is not a separate user-facing subsystem. It is treated as a subtype of grouping. In practice, filtering is achieved by creating manual buckets that represent the desired matches and then discarding the remainder.

Example:

- to "filter" to anime with `mean` between 8 and 10, the user creates one manual bucket for that range and sets remainder to `none`

Grouping structure:

- a grouping is made from one or more grouping parts
- each grouping part usually corresponds to one field-based grouping configuration
- the order of those grouping parts matters: earlier parts create the higher-level grouping and later parts refine inside them
- for example, grouping by `season` and then `year` means entries are grouped by season first and then by year within each season
- each grouping part has its own sort direction
- final composite group ordering uses the resolved values of those grouping parts, not the final rendered label string

Concrete runtime groups should use deterministic derived ids based on grouping identity plus resolved step or bucket values.

Example:

- if the grouping is `season` then `year`, a concrete group id might be derived from something like the grouping id plus `season=Spring` and `year=2026`

### Multi-valued Behavior

Grouping fans out over multi-valued fields.

- if one step yields multiple values, the entry appears in each matching group for that step
- if multiple steps yield multiple values, the final grouping produces the full cross-product

Example:

- if an anime has genres `Action` and `Comedy`, grouping by genre puts it in both groups
- if that same anime also has studios `A` and `B`, grouping by genre then studio produces `Action/A`, `Action/B`, `Comedy/A`, and `Comedy/B`

### Manual Buckets

Manual buckets are ordered for display only, not for matching priority.

- manual buckets can multi-match
- a single entry may land in multiple manual buckets in the same step
- if an entry matches any manual bucket in a step, it does not also enter that step's remainder path

Example:

- if one bucket checks `mean >= 8` and another checks `genre contains Action`, an action show with mean `8.5` can appear in both manual buckets
- because it matched a manual bucket, it does not also go to the remainder bucket for that step

Manual buckets should use explicit user-facing labels.

Manual bucket conditions should be persisted as an explicit logical AST using nodes like `and`, `or`, and `not`.

### Grouping Step Pipeline

Within a grouping step, evaluation should follow this order:

1. extract field values
2. apply expression-operator pipeline
3. evaluate manual buckets
4. apply the remainder method

Example:

- for grouping by first letter of title, the runtime first reads `title`, then applies `letterByIndex(0)`, then checks manual buckets like `A-M`, then sends anything unmatched to the chosen remainder behavior

### Remainder Behavior

Remainder handling is field-type-dependent and method-dependent.

- `none` drops unmatched entries at that grouping step
- `other` produces one configurable fallback bucket
- automatic methods like `by Value`, `by First Letter`, `by Length`, `by Word Count`, `by Year`, `by Month`, and `by Day` generate their own buckets and labels

Example:

- with `none`, an anime that matches no manual bucket disappears from the grouped result
- with `other`, that same anime goes into a bucket such as `Other`
- with `by First Letter`, unmatched titles might create buckets like `A`, `B`, and `C`

If a value is null or empty and no manual bucket claims it, automatic grouping should create its own null or empty bucket.

Example:

- if `start_date` is missing and the remainder mode is `by Year`, that entry goes into a null or empty bucket instead of being silently dropped

Showing empty buckets should be a per-list option.

### Group Labels

Group labels are template strings, not arbitrary JS code.

- templates use interpolation blocks like `${...}`
- template scope contains only user-defined aliases and pure helper operators
- there is no extra implicit group root object
- aliases must be unique within a grouping definition
- in a concrete composite group, each alias resolves to one scalar value

Example:

- if aliases are `season` and `year`, a label template could be `${season} ${year}` and render as `Spring 2026`
- if a helper is available, `${season} ${Year(currentDate)}` would still only have access to aliases and pure helpers, not a group object like `group.season`

## Sorting

Each list has at most one active sort hierarchy. Sorting is separate from grouping.

Sort keys:

- use generated stable ids
- point to canonical field-expression pipelines, not field instances
- may reuse the same base field more than once with different transforms or directions

Example:

- one sort hierarchy could sort first by `Year(start_date)` descending and then by `title` ascending

Sort builder rules:

- unsortable fields should be hidden or disabled
- sort expressions are fully validated on save

Sorting semantics:

- arrays are not sortable
- string sorting defaults to case-insensitive lexical comparison
- date sorting uses normalized `Date` values directly
- null or missing values sort last
- if all sort keys tie, the final tiebreaker is MAL entry id

Example:

- `Frieren` and `frieren` compare as equal for the main lexical comparison
- if two entries still tie on every explicit sort key, the lower or higher MAL id breaks the tie deterministically depending on the implementation's final id comparison rule

When a list is grouped, grouping decides group order and sorting orders entries inside the final groups.

If no explicit sort hierarchy is configured, default ordering is by title ascending.

Sort config persists independently of grouping config.

## Tracking

Tracking is allowed on any source. A list can have multiple tracking rules.

Tracking rule structure:

- each rule has a generated stable id
- rules evaluate in explicit configured order
- rule conditions reuse the shared filter AST model
- field references are scoped as `current.*` and `previous.*`
- the condition scope contains only `current` and `previous`

Example:

- a rule can compare `current.mean > previous.mean`
- another rule can compare `current.num_episodes > previous.num_episodes`

Tracking does not target one single field or value. Instead, each rule evaluates against the full `current` and `previous` field sets available to tracking for an entry. That field surface is the same one available to grouping and sorting.

Entry pairing and null-side behavior:

- entries are matched between snapshots by MAL id
- a rule may evaluate even if one side is missing
- missing-side lookups resolve to `null`

Example:

- if anime id `52991` exists in the new snapshot but not the old one, the rule evaluates with `current` populated and `previous` resolving to `null`

Tracking lifecycle:

- the list stores one polling configuration for all its rules
- tracked lists refresh on app startup and on their polling schedule
- normal lists refresh manually
- the first successful tracked poll establishes the baseline and does not fire change-based actions
- the tracking baseline is the full normalized source snapshot from the last successful poll

Example:

- if the polling schedule is every 30 minutes, all tracking rules on that list run every 30 minutes
- on the very first successful poll, the app stores the snapshot but does not notify about everything as if it were all "new"

Tracking remains entry-based even though it runs after grouping in the runtime pipeline.

### Tracking Actions

One tracking rule may trigger multiple actions. Actions run in explicit configured order.

Later actions in the same rule should see the original matched snapshot, not changes caused by earlier actions.

Supported action behavior currently implies:

- `notify me` uses a template built from `current` and `previous` only
- `update list status` can operate on any source as long as the matched entry carries a valid MAL id
- `export data` exports the entire list snapshot, with a `matches` boolean attached to each exported entry

Example:

- a notification template could mention that `current.mean` is now greater than `previous.mean`
- a ranking-source entry can still trigger `update list status` if it has the MAL anime id needed for the write endpoint
- an export action can send the whole list to the exporter while marking only the matched entries with `matches=true`

If a MAL write action fails for one entry, processing should continue for the others and record per-entry failures.

Tracking actions are edge-triggered. They fire when a rule changes from not matched to matched for a given entry.

Example:

- if `current.mean > previous.mean` is true for the first time this poll, the action fires
- if the same condition stays true on the next poll without a new transition, it does not fire again

If multiple tracking rules try to write different MAL statuses to the same entry in one cycle, the last matching rule wins.

Example:

- if rule 1 sets status to `watching` and rule 2 later sets it to `completed`, the final applied write is `completed`

If a tracking rule updates MAL status successfully, the app should optimistically patch the changed entry and then refetch the changed item.

## Export

There are three export layers:

- export list settings
- export list data as JSON
- export via reusable export scripts

`export settings` should use the saved config only, not the current draft.

Example:

- if the draft has unsaved layout edits, `export settings` still exports the last saved version of the list config

JSON export should represent the normalized source snapshot, not the rendered grouped result.

Example:

- exporting data from a grouped seasonal list should still produce the normalized entry snapshot, not a nested group tree like `Spring 2026 -> entries`

## Export Scripts

Export scripts are global reusable definitions, not per-list definitions.

- each export script has a generated stable id
- scripts are frontend-executed pure sync functions
- they use per-medium typed entry arrays
- they receive only minimal context
- they return a string only

Example:

- a global `Nyaa magnet export` script can be reused by many anime lists and returns one output string containing the collected magnet links

Tracking-triggered export should still use the normal export contract rather than a separate script interface.

Example:

- whether export is started manually or triggered by a tracking rule, the exporter still receives the normal list export input shape

## External Links

External links are a global config, not per-list config.

- each external-link definition has a generated stable id
- each definition targets anime, manga, or both
- templates use a standard root variable based on target: `anime`, `manga`, or `entry`
- links render in explicit configured order
- link definitions should include at least label, target medium, URL template, and icon hints

Example:

- an anime-only Netflix link could use a template like `https://www.netflix.com/search?q=${encode(anime.title)}`
- a both-media MAL link could use `https://myanimelist.net/${entry.id}` only if the final typed entry shape supports that exact path

When the `external links` field is added to a list, it renders all configured links for that medium.

Example:

- if anime links are configured for Netflix and Crunchyroll, one `external links` field instance shows both for each anime row or card

## Template System

Group labels and external links both use a shared template-string model.

- saved form is raw template text
- helpers can only be called inside `${...}` blocks
- templates can access only typed normalized entry values and approved pure helpers
- templates are fully validated on save
- if a template still fails at runtime for one item, that item is skipped and the error is recorded

Example:

- `${season} ${year}` is valid raw template text for a group label
- `https://service.example?q=${encode(anime.title)}` is valid for an external link if `anime.title` is available in that template context

## MAL Schema Direction

The app should continue following the existing normalized ArkType approach.

Important schema decisions:

- focus on normalized entity schemas and normalized source-snapshot schemas, not raw `{ data, paging }` wrapper schemas as a core layer
- define explicit per-source snapshot schemas
- type snapshot `entries` per source family, not only by broad medium base type
- keep stable normalized shapes for optional or omitted values where appropriate
- keep the current open-enum vs closed-enum split
- continue exposing semantic normalized outputs like `URL`, `Date`, and parsed numbers
- keep source-specific extras fully typed
- validate and normalize at the source-adapter boundary
- evolve future sources and richer payloads by composition, not by replacing the current normalized structure

Example:

- an anime ranking source snapshot can use an entry schema that includes ranking extras
- an anime search source snapshot can use a different entry schema that omits those extras while still sharing common normalized anime field pieces

The field registry and ArkType MAL schemas should stay as separate but connected layers.
