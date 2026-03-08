# List Architecture Spec

## Purpose

This document defines the architecture for Anilog's MAL-backed list system.

The system must support:

- saved anime and manga lists backed by MyAnimeList list-producing endpoints
- configurable field-based table and card views
- grouping, filtering-through-grouping, and sorting
- tracking rules over previous vs current snapshots
- export, external-link, and integration-friendly extension points

The design is based on `MyUnderstanding.md` and `Notes.md`.

## Goals

- model all MAL list-producing source families from the start
- keep app-facing data normalized and strongly typed
- keep field behavior declarative and runtime-reflectable
- make list editing safe, previewable, and reversible
- let grouping, sorting, tracking, and rendering share the same field system
- preserve enough structure for future integrations like YouTube Music

## Non-Goals

- modeling raw MAL transport wrappers like `{ data, paging }` as first-class app-facing types
- supporting mixed anime+manga lists in one saved list
- supporting user-defined canonical registry fields
- allowing arbitrary JS in templates or tracking conditions

## Design Principles

1. Normalize early.
2. Keep MAL validation separate from app registry metadata.
3. Prefer explicit declarative configuration over implicit runtime behavior.
4. Reuse the same expression model across grouping, sorting, and tracking.
5. Let source family decide availability; let field capability decide behavior.
6. Preserve saved state cleanly; treat drafts as separate working state.

## Top-Level Architecture

The system is split into six layers:

1. MAL schema layer
2. Source family layer
3. Shared field registry layer
4. Saved list and draft persistence layer
5. Runtime evaluation layer
6. Extension layer for templates, exports, links, and integrations

## 1. MAL Schema Layer

### Role

This layer validates and normalizes data coming from MAL at the source-adapter boundary.

It should continue the current ArkType design:

- preserve MAL field names
- use medium-specific validators where domains differ
- keep open enums for forward-compatible domains
- keep closed enums only where exhaustiveness is well-supported
- normalize semantic primitives like `URL`, `Date`, and parsed integer strings

### Shape Strategy

This layer should define:

- reusable normalized anime and manga field schemas
- reusable sub-object schemas
- per-source-family entry schemas
- per-source-family normalized snapshot schemas

It should not make raw `{ data, paging }` wrappers part of the main app-facing model.

### Examples

- anime ranking entry schema can include ranking-specific extras
- anime search entry schema can omit ranking extras while reusing common anime field pieces
- manga list entry schema can include `my_list_status` fields relevant to the user's list

## 2. Source Family Layer

### Role

This layer defines how a saved source maps to MAL requests and normalized snapshots.

Each source is:

- a source family id
- a typed source config for that family

Examples:

- anime seasonal: `year`, `season`
- anime ranking: `ranking_type`, `entry_limit`
- anime search: `query`, `entry_limit`
- anime user list: `user_name`
- manga user list: `user_name`

### Source Family Contract

Each source family definition should declare:

- `id`
- `medium`
- ArkType schema for saved source config
- source capabilities
- fixed MAL fetch field superset
- normalized entry schema
- normalized snapshot schema
- source-specific settings metadata for the editor
- available field families and extras
- fetch implementation

### Source Capabilities

Source-family behavior should be represented as a capabilities set rather than disconnected booleans.

One important capability is `entry_limit`.

If a source family has the `entry_limit` capability:

- the saved source config should always include an `entry_limit` value
- the capability must define at least a default value and a hard max

If a source family does not have the `entry_limit` capability, no entry-limit setting is shown or stored.

Examples:

- ranking may expose `entry_limit` with a default like `500` and a max like `1000`
- search may expose `entry_limit` with its own default and max
- user lists should not expose `entry_limit` because the user's MAL list is already bounded
- seasonal families likely should not expose `entry_limit` because the result set is naturally bounded

### Fetch Semantics

Source adapters should:

- always use authenticated MAL requests
- fetch every page needed for the full dataset
- normalize page-by-page
- merge normalized pages into one snapshot
- fail the refresh if any page fails
- keep the last good snapshot on refresh failure and expose refresh error state

### Source Snapshot

Each normalized source snapshot should include:

- `entries`
- `metadata`

Suggested metadata fields:

- `source_key`
- `source_family`
- `medium`
- `fetched_at`
- `entry_count`
- `refresh_state`
- `error`

## 3. Shared Field Registry Layer

### Role

This layer provides the canonical list-facing field system.

It is separate from the ArkType MAL schema layer, but each field points into normalized snapshot paths backed by that schema layer.

### Key Rules

- keys are medium-qualified
- nested fields use full leaf paths
- source-specific extras still use the same registry

Examples:

- `anime.title`
- `anime.mean`
- `anime.start_date`
- `anime.my_list_status.score`
- `anime.ranking.rank`
- `manga.status`

### Field Definition Contract

Each field definition should include at least:

- `key`
- `medium`
- `default_label`
- `source_path`
- `value_cardinality`: `one` or `many`
- `scalar_kind`: `string | number | date | boolean | url | enum | other`
- `capabilities`
- `expression_operators`
- `default_grouping`
- `default_sort`
- `missing_value_policy`
- `source_availability`
- renderer definitions for table and card

### Capability Rules

Source family availability decides whether a field exists for a list.

Field capability set decides whether that field can be:

- displayed
- grouped
- sorted
- tracked

### Curation Rule

Only curated user-facing fields appear in the picker.

Technical normalized fields may still exist internally without being directly pickable.

### Derived Values

Canonical fields stay MAL-backed.

Derived values come from expression operators, not from user-defined or app-defined derived registry fields.

Examples:

- `anime.start_date` is canonical
- `Year(anime.start_date)` is derived by an expression operator
- `length(anime.title)` is derived by an expression operator

## 4. Expression Operator Catalog

Functions and operators should be normalized into one shared expression-operator catalog.

Architecturally, the difference between something like `Year(start_date)` and `mean > 8` is mostly syntax and arity, not that they belong to totally different systems.

Each expression operator should declare:

- `id`
- `syntax_kind` such as `function`, `infix_operator`, or `special_form`
- allowed input kinds
- allowed input cardinalities
- operand schema
- output kind
- output cardinality
- evaluation semantics
- whether it is allowed in templates

Examples:

- string transforms: `letter_by_index`, `length`, `word_count`
- number transforms: `round`, `floor`, `ceil`, `divide`, `multiply`, `add`, `subtract`, `remainder`, `decimal_part`, `integer_part`
- date transforms: `year`, `month`, `day`, `day_of_week`
- comparison and filter operators: `contains`, `equals`, `starts_with`, `ends_with`, `between`, `gt`, `gte`, `lt`, `lte`, `before`, `after`, `on`
- shared helper: `encode`

### Template Safety Rule

Only pure value-transform operators from this catalog should be available in templates.

## 5. Persistence Layer

### Storage Stack

The recommended persistence stack is:

- `SQLite` as the local database
- `@tauri-apps/plugin-sql` as the execution layer
- `drizzle-orm/sqlite-proxy` as the TypeScript query layer
- `drizzle-kit` for schema management and migrations

This gives the app:

- local-first storage that fits Tauri well
- typed SQL and migrations from Drizzle
- a runtime that still works through Tauri's SQL plugin

### Persistence Strategy

Persistence should use a hybrid relational-plus-document approach:

- relational columns for identity, timestamps, lookup keys, ordering, and small metadata
- JSON stored as `TEXT` for deeply nested list config, ASTs, snapshots, and other document-like state

This is the best fit because the app contains a lot of nested configuration that would be awkward to normalize into many join tables.

Examples of data that should stay as JSON documents:

- source config
- table view config
- card view config
- grouping config
- sorting config
- tracking config
- normalized source snapshots
- tracking rule match state

Examples of data that should stay as relational scalar columns:

- ids
- names
- sort order for global definitions
- timestamps
- cache keys
- medium
- source family

### Physical Tables

The first persistence pass should use these tables:

- `lists`
- `list_drafts`
- `source_snapshots`
- `tracking_runtime_state`
- `export_scripts`
- `external_links`
- `integration_settings`
- `app_settings`

### JSON Versioning

Each persisted JSON document shape should carry an internal schema version so future migrations stay manageable.

Examples:

- `list_config_version`
- `snapshot_version`
- `tracking_state_version`

### Saved List Record

Each saved list should have:

- stable generated id
- medium
- name
- source config
- active view
- saved table config
- saved card config
- saved grouping config
- saved sorting config
- saved tracking config
- lifecycle timestamps
- soft-delete state

Suggested record shape:

```ts
type SavedListRecord = {
  id: string
  medium: "anime" | "manga"
  name: string
  source: SourceDefinition
  activeView: "table" | "card"
  tableView: TableViewConfig
  cardView: CardViewConfig
  grouping: GroupingDefinition | null
  sorting: SortingDefinition | null
  tracking: TrackingConfig
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
```

Suggested physical table:

```sql
CREATE TABLE lists (
  id TEXT PRIMARY KEY NOT NULL,
  medium TEXT NOT NULL,
  name TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_config_json TEXT NOT NULL,
  active_view TEXT NOT NULL,
  table_view_json TEXT NOT NULL,
  card_view_json TEXT NOT NULL,
  grouping_json TEXT,
  sorting_json TEXT,
  tracking_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
```

### Draft Record

Each list can have at most one persisted draft record.

Suggested model:

```ts
type ListDraftRecord = {
  listId: string
  draft: SavedListEditableState
  updatedAt: Date
}
```

Suggested physical table:

```sql
CREATE TABLE list_drafts (
  list_id TEXT PRIMARY KEY NOT NULL,
  draft_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);
```

### Save Semantics

- `save changes` overwrites saved editable state
- `save as new list` clones the current draft into a new saved list id
- cloned lists start with fresh lifecycle history and fresh tracking baseline
- `reset` discards the draft and restores saved state

### Delete Semantics

- delete is soft delete
- saved config is retained
- draft is discarded
- tracking baseline is discarded
- restore restores only saved config

### Dirty State

Dirty state should be computed by structural diff of draft vs saved state.

### Tracking Runtime State

Tracking needs persisted runtime state separate from the saved tracking config.

This is necessary because edge-triggered rules cannot be implemented from config alone.

The runtime state should persist at least:

- the list id
- the current baseline snapshot reference
- the last successful poll time
- prior per-rule per-entry match state

Suggested shape:

```ts
type TrackingRuntimeState = {
  listId: string
  baselineSnapshotId: string | null
  lastSuccessfulPollAt: Date | null
  ruleMatchState: Record<string, Record<number, boolean>>
}
```

Suggested physical table:

```sql
CREATE TABLE tracking_runtime_state (
  list_id TEXT PRIMARY KEY NOT NULL,
  baseline_snapshot_id TEXT,
  last_successful_poll_at TEXT,
  rule_match_state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (baseline_snapshot_id) REFERENCES source_snapshots(id)
);
```

## 6. Shared Source Cache

Normalized source snapshots should be shared when the effective source identity matches.

Suggested cache key inputs:

- source family
- saved source config
- authenticated user identity if needed by source semantics
- fixed source fetch shape

The cache should be physically persisted as source snapshot rows.

Suggested logical row shape:

```ts
type SourceSnapshotRow = {
  id: string
  sourceKey: string
  sourceFamily: string
  medium: "anime" | "manga"
  sourceConfigJson: string
  fetchedAt: Date
  entryCount: number
  refreshState: "ok" | "error" | "refreshing"
  errorJson: string | null
  snapshotJson: string
}
```

Suggested physical table:

```sql
CREATE TABLE source_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  source_key TEXT NOT NULL,
  source_family TEXT NOT NULL,
  medium TEXT NOT NULL,
  source_config_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  entry_count INTEGER NOT NULL,
  refresh_state TEXT NOT NULL,
  error_json TEXT,
  snapshot_json TEXT NOT NULL
);

CREATE INDEX idx_source_snapshots_source_key
  ON source_snapshots(source_key);
```

Cache entries should survive app restarts.

Invalidation triggers:

- manual refresh
- tracked poll refresh
- source config change

The `source_key` should be a stable hash over:

- source family
- source config
- medium
- auth-sensitive identity if relevant
- fetch-shape version

## 6.1 Global Definition Tables

Global reusable definitions should live in their own tables.

### Export Scripts Table

```sql
CREATE TABLE export_scripts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  medium TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### External Links Table

```sql
CREATE TABLE external_links (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  medium TEXT NOT NULL,
  template TEXT NOT NULL,
  icon_hint TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Integration Settings Table

```sql
CREATE TABLE integration_settings (
  id TEXT PRIMARY KEY NOT NULL,
  integration_key TEXT NOT NULL UNIQUE,
  settings_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### App Settings Table

```sql
CREATE TABLE app_settings (
  id TEXT PRIMARY KEY NOT NULL,
  settings_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 7. View Configuration Model

### Shared View Concepts

Table and card are separate saved view subsystems.

They should not share one field-instance collection.

Both views remain preserved even when inactive.

New lists should default to table view.

### Field Instances

Field instances are per-view placements of canonical fields.

Suggested base shape:

```ts
type FieldInstance = {
  id: string
  fieldKey: string
  labelOverride: string | null
  rendererProps: Record<string, unknown>
}
```

Additional layout-specific config is attached by view type.

Important rules:

- same field can be added multiple times
- each instance has independent props and placement
- props must conform to the renderer's finite schema
- no extra arbitrary per-instance keys

### Table View Config

Suggested structure:

```ts
type TableViewConfig = {
  fields: TableFieldInstance[]
}

type TableFieldInstance = FieldInstance & {
  kind: "table"
}
```

Semantics:

- field-instance order determines column order
- one field instance may emit one or more columns
- sub-columns use stable ids derived from instance id plus renderer-defined sub-id

### Card View Config

Suggested structure:

```ts
type CardViewConfig = {
  mainGrid: CardGridConfig
  altGrid: CardGridConfig
}

type CardGridConfig = {
  rows: 1 | 2 | 3
  columns: 1 | 2 | 3
  cells: Record<string, CardCellConfig>
}

type CardCellConfig = {
  direction: "ltr" | "rtl" | "ttb" | "btt"
  fieldIds: string[]
}
```

Semantics:

- `main` and `alt` are separate zones
- each field belongs to exactly one cell in exactly one zone
- cells are addressed by grid coordinates
- cell field order is explicit

## 8. Renderer Model

Each field/view pair should expose one renderer contract with:

- finite prop schema
- finite default prop values
- optional finite variant enum carried in props

Empty-value display behavior belongs to renderer logic and renderer props.

Examples:

- one renderer may show `No synopsis`
- another renderer may hide empty synopsis entirely

## 9. Grouping Model

Each list has at most one active grouping definition.

Filtering is implemented through grouping, not as a separate top-level user subsystem.

### Grouping Definition

Suggested shape:

```ts
type GroupingDefinition = {
  id: string
  showEmptyBuckets: boolean
  parts: GroupingPart[]
  labelTemplate: string
}

type GroupingPart = {
  id: string
  alias: string
  expression: FieldExpression
  direction: "asc" | "desc"
  manualBuckets: ManualBucket[]
  remainder: RemainderStrategy
}
```

### Grouping Semantics

- grouping uses one or more ordered parts
- earlier parts create higher-level grouping
- later parts refine inside those groups
- group order uses resolved part values, not rendered labels

Example:

- part 1: season
- part 2: year
- result: group by season first, then year inside season

### Multi-Value Fan-Out

If a grouping expression yields multiple values:

- the entry joins every matching group for that part
- across multiple multi-valued parts, the final result is the full cross-product

### Manual Buckets

Manual buckets:

- can multi-match
- are ordered for display only
- if matched, exclude the entry from the remainder path for that part

Suggested shape:

```ts
type ManualBucket = {
  id: string
  label: string
  condition: FilterAstNode
}
```

### Remainder Strategies

Supported remainder families:

- `none`
- `other`
- automatic methods like `by_value`, `by_first_letter`, `by_length`, `by_word_count`, `by_year`, `by_month`, `by_day`

Type-specific labeling rules:

- `other` has one configurable label
- automatic remainder methods generate their own labels
- `none` has no label because unmatched entries are dropped

Null or empty values should become their own automatic bucket when relevant.

### Group Labels

Group label templates:

- are raw template strings
- use only aliases and pure helpers
- have no implicit root object
- require unique aliases within one grouping definition

## 10. Expression System

Grouping, sorting, and tracking should share a common field-expression system.

Suggested shape:

```ts
type FieldExpression = {
  root: ScopedFieldRef
  operators: ExpressionOperatorCall[]
}
```

Examples:

- `anime.title`
- `Year(anime.start_date)`
- `length(anime.title)`

Tracking uses scoped refs like `current.mean` and `previous.mean`.

### Filter AST

Conditions should use an explicit AST.

Suggested families:

- logical nodes: `and`, `or`, `not`
- predicate nodes: expression operator applied to operand expressions

Operands may be:

- literal values
- field expressions

This allows:

- `mean between 7 and 8`
- `genre contains Action`
- `length(title) > mean`
- `current.mean > previous.mean`

### Array Predicate Semantics

When arrays are involved, quantifier semantics belong on each predicate.

Supported shapes include:

- `any`
- `all`
- `at_least(n)`

## 11. Sorting Model

Each list has at most one active sort hierarchy.

Suggested shape:

```ts
type SortingDefinition = {
  keys: SortKey[]
}

type SortKey = {
  id: string
  expression: FieldExpression
  direction: "asc" | "desc"
}
```

### Sorting Rules

- sort keys use generated stable ids
- same field may appear multiple times with different transforms
- arrays are unsortable
- unsortable fields are hidden or disabled in the builder
- strings sort case-insensitively by default
- dates sort by normalized `Date`
- nulls sort last
- final tie-breaker is MAL id
- if no explicit sort is configured, default is title ascending

When grouping exists:

- grouping controls group order
- sorting controls entry order inside final groups

## 12. Tracking Model

Tracking is available on any source family.

### Tracking Config

Suggested shape:

```ts
type TrackingConfig = {
  polling: PollingConfig | null
  rules: TrackingRule[]
}

type TrackingRule = {
  id: string
  condition: FilterAstNode
  actions: TrackingAction[]
}
```

### Tracking Evaluation Model

Tracking rules do not watch one special field.

Instead, for each entry pair:

- `current` exposes the current field set
- `previous` exposes the previous field set

That field surface should match what grouping and sorting can use.

Rules:

- entries pair by MAL id
- one side may be missing
- missing-side access resolves to `null`
- rule conditions are scoped to `current` and `previous` only
- rules evaluate in configured order

### Tracking Lifecycle

- polling is configured per list
- tracked lists refresh on startup and on schedule
- normal lists refresh manually
- first successful tracked poll establishes baseline only
- stored baseline is the full normalized previous snapshot

### Edge Triggering

Actions fire only when a rule transitions from not matched to matched for an entry.

### Tracking Actions

Suggested action families:

- notify
- update MAL list status
- export data

Suggested action shape:

```ts
type TrackingAction =
  | { kind: "notify"; template: string }
  | { kind: "update_status"; status: string }
  | { kind: "export_data"; exportScriptId: string }
```

Action semantics:

- actions run in explicit configured order
- later actions read the original matched snapshot, not mutations from earlier actions
- MAL write failures are recorded per entry and do not abort the whole cycle
- if multiple rules write different statuses to the same entry, the last matching rule wins
- successful MAL status writes optimistically patch local state and then refetch the changed item

### Notification Templates

Notification templates should use only:

- `current`
- `previous`

There is no separate `entry` root.

## 13. Export Model

### Export Settings

Export settings uses saved config only, not draft state.

### Export Data JSON

Export data JSON should export the normalized source snapshot, not the grouped render tree.

### Export Scripts

Export scripts are global reusable definitions.

Suggested shape:

```ts
type ExportScriptDefinition = {
  id: string
  name: string
  medium: "anime" | "manga" | "both"
  code: string
}
```

Rules:

- generated stable ids
- pure sync frontend execution
- per-medium typed entry arrays
- minimal context
- string return value only

Tracking-triggered export should reuse the same export contract.

For tracking export actions, the exported list entries should carry a `matches` boolean per entry.

## 14. External Links Model

External links are global definitions.

Suggested shape:

```ts
type ExternalLinkDefinition = {
  id: string
  name: string
  medium: "anime" | "manga" | "both"
  template: string
  iconHint: string | null
}
```

Rules:

- generated stable ids
- explicit configured order
- target anime, manga, or both
- root variable depends on target: `anime`, `manga`, or `entry`
- rendered by the `external links` field as the full configured set for that medium

Favicon fetching remains a UI concern layered on top of the link definition.

## 15. Template System

Group labels and external links should share one template engine.

Template rules:

- saved as raw template text
- helpers callable only inside `${...}`
- typed access only to allowed fields/context values
- pure helper operators only
- validate on save
- if runtime evaluation fails for one item, skip that item and record the error

## 16. Runtime Evaluation Pipeline

For a list render or tracked refresh, the runtime pipeline should be:

1. resolve saved list or draft state
2. resolve source family and source config
3. load cached snapshot or refresh source as needed
4. validate/normalize at the source boundary
5. materialize field access layer from the normalized snapshot
6. evaluate grouping if configured
7. evaluate sorting
8. evaluate tracking against current vs previous snapshots
9. execute actions in rule order, then action order
10. render table or card view using that list's active view config

Notes:

- grouping is computed before tracking, but tracking remains entry-based
- sorting affects entries within final groups
- templates and renderers consume already-normalized data

## 17. Integration Hooks

The architecture should leave room for integrations such as YouTube Music.

That means:

- list snapshots are normalized and reusable
- tracking can trigger structured downstream actions
- exports and templates already provide extension surfaces
- source, registry, and evaluation layers stay modular

## 18. Recommended Implementation Order

1. stabilize source-family definitions and source snapshot schemas
2. implement shared field registry and typed expression-operator catalog
3. implement saved list and draft persistence
4. implement table/card field-instance systems
5. implement common expression model and filter AST backed by the shared expression-operator catalog
6. implement grouping engine
7. implement sorting engine
8. implement tracking engine and action executor
9. implement export scripts and external-link templates
10. add integration-specific layers like YouTube Music

## 19. Key Architectural Decisions

- single-medium lists only
- source = family + typed saved params
- some source families expose an `entry_limit` capability with a default and max; user lists do not
- full-dataset evaluation, not page-local evaluation
- fixed source-specific fetch supersets
- normalized per-source snapshots with minimal metadata
- shared persistent source cache
- separate saved and draft state
- shared canonical field registry separate from ArkType MAL schemas
- field-expression reuse across grouping, sorting, and tracking
- function-style and operator-style expressions normalized into one expression-operator catalog
- filtering implemented through grouping
- tracking compares full `current` and `previous` field sets
- template system is declarative and non-arbitrary
- exports and links are global reusable definitions

This is the target architecture for the first real implementation pass.
