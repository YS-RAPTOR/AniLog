# Onboarding Animated SVG Icon Plan (Tailwind + Motion)

## Objective

Upgrade `src/routes/onboarding/index.tsx` so each onboarding card uses a faded, animated SVG background icon instead of the current boxed foreground icon.

The animation must:

- run continuously in idle state,
- feel more alive on hover,
- stay decorative (never hurt readability),
- avoid custom CSS keyframes,
- use Tailwind for styling and `motion` for animation logic.

---

## Constraints and Decisions

- Styling/layout/state visuals use Tailwind classes only.
- Animation orchestration uses `motion` React components and transition props.
- No custom `@keyframes` in `src/index.css` for this feature.
- Keep existing onboarding card copy/layout hierarchy intact.
- Keep motion subtle and performance-safe (transform/opacity-based).

Library choice:

- Install `motion` (Motion for React).
- Bun command:

```bash
bun add motion
```

Why `motion`:

- Animates SVG groups/paths directly in JSX (`motion.g`, `motion.path`, `motion.circle`).
- Supports infinite loops, staggered timing, and hover state transitions without CSS.
- Works cleanly with Tailwind utility classes for positioning/opacity/responsive behavior.

---

## Files to Change

- `src/routes/onboarding/index.tsx`
- `package.json` (dependency update via Bun)

No new global CSS file changes are required for this implementation.

---

## Icon and Animation Design

## 1) Beginner Card (`Compass` concept)

Intent: guided navigation and "starting journey" feeling.

SVG structure:

- Outer compass ring
- Inner ring
- Cardinal tick marks
- Center pivot
- Needle group
- 3 waypoint dots near perimeter

Idle animation:

- Outer ring rotates slowly clockwise.
- Needle oscillates between left/right angles.
- Waypoint dots pulse in sequence.

Hover animation changes:

- Slight opacity increase for the entire icon layer.
- Slight scale increase (`~1.03` to `1.05`).
- Needle oscillation becomes faster.
- Ring rotation duration shortens.

Suggested motion timing:

- Ring rotation: `24s` idle -> `16s` hover, linear, infinite.
- Needle sweep: `4.8s` idle -> `3.2s` hover, easeInOut, infinite.
- Dot pulse cycle: `2.4s` infinite with stagger (`0s`, `0.35s`, `0.7s`).

## 2) Power User Card (`Gear` concept)

Intent: control, precision, advanced configuration.

SVG structure:

- Main gear body (outer teeth)
- Inner hub gear or hub ring
- Center axle
- Small accent spark/tick marker

Idle animation:

- Main gear rotates clockwise.
- Inner hub rotates counter-clockwise.
- Accent spark blinks on a periodic cadence.

Hover animation changes:

- Slight opacity increase and small scale-up.
- Both rotational loops speed up proportionally.
- Spark becomes a little brighter/frequent.

Suggested motion timing:

- Main gear: `20s` idle -> `14s` hover, linear, infinite.
- Inner hub: `28s` idle -> `20s` hover, linear, infinite.
- Spark blink: `~3.0s` infinite, opacity keyframes via motion arrays.

## 3) Import Card (`DatabaseBackup` concept)

Intent: restore/migrate existing data.

SVG structure:

- Database stack (three layered ellipses/segments)
- Upward restore arrow
- Curved return arc (optional)
- 3 small data particles

Idle animation:

- Restore arrow moves up and fades, then resets.
- Data particles float upward with staggered timing.
- Optional sheen line traverses top stack edge.

Hover animation changes:

- Slight opacity increase and scale-up.
- Arrow cycle speeds up.
- Particle travel distance and cadence slightly increase.

Suggested motion timing:

- Arrow rise loop: `3.4s` idle -> `2.6s` hover, easeInOut, infinite.
- Particle loops: `2.2s`, `2.8s`, `3.1s` with staggered delays.
- Sheen sweep: `6s` idle -> `4.5s` hover.

---

## Visual Layering and Card Composition

Each onboarding card should use this layering model:

1. `Animated background SVG layer` (absolute, faded, decorative)
2. `Content layer` (title, description, features, CTA, recommended badge)

Tailwind rules for background icon wrapper (representative):

- `absolute`
- `pointer-events-none`
- `select-none`
- `opacity-10` (or equivalent arbitrary opacity)
- `group-hover:opacity-20`
- `transition-opacity transition-transform duration-500`
- `group-hover:scale-105`
- anchored to top/right with responsive size utilities

Readability rules:

- Content remains in `relative z-10`.
- Icon layer stays behind content (`z-0`).
- Keep icon contrast low enough that text never competes.

---

## Route-to-Animation Mapping

Keep `paths` metadata and map route to icon animation type.

- `to: "/onboarding/beginner"` -> `compass`
- `to: "/onboarding/advanced"` -> `gear`
- `to: "/onboarding/import"` -> `database-restore`

Also update semantic icon choices (for internal clarity and future static fallbacks):

- Beginner -> `Compass`
- Power User -> `Cog`
- Import Data -> `DatabaseBackup`

---

## Component Plan

In `src/routes/onboarding/index.tsx`:

1. Remove the current boxed icon block in the card header.
2. Add a reusable local component:

   - `AnimatedRouteIcon({ type, boosted })`
   - `type` is one of `"compass" | "gear" | "database-restore"`
   - `boosted` is hover state boolean

3. Wrap each card in a `motion.div` or track hover using React handlers to derive `boosted`:

   - `onHoverStart` -> `boosted = true`
   - `onHoverEnd` -> `boosted = false`

4. Feed `boosted` into each animated SVG variant to alter durations/opacities/scales.
5. Keep current CTA arrow hover translation and panel hover translate behavior.

Implementation detail:

- Use `motion.svg` for parent and `motion.g/path/circle` for moving subparts.
- Use `animate` arrays and `transition` repeat instead of CSS keyframes.

---

## Motion API Pattern (No CSS Keyframes)

Pattern for repeated loops:

- Rotate loop:
  - `animate={{ rotate: 360 }}`
  - `transition={{ duration, ease: "linear", repeat: Infinity }}`

- Oscillation loop:
  - `animate={{ rotate: [-16, 16, -16] }}`
  - `transition={{ duration, ease: "easeInOut", repeat: Infinity }}`

- Pulse loop:
  - `animate={{ opacity: [0.25, 0.9, 0.25] }}`
  - `transition={{ duration, delay, repeat: Infinity }}`

- Float loop:
  - `animate={{ y: [6, -8, 6], opacity: [0, 0.9, 0] }}`
  - `transition={{ duration, delay, ease: "easeInOut", repeat: Infinity }}`

Hover boost model:

- Duration values derive from `boosted ? fast : idle`.
- Parent icon wrapper receives `animate={{ scale: boosted ? 1.04 : 1 }}`.

---

## Accessibility and Safety

- Mark background SVGs as decorative:
  - `aria-hidden="true"`
  - no focusable elements
- Respect reduced-motion using Motion hook strategy:
  - `useReducedMotion()`
  - if reduced motion is enabled, stop loops and render static faded icon state
- Keep minimum interaction affordance unchanged for keyboard users.

---

## Performance Considerations

- Prefer transform/opacity animation only.
- Keep SVG node complexity moderate.
- Avoid filter-heavy effects (`blur`, animated shadows, turbulence).
- Reuse one component pattern for all cards to keep render logic predictable.

---

## Validation Checklist

Functional:

- Each card shows a distinct animated SVG background.
- Animations loop continuously.
- Hover visibly boosts motion and opacity.
- Existing card click behavior remains unchanged.

Visual:

- Text remains readable over icons.
- Recommended badge remains clear and unobstructed.
- Mobile and desktop layouts maintain balance.

A11y:

- Decorative icons are hidden from assistive tech.
- Reduced-motion mode suppresses looping motion.

---

## Execution Steps

1. Install dependency with Bun: `bun add motion`.
2. Refactor `src/routes/onboarding/index.tsx` to remove boxed icon and introduce animated background icon component.
3. Implement three SVG variants (compass, gear, database-restore) with Motion-based loops.
4. Add hover state boost wiring per card.
5. Apply Tailwind-only class styling for placement/opacity/scale transitions.
6. Verify behavior across onboarding cards on desktop and mobile breakpoints.
7. Verify reduced-motion behavior.

---

## Acceptance Criteria

- No custom CSS keyframes were added.
- Tailwind handles visual styling and hover presentation.
- Motion library handles all SVG animation logic.
- Beginner and Import icon concepts are upgraded to better semantic visuals.
- Result feels polished, repeatable, and consistent with onboarding visual language.
