# AniLog Design Requirements V3 (Consolidated)

## 1) Document Intent

This document is the consolidated V1 design and UX specification for AniLog, integrating all approved changes from prior iterations.

- Audience: design and engineering
- Scope: UX, UI, interaction behavior, accessibility, performance UX, security UX, and acceptance criteria
- Platform target: Tauri app with responsive behavior across mobile/tablet/desktop classes
- Product page groups: `Onboarding`, `Login`, `app/anime`, `app/manga` (including light novels), `app/notifications`

### Requirement Language

- **MUST**: mandatory for V1 acceptance
- **SHOULD**: strongly recommended unless explicitly deferred
- **COULD**: optional enhancement

## 2) Product Vision and Users

### 2.1 Vision

- **MUST** provide a significantly better UX than MAL web for browsing and managing anime/manga data.
- **MUST** preserve MAL data parity for core user list and entry metadata.
- **MUST** deliver a distinctive, playful-otaku visual style with task clarity.

### 2.2 Primary Users

- **MUST** support MAL power users with large, complex lists.
- **MUST** support data-focused users who customize list behavior deeply.
- **MUST** support casual trackers via sensible defaults and clear flows.

### 2.3 V1 Success Criteria

- **MUST** achieve reliable onboarding and dual-login completion.
- **MUST** keep key list workflows responsive at up to `10,000` entries.
- **MUST** satisfy WCAG `2.2 AA` in dark and light modes.

## 3) End-to-End Journey

### 3.1 Primary Sequence

1. `Onboarding`
2. `Login` (MAL)
3. `Login` (Google)
4. `App surfaces` (`app/anime`, `app/manga`, `app/notifications`)

### 3.2 Gate Rules

- **MUST** keep onboarding and login as strict gates.
- **MUST** require success for both MAL and Google before full app unlock.
- **MUST** preserve progress if one provider fails.
- **MUST** show actionable diagnostics and retry affordances.

### 3.3 Data Source and Sync

- **MUST** treat MAL as source of truth for entry values.
- **MUST** resolve conflicts in favor of MAL in V1.
- **MUST** expose sync states: `idle`, `syncing`, `queued`, `rate-limited`, `failed`, `recovered`.

## 4) Platform and Responsive Requirements

### 4.1 Required Viewport Classes

- Mobile portrait
- Mobile landscape
- Tablet portrait
- Tablet landscape
- Desktop

### 4.2 Runtime Constraints

- **MUST** target Tauri runtime.
- **MUST** support desktop minimum window size `1280x720`.
- **MUST** prioritize touch ergonomics on tablet viewports.
- **MUST NOT** include offline support in V1.

### 4.3 Responsive Quality Rules

- **MUST** preserve information hierarchy across breakpoints.
- **MUST** avoid hiding critical actions without visible alternates.

## 5) Visual Direction

### 5.1 Direction

- **MUST** use playful-otaku style with clear functional hierarchy.
- **MUST** be dark-first with full light-mode parity.
- **MUST** use expressive but non-disruptive motion.

### 5.2 Interaction States

All interactive components **MUST** define: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`, `success`.

## 6) Navigation Model

- **MUST** use left sidebar + top command bar on desktop/tablet.
- **MUST** use off-canvas sidebar on mobile.
- **MUST** treat `app/anime` and `app/manga` as first-class parallel workspaces.
- **MUST** include `app/notifications` as a primary navigation destination.
- **MUST** open entry details on dedicated full-page route.

## 7) Field Type Taxonomy

V1 list capabilities are defined by field type behavior.

### 7.1 Required Field Types

- `Categorical (single)` (e.g., status, format)
- `Categorical (multi)` (e.g., genres, tags)
- `Boolean` (e.g., favorite)
- `Numeric` (e.g., rank, popularity)
- `Ranged numeric` (e.g., score, episodes watched/total, chapters read/total)
- `Date/time` (e.g., start date, updated at)
- `String/text` (e.g., titles, notes)
- `Link/template` (generated external links)

### 7.2 Operation Compatibility

- **MUST** define filter/group/sort compatibility by field type.
- **MUST** support type-safe cross-field comparisons.
- **MUST** support numeric arithmetic comparisons (`+`, `-`, thresholds).
- **MUST** duplicate membership for multi-value categorical grouping.

## 8) Journey Requirements and State Matrices

All relevant pages **MUST** define states: `default`, `loading`, `success`, `empty`, `error`, `retry`, `partial-degraded`, `rate-limited`.

### 8.1 Onboarding

#### 8.1.1 Flow

1. Chooser: `Beginner`, `Advanced`, `Import`
2. Path-specific setup/import
3. Validation
4. Completion to login

#### 8.1.2 Requirements

- **MUST** present chooser first.
- **MUST** collect: MAL client ID, Google client ID, Google client secret.
- **MUST** provide copy-ready setup values (redirect URLs, app types, scopes, required settings).
- **MUST** complete only after valid input/import.

#### 8.1.3 State Matrix

| State              | Required UX Behavior                                  |
| ------------------ | ----------------------------------------------------- |
| `default`          | Path chooser with clear guidance                      |
| `loading`          | Non-blocking validation/import progress               |
| `success`          | Credentials accepted; proceed to MAL login            |
| `empty`            | Explain required fields and purpose                   |
| `error`            | Inline and summary errors with fixes                  |
| `retry`            | Retry validation/import without data loss             |
| `partial-degraded` | Fallback manual instructions if helper metadata fails |
| `rate-limited`     | Cooldown info and next retry window                   |

### 8.2 Login

#### 8.2.1 Requirements

- **MUST** separate MAL and Google login steps.
- **MUST** require both steps to succeed.
- **MUST** preserve completed-provider state if the other fails.
- **MUST** provide diagnostics and retry per step.

#### 8.2.2 State Matrix

| State              | Required UX Behavior                          |
| ------------------ | --------------------------------------------- |
| `default`          | Clear provider login CTA                      |
| `loading`          | Auth in progress while awaiting callback      |
| `success`          | Step complete; proceed                        |
| `empty`            | N/A; default guidance applies                 |
| `error`            | Provider-specific safe diagnostics            |
| `retry`            | Retry current step without full restart       |
| `partial-degraded` | Reauth path if refresh/token continuity fails |
| `rate-limited`     | Show cooldown and next attempt                |

### 8.3 App Workspace (`app/anime`, `app/manga`)

#### 8.3.1 Core Workspace

- **MUST** be list-centric by default.
- **MUST** support browse, discover, and management workflows.
- **MUST** provide starter list templates on first run.

#### 8.3.2 Multi-List

- **MUST** support multiple lists.
- **MUST** keep anime and manga lists separate and independently configurable.
- **MUST** support custom list creation.
- **MUST** make list switching fast and obvious.

#### 8.3.3 Entry Views

- **MUST** support list view and card view.
- **MUST** support compact outcomes through card configuration (no dedicated compact mode).
- **SHOULD** default to `8-10` fields in list view and `4-6` fields in card view.

#### 8.3.4 Inline List Settings

- **MUST** inline all list settings in the active list workspace.
- **MUST** include inline controls for:
    - view mode
    - field visibility
    - grouping
    - sorting
    - filters
- **MUST** remove dynamic field/value model from V1.

#### 8.3.5 Grouping

- **MUST** support single and multi-key grouping.
- **MUST** support categorical and range-derived grouping.
- **MUST** support drag-and-drop group ordering and quick sort.
- **MUST** support collapse/expand by group.

#### 8.3.6 Sorting

- **MUST** support global sort.
- **MUST** support group-level sort override.

#### 8.3.7 Filtering and Search

- **MUST** ship advanced filtering in V1.
- **MUST** support `AND`, `OR`, `NOT`.
- **MUST** support compound filters.
- **MUST** support cross-field comparisons and numeric arithmetic.
- **MUST** provide real-time match counts.
- **MUST** implement search as filtering.
- **MUST** support title-variant search where present.

#### 8.3.8 List Settings Edit Lifecycle

- **MUST** provide these outcomes while editing list settings:
    - reset to previous state
    - save by overwriting current list
    - save as a new list
- **MUST** clearly indicate unsaved changes.

#### 8.3.9 Tracking, Actions, and Notifications

- **MUST** support tracking selected values per entry.
- **MUST** support actions when tracked values change.
- **MUST** include `notify` as a required V1 action.
- **MUST** manage notification rule configuration inline in each list workspace.
- **MUST** support notification channels:
    - in-app notifications
    - desktop OS notifications

#### 8.3.10 State Matrix

| State              | Required UX Behavior                                      |
| ------------------ | --------------------------------------------------------- |
| `default`          | Active list with current view/group/sort/filter context   |
| `loading`          | Stable skeleton/loading placeholders                      |
| `success`          | Data fully interactive                                    |
| `empty`            | Explain no-data vs over-filtered and suggest actions      |
| `error`            | Source-specific failure with clear recovery               |
| `retry`            | Retry fetch/sync/recompute in-place                       |
| `partial-degraded` | Keep local list interactions while some integrations fail |
| `rate-limited`     | Show cooldown, queued actions, delayed sync state         |

### 8.4 Notifications Inbox (`app/notifications`)

#### 8.4.1 Purpose

- **MUST** provide a dedicated page for viewing generated notifications.
- **MUST NOT** handle notification rule editing on this page.

#### 8.4.2 Requirements

- **MUST** show a chronological feed with source context.
- **MUST** support read/unread state.
- **MUST** support bulk clear operations.
- **MUST** support deep-link navigation to related list/entry context.

#### 8.4.3 State Matrix

| State              | Required UX Behavior                                        |
| ------------------ | ----------------------------------------------------------- |
| `default`          | Latest notifications grouped by recency                     |
| `loading`          | Progressive feed load with stable layout                    |
| `success`          | Actionable notifications with context links                 |
| `empty`            | Explain no notifications yet and where rules are configured |
| `error`            | Retryable feed-load failure                                 |
| `retry`            | Retry without losing UI context                             |
| `partial-degraded` | Show available items when enrichment fails                  |
| `rate-limited`     | Show delayed delivery and expected update timing            |

## 9) Global Configuration Center (Reduced Scope)

### 9.1 Allowed Scope

Global settings **MUST** include only:

- External link templates
- Secrets export
- List export (clipboard JSON)
- List import (clipboard JSON)
- List deletion (soft delete)
- Logout

Global settings **MUST NOT** include:

- List settings editing (handled inline in list workspace)
- Notification rule editing (handled inline in list workspace)

### 9.2 List Transfer and Deletion

- **MUST** keep list export/import clipboard-only JSON.
- **MUST NOT** support file upload/download for list transfer in V1.
- **MUST** implement deletion as soft delete with undo.
- **MUST** include a settings page/state listing all previously deleted lists.
- **MUST** support restore actions from deleted-lists state.

### 9.3 External Link Templates

- **MUST** support URL templates with entry field placeholders.
- **MUST** allow any tracked field as a template variable.
- **MUST** support favicon and optional site label display.
- **MUST** support per-link open behavior (`same tab`/`new tab`).
- **MUST** support view-mode visibility controls (list/card).

### 9.4 Configuration State Matrix

| State              | Required UX Behavior                                   |
| ------------------ | ------------------------------------------------------ |
| `default`          | Show reduced-scope operations and deleted-lists access |
| `loading`          | Progressive module loading                             |
| `success`          | Confirm completed export/import/delete/logout action   |
| `empty`            | Explain no lists available for transfer/delete         |
| `error`            | Clear operation-level errors                           |
| `retry`            | Retry failed operation without data loss               |
| `partial-degraded` | Keep unaffected operations usable                      |
| `rate-limited`     | Show queued sync and estimated delay                   |

## 10) Export and Integration Scope

- **MUST** lock V1 export/integration scope to:
    - JSON
    - Nyaa
    - YouTube Music
- **MUST** treat Nyaa and YouTube Music as equal priority.
- **MUST** keep onboarding export/import secrets-focused.

## 11) Security and Sensitive Data

### 11.1 Sensitive Classes

- Google client secret
- OAuth access/refresh tokens
- Serialized onboarding credential exports

### 11.2 Storage and Handling

- **MUST** use OS-backed secure storage for credentials/tokens.
- **MUST NOT** write raw secrets to plain files, logs, or analytics payloads.
- **MUST** minimize in-memory secret lifetimes.

### 11.3 Secret UX

- **MUST** mask secret inputs by default.
- **MUST** support explicit reveal toggle.
- **MUST** require explicit confirmation for secret export.
- **MUST** show clipboard warning before copy.
- **MUST** include post-copy reminder about clipboard exposure.

### 11.4 Recovery and Destructive Actions

- **MUST** use safe, non-sensitive error messages.
- **MUST** force reauth when token payload is invalid/missing.
- **MUST** require two-step confirmation for removing secrets and logout-all actions.

## 12) Accessibility (WCAG 2.2 AA)

### 12.1 Keyboard and Focus

- **MUST** support keyboard access for all primary actions.
- **MUST** preserve visible focus in all themes.
- **MUST** support keyboard interaction for grouping, sorting, filters, dialogs.

### 12.2 Screen Reader and Semantics

- **MUST** provide labels for icon-only controls.
- **MUST** associate validation errors with fields.
- **MUST** announce dynamic updates (e.g., match count, sync states).

### 12.3 Contrast, Motion, Touch

- **MUST** satisfy AA contrast requirements.
- **MUST** avoid color-only meaning.
- **MUST** respect reduced-motion preferences.
- **MUST** keep touch targets at least `44x44` CSS px.

## 13) Performance UX Targets (Target + Tolerance)

### 13.1 Scale

- **MUST** remain responsive up to `10,000` entries.

### 13.2 Budgets

| Interaction                   | Target     | Tolerance  |
| ----------------------------- | ---------- | ---------- |
| Open list/workspace (cached)  | `<= 600ms` | `<= 900ms` |
| Apply simple filter           | `<= 120ms` | `<= 200ms` |
| Apply complex compound filter | `<= 220ms` | `<= 350ms` |
| Sort/group recompute          | `<= 180ms` | `<= 300ms` |
| Switch list/card view         | `<= 120ms` | `<= 220ms` |
| Open entry details            | `<= 180ms` | `<= 300ms` |

### 13.3 Feedback Rules

- **MUST** provide immediate feedback for operations expected to exceed `300ms`.
- **MUST** show progress for heavy operations.

## 14) Language and Content

- **MUST** use English as primary UI language.
- **MUST** support limited Japanese text where contextually useful.
- **MUST** use friendly labels with advanced hints.

## 15) Error, Empty, and Destructive States

- **MUST** provide actionable empty states.
- **MUST** differentiate no-data from no-match outcomes.
- **MUST** provide explicit, actionable API/rate-limit error states.
- **MUST** use two-step confirmation for destructive actions.

## 16) V1 Design Acceptance Criteria

V1 is accepted when all are true:

1. All page groups (`Onboarding`, `Login`, `app/anime`, `app/manga`, `app/notifications`) are designed across all required viewport classes.
2. Onboarding supports chooser-first flow and validates required credentials.
3. Login requires MAL + Google success with robust diagnostics and retry.
4. App workspaces support list/card views and fully inline list settings.
5. Dynamic field/value parameterization is removed from V1.
6. List settings editing supports reset, overwrite, and save-as-new-list outcomes.
7. Notification rule configuration is inline per list, and notification display is in `app/notifications`.
8. Global settings remain reduced to links, secrets export, list export/import/delete, deleted-lists restore view, and logout.
9. List deletion is soft delete with undo and restore from deleted-lists state.
10. Integration scope is limited to JSON, Nyaa, and YouTube Music.
11. Accessibility requirements align with WCAG 2.2 AA.
12. Performance targets+tolerances are defined and validated for core list workflows.
13. Security requirements for secret handling and safe destructive flows are fully specified.

## 17) Out of Scope for V1

- Offline mode
- Export formats beyond locked V1 scope
- Full localization beyond English + limited Japanese display
- Public community preset marketplace
