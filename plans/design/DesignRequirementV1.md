# AniLog Design Requirement V1

## 1. Document Intent

This document defines V1 design requirements for AniLog as a Tauri application.

- Scope is design and UX requirements only.
- This document is intentionally prescriptive for visual system, interaction patterns, and behavior.
- Product uses four page groups: `Onboarding`, `Login`, `app/anime`, `app/manga` (including light novels).

## 2. Product Vision and UX Goals

AniLog is a modern, power-user-focused interface on top of MyAnimeList (MAL) data.

- Primary value: significantly better usability, speed, and flexibility than MAL web UX.
- Top user types: MAL power users, data tinkerers, and casual trackers.
- Success criteria for V1:
    - Usability and speed
    - Power-user flexibility
    - Visual distinctiveness
    - Accessibility compliance (WCAG 2.2 AA)
    - Parity with MAL data

## 3. Platform and Responsive Targets

- Runtime target: Tauri desktop app with responsive layouts supporting mobile and desktop as first-class.
- Required viewport classes:
    - Mobile portrait
    - Mobile landscape
    - Tablet portrait
    - Tablet landscape
    - Desktop
- Desktop minimum supported window size: `1280x720`.
- Tablet interaction priority: touch-first.
- Offline mode is not supported in V1.

## 4. Information Architecture and Flow

### 4.1 Top-Level Flow

Required top-level experience sequence:

1. Onboarding
2. Login
3. App (anime/manga workspaces)

### 4.2 Auth and Access Rules

- Both MAL and Google are required (hard requirement) before full app unlock.
- Login is presented as two separate login pages/steps.
- If either provider fails:
    - User remains in flow
    - Clear diagnostics are shown
    - Retry is available without losing progress

### 4.3 Source of Truth and Sync UX

- MAL is the source of truth for anime/manga entry data.
- Conflict preference in V1: MAL values always win.
- Refresh/sync behavior is user-configurable.
- Rate-limit states must be explicit in UI (cooldown/queued-action visibility).

## 5. Brand and Visual Direction

### 5.1 Design Direction

- Visual style: playful otaku.
- Theme strategy: dark-first with full light mode parity.
- Brand reference: AniLog name only (no finalized logo/mascot requirement for V1).
- Motion style: expressive motion, but still functionally clear.

### 5.2 Typography Requirements

V1 must use a named font stack with fallbacks.

- Primary UI family: `Noto Sans` -> `Inter` -> `system-ui` -> `sans-serif`
- Display/accent family: `Bricolage Grotesque` -> `Noto Sans` -> `sans-serif`
- Mono/data family: `JetBrains Mono` -> `ui-monospace` -> `monospace`
- Japanese fallback support required in stack (for mixed EN/JP labels and titles).

### 5.3 Design System Prescriptiveness

The design system must define concrete tokens and behavior.

- Color tokens for both dark and light themes
- Type scale and weight mapping
- Spacing scale and layout rhythm
- Radius, elevation, and border tokens
- Interaction states (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`, `success`)

## 6. Navigation Model

- Desktop/tablet: left sidebar + top command bar.
- Mobile: same sidebar pattern via off-canvas drawer.
- `app/anime` and `app/manga` are first-class parallel workspaces.
- Entry interaction opens a full dedicated entry details page (not drawer-only).

## 7. Page Group Requirements

### 7.1 Onboarding

Onboarding is required before login and collects required app credentials.

Required onboarding paths:

- Chooser screen first: `Beginner`, `Advanced`, `Import`
- Beginner: step-by-step guided setup with showing the different values required for smoothly setting up the google and mal client IDs and secrets. Some of the copyable valuse are the redirect URLs for both MAL and Google, and the required app types, scopes, and settings for both providers.
- Advanced: concise setup with rationale hints, still explicitly showing values required in the setup (MAL/Google redirect URLs, app types, scopes, and required app settings) but less hand holding
- Import: JSON import for onboarding credentials

Required collected values in onboarding:

- MAL client ID
- Google client ID
- Google client secret

Completion rule:

- Onboarding completes only when required values are validly provided/imported.

### 7.2 Login

- MAL login UI and Google login UI are separate steps/pages.
- Both must succeed to continue.
- Each step must provide:
    - Clear status
    - Retry action
    - Error diagnostics

### 7.3 app/anime and app/manga

- Core paradigm is list-centric workspace.
- Must prioritize browse, discover, and management workflows.
- First-run experience should include starter template list views.

## 8. List-Centric UX Requirements

### 8.1 Lists and Multi-List Management

- Users can create and manage multiple lists.
- Anime and manga lists are separate and independently configurable.
- Custom lists are supported.
- Switching between lists must be fast and obvious.

### 8.2 Entry Presentation Modes

Required display modes:

- List view
- Card view

Compact view behavior:

- No separate dedicated mode is required.
- Compact layouts emerge from card view configuration options.

Default density guidance:

- List default shows 8-10 fields
- Card default shows 4-6 fields
- User may increase field count without hard cap

### 8.3 Grouping

- Lists support grouping by one or multiple keys.
- Supports categorical and derived/range-based groups.
- Multi-value fields (for example genres) duplicate membership across groups.
- Group order supports drag-and-drop and quick sort.
- Group collapse/expand is required.

### 8.4 Sorting

- Global sorting is supported.
- Group-level sorting override is supported.

### 8.5 Filtering and Search

V1 requires full advanced filtering at launch.

- Filter by any tracked field.
- Supports `AND`, `OR`, and `NOT` logic.
- Supports compound multi-filter workflows.
- Supports cross-field comparisons.
- Supports simple arithmetic operations on numeric comparisons.
- Real-time match count feedback is required.

Search model requirement:

- Search is implemented as filtering.
- Any field can be searchable, including title variants (title/Japanese/English).

### 8.6 Dynamic Filter Values (Runtime Parameters)

V1 must support dynamic filter values so lists can behave like parameterized views.

- Any filter value can be marked dynamic.
- Dynamic values are prompted at list open or represented as inline controls in-list.
- Example required use cases:
    - Seasonal list: dynamic `year` and `season` selectors.
    - Search list: dynamic text input bound to title/name filters.
- Dynamic controls must update result set in real time and remain understandable to non-technical users.

### 8.7 Entry Tracking and Notifications

- Users can track selected values per entry.
- Users can configure notification rules when tracked values change.
- Notification channels in V1:
    - In-app notifications
    - Desktop OS notifications

## 9. Configuration and Settings

### 9.1 Configuration Model

- Configuration is managed from a global configuration center.
- Everything editable globally must be supported, including list-related settings.

Required configuration areas:

- Integrations
- External links templates
- List settings and display behavior
- Presets/saved list settings
- Exports/imports
- Notifications

Cloud sync requirement:

- User lists and settings are stored in the user's Google Drive and synced across the user's devices.

### 9.2 Presets Definition (List Settings)

In V1, presets mean saved settings for a list configuration state, including:

- View mode and field visibility
- Grouping
- Sorting
- Filters

Requirements:

- Presets are saved in cloud
- Presets can be exported/imported via clipboard only
- List settings export/import is clipboard-only (copy/paste JSON); file download/upload is out of scope for V1
- Starter template list views are available as initial defaults

### 9.3 External Link Templates

- Users can define links to external websites using entry field placeholders.
- Any tracked entry field can be used in URL templates.
- UI must support favicon display and optional site label display.
- Per-link open behavior is configurable (`same tab` or `new tab`).
- Link fields can be shown/hidden per view mode (list/card) using the same field visibility model as other tracked fields.

## 10. Export and Integration Requirements

V1 export/integration scope is limited to:

- JSON
- Nyaa
- YouTube Music

Priority:

- Nyaa and YouTube Music are equal priority.

Credential export/import requirement:

- Onboarding import/export flow is secrets-focused.
- Export format for onboarding credentials includes secrets (intended for re-import during onboarding).

## 11. Accessibility and Inclusive Design

Required target: WCAG 2.2 AA.

V1 design must explicitly include:

- Keyboard accessibility for all primary actions
- Visible focus indicators
- Contrast compliance in dark and light themes
- Screen-reader-friendly labels and structure
- Motion controls and reduced-motion-safe behavior
- Touch target sizing suitable for tablet/mobile usage

## 12. Performance and Scale UX Requirements

- UI interactions must remain responsive for datasets up to `10,000` entries.
- Filtering, grouping, sorting, and view switching must be designed for power-user speed.
- Heavy operations must provide progress or status feedback.

## 13. Language and Content Rules

- Primary UI language is English.
- Limited Japanese text display is supported where contextually valuable.
- Terminology style: friendly labels with advanced hints.

## 14. Error, Empty, and Destructive States

- First-run app should present preset list views, with clear guidance where data is missing.
- API failures and rate limits must have explicit, actionable states.
- Destructive actions require two-step confirmation.

## 15. V1 Acceptance Criteria (Design-Level)

V1 is accepted when all items below are true:

1. All four page groups are designed with consistent behavior across the five required viewport classes.
2. Onboarding supports chooser-first flow and collects/imports required credentials.
3. Login flow requires both MAL and Google with robust retry/diagnostics UX.
4. App workspaces provide list and card modes, with compact outcomes achievable via card configuration.
5. Grouping, sorting, and advanced filtering features are fully represented in the UX design.
6. Dynamic filter values are supported and exemplified by seasonal and text-search list patterns.
7. Global configuration center includes integrations, links, list settings, presets, exports, and notifications.
8. V1 integrations are constrained to JSON, Nyaa, and YouTube Music.
9. Accessibility requirements align with WCAG 2.2 AA in both dark and light themes.
10. Design demonstrates responsive, performant behavior for up to 10k entries.

## 16. Out of Scope for V1

- Offline support
- Broader export formats beyond JSON
- Localization beyond English with limited Japanese text usage
- Public community preset marketplace
