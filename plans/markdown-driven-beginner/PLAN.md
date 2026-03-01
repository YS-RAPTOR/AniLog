# Markdown-Driven Beginner Onboarding Plan

## Objective

Refactor `src/routes/onboarding/beginner.tsx` so onboarding cards and inline UI blocks are generated from a markdown file, while preserving the current visual language and step-based flow.

The markdown source must support:

- step cards,
- inline secret inputs (stateful),
- inline copy blocks (single and multi),
- inline CTA buttons.

The beginner flow must still require the same credential keys as advanced setup:

- `malClientId`
- `googleClientId`
- `googleClientSecret`

---

## Requirements and Decisions

### Content source

- Add `src/content/onboarding/beginner.md` as the source of truth for beginner onboarding copy and block order.
- Route UI must be rendered from parsed markdown output, not hardcoded JSX card content.

### Parsing strategy

- Use a markdown parsing library (no custom parser-only format).
- Recommended: `remark` + `remark-parse`.
- Parse markdown headings/text with AST.
- Parse fenced `json` code blocks for interactive component blocks.

### Inline block policy

- Keep inputs inline where they appear in the narrative flow.
- Do not support `inputGroup`.
- All input fields are secret-style (masked by default).
- Copy blocks are not secret-style.

### Copy behavior policy

- `single` mode: copy one string.
- `multi` mode: copy all entries joined by newline (`"\n"`) only.
- No per-row copy action in multi mode.
- Visual overflow for copy previews should truncate/clamp, but copied value must remain faithful.

---

## Markdown Contract

## Step boundaries

- Use `##` headings as step/card boundaries.
- Heading format should be: `## 01 | Step Title`

## Interactive blocks via fenced JSON

Only fenced blocks with language `json` are interpreted as UI blocks.

### Input block

```json
{
    "type": "input",
    "key": "malClientId",
    "label": "MAL Client ID",
    "placeholder": "Paste MAL client ID"
}
```

### Copy block (single)

```json
{
    "type": "copy",
    "mode": "single",
    "label": "MAL Callback",
    "value": "anilog://oauth/callback/mal"
}
```

### Copy block (multi)

```json
{
    "type": "copy",
    "mode": "multi",
    "label": "Callback URLs",
    "values": ["anilog://oauth/callback/mal", "http://127.0.0.1:0"]
}
```

### Button block (external)

```json
{
    "type": "button",
    "variant": "external",
    "label": "Open MAL API Settings",
    "url": "https://myanimelist.net/apiconfig"
}
```

### Button block (primary)

```json
{
    "type": "button",
    "variant": "primary",
    "label": "Validate & Continue",
    "action": "validateContinue"
}
```

---

## Type System Contract

Define strict route types for parsed onboarding content.

Core keys:

- `RequiredInputKey = "malClientId" | "googleClientId" | "googleClientSecret"`
- `OnboardingCredentialState = Record<RequiredInputKey, string>`

JSON block union:

- `input` block with `key`, `label`, `placeholder`
- `copy` block with discriminated `mode`
    - `single` -> `value: string`
    - `multi` -> `values: string[]`
- `button` block as discriminated union
    - `external` -> `url: string`
    - `primary` -> `action: "validateContinue"`

Validation must reject unknown block types or invalid block shapes.

---

## Validation Rules

## Document-level validation

- At least one step exists.
- Step heading format is valid (`NN | Title`).
- Step numbers are unique.

## Input-key validation

- Parsed markdown must include all required input keys exactly once:
    - `malClientId`
    - `googleClientId`
    - `googleClientSecret`
- Missing or duplicate required keys should produce a validation failure state.

## Block-level validation

- `input`: key is one of required keys; label and placeholder are non-empty.
- `copy` single: non-empty `value`.
- `copy` multi: `values.length >= 1` and all strings non-empty.
- `button` external: valid HTTPS URL.
- `button` primary: action must be `validateContinue`.

---

## Rendering Architecture

## 1) Parser utility

Add parser utility, for example:

- `src/lib/onboarding-markdown.ts`

Responsibilities:

- Parse markdown to AST.
- Split into step sections by `h2` nodes.
- Convert prose/list nodes into renderable text/list blocks.
- Parse fenced `json` code blocks into typed interactive blocks.
- Validate required keys and block schemas.
- Return typed success/failure result.

## 2) Copy component

Add:

- `src/components/onboarding/copy-field.tsx`

Props contract:

- Single mode: `{ mode: "single", label, value }`
- Multi mode: `{ mode: "multi", label, values }`

Behavior:

- One copy button for both modes.
- Multi mode copies `values.join("\n")`.
- Show visual truncation/clamp for overflow.
- Show transient copied feedback state.

## 3) Markdown renderer component

Add:

- `src/components/onboarding/onboarding-md-renderer.tsx`

Responsibilities:

- Render each parsed step as one `OnboardingPanel`.
- Keep step number next to heading title.
- Render block list in order:
    - paragraph/list blocks
    - `input` -> secret input control
    - `copy` -> `CopyField`
    - `button` -> action/external button

## 4) Beginner route integration

Update:

- `src/routes/onboarding/beginner.tsx`

Responsibilities:

- Import markdown content via raw import.
- Parse once and memoize.
- Own state for required credentials.
- Own reveal/mask state per input key.
- Handle button actions:
    - external button opens URL in new tab/window
    - primary button triggers local validate/continue logic
- Render parser errors in an explicit onboarding error panel if config is invalid.

---

## Files to Change

Add:

- `src/content/onboarding/beginner.md`
- `src/lib/onboarding-markdown.ts`
- `src/components/onboarding/copy-field.tsx`
- `src/components/onboarding/onboarding-md-renderer.tsx`
- `plans/onboarding/MARKDOWN_DRIVEN_BEGINNER_PLAN.md` (this file)

Update:

- `src/routes/onboarding/beginner.tsx`
- `package.json` (markdown parser dependency)
- lockfile (`bun.lock`) via package manager

Optional update later:

- `src/routes/onboarding/advanced.tsx` to reuse `CopyField`

---

## Dependency Plan

Install markdown parsing dependencies:

```bash
bun add remark remark-parse
```

---

## UX and Styling Constraints

- Preserve existing onboarding visual style (`OnboardingLayout` + `OnboardingPanel`).
- Keep step number adjacent to step title.
- Keep the top hero decoration in beginner route.
- Use current button and border styling patterns for consistency.
- Secret inputs should match existing `SecretInput` interaction model.
- Copy block should look first-class and consistent with onboarding card aesthetics.

---

## Error Handling Strategy

- Fail fast on invalid markdown config, but fail gracefully in UI.
- Show a visible error panel with:
    - high-level message,
    - compact list of parser/validation issues.
- Do not crash route rendering due to malformed markdown.
- Never leak credential values in error output.

---

## Testing and Verification

## Manual checks

- Beginner route renders all three steps from markdown only.
- Input fields are inline and stateful.
- All inputs are masked by default.
- Toggle reveal works per field.
- Copy single copies exact value.
- Copy multi copies newline-joined values.
- Multi copy has one copy button only.
- Overflow preview truncates visually while copy remains full fidelity.
- External buttons open configured URLs.
- Primary button still performs expected continue behavior.

## Build checks

- Typecheck/build succeeds.
- No lint regressions in touched files.

---

## Execution Steps

1. Add markdown parser dependencies.
2. Add beginner markdown content file with step narrative and JSON blocks.
3. Implement parser/types/validation utility.
4. Implement `CopyField` component with single and multi contracts.
5. Implement markdown renderer component for step cards.
6. Refactor `beginner.tsx` to parse markdown and render from typed model.
7. Wire input state, reveal state, and button handlers.
8. Add graceful invalid-config fallback UI.
9. Run build/lint checks and verify UX behavior manually.

---

## Acceptance Criteria

- Beginner onboarding card content is fully markdown-driven.
- Required input keys are enforced and rendered inline.
- No `inputGroup` support exists.
- Copy multi mode supports copy-all only with newline join.
- Copy previews truncate visually without affecting clipboard fidelity.
- External onboarding links are configured from markdown button blocks.
- Route remains visually consistent and production-ready.
