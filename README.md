# AniLog

AniLog is a client-only Tauri app for tracking anime and syncing data with external services.

Current status: project scaffold initialized (no app logic implemented yet).

## Project goals

- Build a cross-platform desktop/mobile client (minimum: Windows, Linux, Android)
- Use external APIs as source of truth (MyAnimeList + Google Drive)
- Keep OAuth tokens and long-lived secrets out of frontend storage

## Tech stack (initialized)

- Frontend: React 19 + TypeScript + Vite + TanStack Router/Query + Tailwind CSS
- Desktop/mobile shell: Tauri v2 (Rust backend)
- Package manager/scripts: Bun + npm ecosystem packages

## Architecture direction (from `DEEP_RESEARCH.md`)

The research run recommends this baseline:

1. Secure storage: `@tauri-apps/plugin-stronghold`
2. OAuth flow: external browser + PKCE (Authorization Code flow)
3. Browser launch: `@tauri-apps/plugin-opener`
4. Redirect handling: `@tauri-apps/plugin-deep-link`
5. HTTP requests (when CORS is an issue): Tauri HTTP client plugin with strict allowlists
6. QR support:
   - Rendering: `qrcode`
   - Scanning on Android/iOS: `@tauri-apps/plugin-barcode-scanner`
   - Scanning on desktop: `@zxing/browser`

Fallback path for desktop OAuth providers that resist deep-link redirects:

- Use `tauri-plugin-oauth` loopback localhost callback on desktop only, while keeping deep links on mobile.

## Security principles

- Do not run Google OAuth inside embedded webviews
- Keep refresh tokens in backend-controlled secure storage (Stronghold)
- Validate OAuth `state` + PKCE verifier/challenge binding
- Scope Tauri permissions/capabilities tightly (opener, HTTP, etc.)
- Validate deep-link inputs strictly on desktop/mobile
- Avoid logging tokens or encoding sensitive tokens into QR codes

## Planned milestones

1. Set up plugin permissions/capabilities and app config per platform
2. Implement generic OAuth service in Rust (MyAnimeList + Google)
3. Add secure token vault and refresh lifecycle
4. Build initial anime log UI and local non-sensitive app state
5. Add QR import/export flows (render + scan)
6. Add sync routines with conflict handling

## Development

- `bun dev` - run frontend in development
- `bun run build` - type-check and build frontend
- `bunx tauri dev` - run the Tauri app in development

## Notes

- `DEEP_RESEARCH.md` contains the full comparative analysis and citations for plugin/library choices.
