# AniLog Design Requirements V2 (Detailed)

## 1) Document Intent

This document defines the detailed, implementation-ready design and UX requirements for AniLog V1.

- Audience: design and engineering
- Scope: UX, UI, interaction behavior, accessibility, performance UX, security UX, and design-level acceptance criteria
- Platform target: Tauri desktop app with responsive behavior across mobile/tablet/desktop viewport classes
- Product page groups: `Onboarding`, `Login`, `app/anime`, `app/manga` (including light novels), `app/notifications`

### Requirement Language

- **MUST**: mandatory for V1 acceptance
- **SHOULD**: strongly recommended; only defer with explicit rationale
- **COULD**: optional enhancement if schedule allows

## 2) Product Vision, Users, and Success

### 2.1 Vision

- **MUST** deliver a significantly better UX than MAL web for browsing, filtering, and managing anime/manga data.
- **MUST** maintain MAL data parity in surfaced user list data and core metadata.
- **MUST** present a distinctive, playful-otaku visual language while staying clear and task-focused.

### 2.2 Primary User Segments

- **MUST** support MAL power users who manage high-volume lists with complex filters.
- **MUST** support data tinkerers who build reusable, highly customized list views.
- **MUST** support casual trackers with simple defaults and clear guided flows.

### 2.3 V1 Success Criteria

- **MUST**: high task completion rate for onboarding, login, list operations
- **MUST**: low-friction performance at up to `10,000` entries
- **MUST**: WCAG `2.2 AA` conformance in dark and light themes
- **MUST**: full dual-provider auth completion (MAL + Google)

## 3) User Journey Architecture

### 3.1 End-to-End Journey

1. `Onboarding` (credentials setup/import)
2. `Login` step 1 (MAL)
3. `Login` step 2 (Google)
4. `App surfaces` (`app/anime`, `app/manga`, and `app/notifications`)

### 3.2 Gate Rules

- **MUST** keep onboarding and login as strict gates.
- **MUST** require both MAL and Google success before full app unlock.
- **MUST** preserve user progress when one provider fails.
- **MUST** surface actionable diagnostics for each failed state.

### 3.3 Source of Truth and Sync

- **MUST** treat MAL as source of truth for anime/manga entry records.
- **MUST** resolve conflicts in favor of MAL values in V1.
- **MUST** expose explicit sync states: idle, syncing, queued, rate-limited, failed, recovered.
- **SHOULD** allow user-configurable refresh cadence and manual sync triggers.

## 4) Responsive and Platform Requirements

### 4.1 Viewport Classes

- **MUST** design and verify all page groups for:
  - Mobile portrait
  - Mobile landscape
  - Tablet portrait
  - Tablet landscape
  - Desktop

### 4.2 Runtime and Layout

- **MUST** target Tauri desktop runtime.
- **MUST** support minimum desktop window size `1280x720`.
- **MUST** prioritize touch-first interaction patterns on tablet classes.
- **MUST NOT** include offline mode in V1.

### 4.3 Responsive Behavior Standards

- **MUST** preserve information hierarchy when adapting layouts.
- **MUST** avoid hidden critical actions without a visible alternate path.
- **SHOULD** preserve command bar utility at all classes, collapsing into compact controls on mobile.

## 5) Design System (Concrete)

### 5.1 Visual Direction

- **MUST** follow playful-otaku direction with functional clarity.
- **MUST** be dark-first with complete light-mode parity.
- **MUST** keep motion expressive but non-blocking.

### 5.2 Typography

- **MUST** use this stack with JP-capable fallback behavior:
  - Primary UI: `Noto Sans`, `Inter`, `system-ui`, `sans-serif`
  - Display/Accent: `Bricolage Grotesque`, `Noto Sans`, `sans-serif`
  - Mono/Data: `JetBrains Mono`, `ui-monospace`, `monospace`
- **MUST** ensure mixed EN/JP labels render without fallback mismatch artifacts.

### 5.3 Token Tables

The following values are baseline V1 tokens and may be tuned during implementation if contrast and readability remain compliant.

#### Color Tokens (Dark)

| Token | Value | Usage |
|---|---|---|
| `--bg-0` | `#0B0F14` | app background |
| `--bg-1` | `#111723` | elevated surfaces |
| `--bg-2` | `#182132` | cards/panels |
| `--text-0` | `#F4F7FB` | primary text |
| `--text-1` | `#C3CFDD` | secondary text |
| `--text-2` | `#8EA0B7` | tertiary text |
| `--brand-500` | `#FF7A18` | primary action |
| `--brand-600` | `#E9680E` | active/pressed brand |
| `--info-500` | `#4AA8FF` | info states |
| `--success-500` | `#38C793` | success states |
| `--warn-500` | `#FFB547` | warning/rate limits |
| `--danger-500` | `#FF5E6B` | error/destructive |
| `--focus-ring` | `#8CD0FF` | focus-visible |
| `--border-0` | `#253044` | default border |

#### Color Tokens (Light)

| Token | Value | Usage |
|---|---|---|
| `--bg-0` | `#F7FAFD` | app background |
| `--bg-1` | `#FFFFFF` | elevated surfaces |
| `--bg-2` | `#EEF3F9` | cards/panels |
| `--text-0` | `#101723` | primary text |
| `--text-1` | `#334155` | secondary text |
| `--text-2` | `#5B6B80` | tertiary text |
| `--brand-500` | `#D95E00` | primary action |
| `--brand-600` | `#B84D00` | active/pressed brand |
| `--info-500` | `#2C7FE0` | info states |
| `--success-500` | `#238A63` | success states |
| `--warn-500` | `#C88214` | warning/rate limits |
| `--danger-500` | `#C83A49` | error/destructive |
| `--focus-ring` | `#1E6BD6` | focus-visible |
| `--border-0` | `#D2DCE8` | default border |

### 5.4 Type Scale and Weight

| Token | Size / Line Height | Weight | Usage |
|---|---|---|---|
| `--type-display` | `40/48` | `700` | hero / onboarding headings |
| `--type-h1` | `32/40` | `700` | page title |
| `--type-h2` | `24/32` | `700` | section title |
| `--type-h3` | `20/28` | `600` | card title |
| `--type-body-lg` | `18/28` | `400` | long copy |
| `--type-body` | `16/24` | `400` | default body |
| `--type-body-sm` | `14/20` | `400` | compact UI text |
| `--type-label` | `13/16` | `600` | labels/chips |
| `--type-mono` | `13/18` | `500` | IDs/serialized snippets |

### 5.5 Spacing, Radius, Elevation

- **MUST** use an 8pt base rhythm with half-step support.

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |

| Token | Value |
|---|---|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |

| Token | Value |
|---|---|
| `--elev-1` | `0 2px 8px rgba(0,0,0,0.20)` |
| `--elev-2` | `0 8px 24px rgba(0,0,0,0.24)` |
| `--elev-3` | `0 16px 40px rgba(0,0,0,0.28)` |

### 5.6 Interaction State Requirements

For each interactive component, **MUST** define and implement: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`, `success`.

- **MUST** provide visible focus ring meeting contrast requirements.
- **MUST** ensure disabled states remain readable and semantically announced.

## 6) Navigation and Workspace Model

- **MUST** use left sidebar + top command bar on desktop/tablet.
- **MUST** use off-canvas sidebar drawer on mobile.
- **MUST** treat `app/anime` and `app/manga` as equal first-class workspaces.
- **MUST** provide a primary navigation destination for `app/notifications`.
- **MUST** open entry details on a dedicated full page route.
- **SHOULD** preserve workspace context (selected list, filters, view mode) when switching between anime and manga.

## 7) Field Type Taxonomy (V1 Data Interaction Model)

V1 list operations are defined by field type behavior rather than a fixed exhaustive field inventory.

### 7.1 Field Types

- **MUST** support these field classes:
  - `Categorical (single)` examples: status, media format
  - `Categorical (multi)` examples: genres, themes, tags
  - `Boolean` examples: rewatching, favorite
  - `Numeric` examples: rank, popularity
  - `Ranged numeric` examples: score (bounded scale), episodes watched/total, chapters read/total
  - `Date/time` examples: start date, finish date, updated at
  - `String/text` examples: title variants, notes
  - `Link/template` examples: generated external URLs

### 7.2 Operation Compatibility

- **MUST** define filter/group/sort compatibility per field type.
- **MUST** allow cross-field comparisons where type-safe (e.g., numeric with numeric; date with date).
- **MUST** support arithmetic in numeric comparisons (`+`, `-`, threshold offsets).
- **MUST** duplicate membership for `Categorical (multi)` grouping.

## 8) Journey Specifications and State Matrices

All pages below **MUST** define these states if applicable: `default`, `loading`, `success`, `empty`, `error`, `retry`, `partial-degraded`, `rate-limited`.

### 8.1 Onboarding Journey

#### 8.1.1 Flow

1. Chooser page: `Beginner`, `Advanced`, `Import`
2. Path-specific credential input/help
3. Validation feedback
4. Completion and handoff to login

#### 8.1.2 Requirements

- **MUST** present chooser first.
- **MUST** collect required values:
  - MAL client ID
  - Google client ID
  - Google client secret
- **MUST** provide copy-ready required setup values for MAL and Google (redirect URLs, app types, scopes, required settings).
- **MUST** complete onboarding only when required values pass validation.

#### 8.1.3 Path Behavior

- `Beginner`
  - **MUST** provide step-by-step guidance with explicit copyable values and validation checks per step.
  - **SHOULD** include troubleshooting hints for common provider setup mistakes.
- `Advanced`
  - **MUST** provide concise setup with rationale hints and core required values.
  - **MUST** avoid unnecessary hand-holding while preserving clarity.
- `Import`
  - **MUST** accept credential JSON import.
  - **MUST** validate payload before allowing completion.

#### 8.1.4 Onboarding State Matrix

| State | Required UX Behavior |
|---|---|
| `default` | Chooser/options visible; clear path descriptions |
| `loading` | Non-blocking progress indicator during validation/import parse |
| `success` | Confirm credentials accepted and direct to Login step 1 |
| `empty` | Explain required fields and why they are needed |
| `error` | Inline field errors + global summary with actionable fixes |
| `retry` | One-click retry for validation/import failures without data loss |
| `partial-degraded` | If help metadata fails to load, allow manual entry with fallback instructions |
| `rate-limited` | If provider helper endpoints are constrained, show cooldown and next retry time |

### 8.2 Login Journey

#### 8.2.1 Flow

1. MAL login step
2. Google login step
3. Final success gate to app workspace

#### 8.2.2 Requirements

- **MUST** keep MAL and Google as separate pages/steps.
- **MUST** require both to succeed.
- **MUST** show clear status, retry, and diagnostics in each step.
- **MUST** preserve completed-provider state if the other provider fails.

#### 8.2.3 Login State Matrix

| State | Required UX Behavior |
|---|---|
| `default` | Primary action shows provider to authenticate now |
| `loading` | Awaiting external callback; show secure auth in progress |
| `success` | Provider step confirmed; proceed to next step or app |
| `empty` | N/A for auth step; use default guidance |
| `error` | Show provider-specific error code/message and fix guidance |
| `retry` | Retry action without restarting full auth flow |
| `partial-degraded` | If token refresh unavailable, keep read-only step state and request reauth |
| `rate-limited` | Show lockout/cooldown copy with countdown and next attempt time |

### 8.3 App Workspace Journey (`app/anime`, `app/manga`)

#### 8.3.1 Workspace Requirements

- **MUST** be list-centric by default.
- **MUST** support browse, discover, and management workflows.
- **MUST** include starter template views on first run.

#### 8.3.2 Lists and Multi-List Management

- **MUST** allow multiple lists.
- **MUST** keep anime and manga lists separate and independently configurable.
- **MUST** support custom lists.
- **MUST** make list switching fast and obvious.

#### 8.3.3 Entry Presentation Modes

- **MUST** support:
  - List view
  - Card view
- **MUST** provide compact outcomes via card configuration (no dedicated compact mode).
- **SHOULD** default visible fields:
  - List: `8-10`
  - Card: `4-6`
- **MUST** allow user increase without hard cap.

#### 8.3.4 Inline List Settings

- **MUST** inline list settings directly in the list workspace.
- **MUST** include inlined controls for:
  - Field visibility
  - Grouping
  - Sorting
  - Filters
  - View mode
- **MUST** remove the dynamic field/value model from V1.
- **MUST** allow users to edit list behavior entirely from the active list view.

#### 8.3.5 Grouping

- **MUST** support grouping by one or multiple keys.
- **MUST** support categorical and derived/range-based grouping.
- **MUST** duplicate entries for multi-value group keys.
- **MUST** support drag-and-drop group ordering and quick sort.
- **MUST** support collapse/expand at group level.

#### 8.3.6 Sorting

- **MUST** support global sorting.
- **MUST** support group-level override sorting.

#### 8.3.7 Filtering and Search

- **MUST** ship advanced filtering in V1 launch.
- **MUST** support `AND`, `OR`, `NOT`.
- **MUST** support compound filters.
- **MUST** support cross-field comparisons and numeric arithmetic.
- **MUST** provide real-time match counts.
- **MUST** implement search as filtering.
- **MUST** support searchable title variants (title/japanese/english where present).

#### 8.3.8 List Settings Edit Lifecycle

- **MUST** support three outcomes while editing list settings:
  - Reset to previous state
  - Save changes by overwriting the current list
  - Save changes as a new list
- **MUST** clearly distinguish unsaved changes from saved state.
- **MUST** require explicit confirmation before destructive reset.

#### 8.3.9 Tracking, Actions, and Notifications

- **MUST** allow tracking selected per-entry values.
- **MUST** allow user-defined actions when tracked values change.
- **MUST** include `notify` as a supported change action in V1.
- **MUST** manage notification rule configuration inline within each list workspace.
- **MUST** support notification channels:
  - In-app notifications
  - Desktop OS notifications
- **SHOULD** keep the action model extensible so additional non-notification actions can be added post-V1 without redesigning the interaction pattern.

#### 8.3.10 Workspace State Matrix

| State | Required UX Behavior |
|---|---|
| `default` | Show active list with current view/group/sort/filter context |
| `loading` | Skeletons/placeholders with non-jumping layout |
| `success` | Data rendered with interaction-ready controls |
| `empty` | Explain why empty (no data vs over-filtered) and offer corrective actions |
| `error` | Show source-specific failures (sync/filter/render) with recovery options |
| `retry` | Retry fetch/sync/recompute in-place, preserving user settings |
| `partial-degraded` | Continue local interactions if one integration path fails |
| `rate-limited` | Surface queued actions, cooldown timer, and delayed sync notice |

### 8.4 Notifications Inbox Journey (`app/notifications`)

#### 8.4.1 Purpose

- **MUST** provide a dedicated notifications page where generated notifications are shown.
- **MUST NOT** centralize notification rule editing on this page in V1.
- **MUST** keep notification rule editing in list workspaces.

#### 8.4.2 Requirements

- **MUST** show chronological notification feed with clear source list/context.
- **MUST** provide read/unread state and bulk clear operations.
- **MUST** allow quick navigation from a notification to its related list/entry context.

#### 8.4.3 Notifications Page State Matrix

| State | Required UX Behavior |
|---|---|
| `default` | Show latest notifications grouped by recency |
| `loading` | Progressive load with stable feed layout |
| `success` | Notifications are actionable and link to source context |
| `empty` | Explain there are no notifications yet and where they are configured |
| `error` | Show load failure with clear retry affordance |
| `retry` | Retry feed load without losing current UI context |
| `partial-degraded` | Show available notifications if enrichment metadata fails |
| `rate-limited` | Show delayed delivery state and expected update timing |

## 9) Global Configuration Journey

### 9.1 Configuration Center Requirements

- **MUST** provide global configuration center.
- **MUST** include:
  - External link templates
  - Secrets export
  - List export (clipboard JSON)
  - List import (clipboard JSON)
  - List deletion (soft delete)
  - Logout
- **MUST NOT** include list settings editing in global configuration center.
- **MUST NOT** include notification rule editing in global configuration center.
- **MUST** sync user lists and settings via the user's Google Drive.

### 9.2 List Transfer and Deletion Operations

- **MUST** keep list export/import clipboard-only JSON in V1.
- **MUST NOT** include file upload/download for list transfer in V1.
- **MUST** implement list deletion as soft delete with undo.
- **MUST** provide a clear undo window after delete action.
- **MUST** include a settings page/state that lists all previously deleted lists.
- **MUST** allow restore actions from the deleted-lists page/state.

### 9.3 External Link Templates

- **MUST** allow URL templates with field placeholders.
- **MUST** allow any tracked entry field as template variable.
- **MUST** support favicon display and optional site label.
- **MUST** support per-link open behavior (`same tab` / `new tab`).
- **MUST** support visibility control by view mode (list/card) through same field visibility system.

### 9.4 Configuration State Matrix

| State | Required UX Behavior |
|---|---|
| `default` | Show only scoped global operations and clear action boundaries, including deleted-lists access |
| `loading` | Progressive load indicators per scoped module |
| `success` | Confirmation of completed operation (export/import/delete/logout) |
| `empty` | Explain no available lists for transfer/delete operations |
| `error` | Field-specific and section-level error feedback |
| `retry` | Retry failed save/sync without losing pending edits |
| `partial-degraded` | Disable only failed scoped modules, keep others usable |
| `rate-limited` | Queue config sync and show estimated sync delay |

## 10) Export and Integration Scope (V1 Locked)

- **MUST** constrain V1 export/integration scope to:
  - JSON
  - Nyaa
  - YouTube Music
- **MUST** treat Nyaa and YouTube Music as equal priority.
- **MUST** keep onboarding import/export secrets-focused.
- **MUST** allow onboarding credential export format that includes required secrets for re-import.

## 11) Security and Sensitive Data Requirements

This section includes full V1 requirements for secret handling behavior and implementation expectations.

### 11.1 Credential Data Classes

- **MUST** classify as sensitive:
  - Google client secret
  - OAuth access tokens / refresh tokens
  - Serialized onboarding credential export payloads

### 11.2 Storage and Transit

- **MUST** store credentials/tokens in OS-backed secure storage only.
- **MUST NOT** persist raw secrets in plain local files, logs, or analytics payloads.
- **MUST** keep in-memory secret lifetimes minimal and cleared on logout/remove actions where applicable.

### 11.3 UI Handling of Secrets

- **MUST** mask secret inputs by default.
- **MUST** support explicit reveal toggle with state indicator.
- **MUST** require explicit confirmation for secret export actions.
- **MUST** show warning copy before copying secrets to clipboard.
- **MUST** provide post-copy reminder that clipboard may be accessible by other apps.

### 11.4 Error and Recovery Security

- **MUST** use non-sensitive error messaging (codes + safe explanations).
- **MUST NOT** display raw token/secrets in error text.
- **MUST** force re-auth flows when token payload is invalid or missing.

### 11.5 Destructive Security Actions

- **MUST** require two-step confirmation for removing secrets or logging out all providers.
- **MUST** clearly describe downstream effects (session loss, sync paused, reauth needed).

## 12) Accessibility and Inclusive Design (Detailed Checklist)

Target: **WCAG 2.2 AA**.

### 12.1 Keyboard and Focus

- **MUST** make all primary actions keyboard reachable.
- **MUST** provide predictable tab order aligned with visual reading flow.
- **MUST** preserve visible focus indicators in all themes/states.
- **MUST** support keyboard operation for list controls, group collapse, sorting, filter chips, and dialogs.

### 12.2 Screen Reader and Semantics

- **MUST** provide programmatic labels for icon-only controls.
- **MUST** expose form errors with field association.
- **MUST** ensure dynamic updates (match counts, sync status) are announced appropriately.
- **SHOULD** include skip links for high-density pages.

### 12.3 Color and Contrast

- **MUST** maintain AA contrast for text and interactive indicators in dark and light modes.
- **MUST** avoid color-only signaling; pair with icons/text.

### 12.4 Motion and Reduced Motion

- **MUST** respect reduced-motion settings.
- **MUST** provide non-animated fallback for transitions that may trigger discomfort.
- **SHOULD** cap non-essential motion duration to avoid attention fatigue.

### 12.5 Touch Targets

- **MUST** keep touch targets usable on mobile/tablet (minimum `44x44` CSS px target).
- **MUST** preserve spacing to prevent accidental activation in dense list controls.

## 13) Performance UX Targets (Target + Tolerance)

Budgets below are design/UX targets to guide implementation and QA.

### 13.1 Dataset Scale

- **MUST** maintain responsive interaction design for up to `10,000` entries.

### 13.2 Interaction Budgets

| Interaction | Target | Tolerance |
|---|---|---|
| Open list/workspace (cached) | `<= 600ms` | `<= 900ms` |
| Apply simple filter | `<= 120ms` | `<= 200ms` |
| Apply complex compound filter | `<= 220ms` | `<= 350ms` |
| Sort/group recompute | `<= 180ms` | `<= 300ms` |
| Switch list/card view | `<= 120ms` | `<= 220ms` |
| Open entry details page | `<= 180ms` | `<= 300ms` |

### 13.3 Feedback Rules

- **MUST** show immediate feedback for operations expected to exceed `300ms`.
- **MUST** show progress/status for heavy operations.
- **MUST** keep inputs responsive while background work continues where possible.

## 14) Language and Content

- **MUST** use English as primary UI language.
- **MUST** support limited Japanese text display where contextually useful.
- **MUST** use friendly labels with advanced hints for power features.

## 15) Error, Empty, and Destructive Interaction Rules

- **MUST** provide actionable empty states, especially on first run.
- **MUST** distinguish no-data from no-match states.
- **MUST** show explicit API failure and rate-limit states with next-step guidance.
- **MUST** enforce two-step confirmation for destructive actions.

## 16) V1 Design Acceptance Criteria

V1 is accepted when all are true:

1. All page groups, including `app/notifications`, are designed and behaviorally specified across all five viewport classes.
2. Onboarding includes chooser-first flow and required credential collection/import.
3. Login enforces MAL + Google dual success with retry and diagnostics.
4. App workspaces provide list/card modes with configurable compact outcomes.
5. Grouping, sorting, advanced filtering, and inlined list settings are fully specified.
6. Global configuration center is reduced to links, secrets export, list export/import/delete, and logout.
7. V1 integration/export scope remains limited to JSON, Nyaa, and YouTube Music.
8. Accessibility checklist aligns to WCAG 2.2 AA and is represented in interaction specs.
9. Performance target+tolerance budgets are defined for key list operations up to 10k entries.
10. Security requirements for secret handling, export warnings, and destructive confirmations are specified.
11. Notification rules are configured inline per list, and notification feed display is handled on `app/notifications`.

## 17) Out of Scope for V1

- Offline mode
- Export formats beyond locked V1 scope
- Broad localization beyond English + limited Japanese display
- Public community preset marketplace
