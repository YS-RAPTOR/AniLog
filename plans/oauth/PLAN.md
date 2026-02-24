# OAuth Plan (Google + MyAnimeList)

## Objective

Implement OAuth in Rust with one simple frontend API and strict secret boundaries.

Frontend must only use:

- `setSecrets(secrets)`
- `removeSecrets()`
- `secretsExist()`
- `login(provider)`
- `logout(provider)`
- `getAccessToken(provider)`

Everything else stays internal to Rust.

---

## Hard Requirements

- Use Rust `oauth2` crate for shared OAuth logic.
- Use desktop localhost callback flow.
- Use mobile deep-link callback flow.
- Keep secure store generic and internal-only (not invokable from frontend).
- Store secrets as one JSON object.
- Token keys must be:
  - `anilog.secrets`
  - `anilog.google.token`
  - `anilog.mal.token`
- Refresh token is mandatory.
  - Login fails if missing refresh token.
  - `getAccessToken` depends on refresh capability.
- Tauri identifier:
  - `io.github.ys_raptor.anilog`

---

## Architecture

## Platform callback transport

- Desktop (Windows/Linux/macOS):
  - callback capture: `tauri-plugin-oauth` (localhost)
  - browser launch: `@tauri-apps/plugin-opener`
- Mobile (Android/iOS):
  - callback capture: `@tauri-apps/plugin-deep-link` with custom scheme (`appLink: false`)
  - browser launch: `@tauri-apps/plugin-opener`

## Shared OAuth engine (Rust)

- `oauth2` crate handles:
  - auth URL generation
  - PKCE
  - state/CSRF
  - code exchange
  - refresh flow
- Provider-specific config is data-only (URLs/scopes/PKCE mode).

## Internal storage boundary

- Generic secure store functions live in:
  - `src-tauri/src/storage/secure_store.rs`
- Generic functions:
  - `set(key, value)`
  - `get(key)`
  - `remove(key)`
  - `exists(key)`
- These are internal Rust helpers only.
- OAuth module specializes keys and JSON models in `src-tauri/src/oauth/store.rs`.

---

## Data Models

## Frontend types

```ts
export type OAuthProvider = "google" | "mal";

export type OAuthSecrets = {
  googleClientId: string;
  googleClientSecret: string;
  malClientId: string;
};
```

## Stored secret payload (`anilog.secrets`)

```json
{
  "googleClientId": "...",
  "googleClientSecret": "...",
  "malClientId": "..."
}
```

## Stored token payload (`anilog.google.token`, `anilog.mal.token`)

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "scope": "...",
  "expiresAt": 1760000000,
  "updatedAt": 1760000000
}
```

Rust model must require refresh token:

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenSet {
  pub access_token: String,
  pub refresh_token: String,
  pub token_type: Option<String>,
  pub scope: Option<String>,
  pub expires_at: Option<i64>,
  pub updated_at: i64,
}
```

---

## Provider Configuration

```rust
pub enum Provider { Google, Mal }

pub struct ProviderConfig {
  pub auth_url: &'static str,
  pub token_url: &'static str,
  pub revoke_url: Option<&'static str>,
  pub scopes: &'static [&'static str],
  pub pkce_plain: bool,
}

pub fn config(provider: Provider) -> ProviderConfig {
  match provider {
    Provider::Google => ProviderConfig {
      auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
      token_url: "https://oauth2.googleapis.com/token",
      revoke_url: Some("https://oauth2.googleapis.com/revoke"),
      scopes: &[
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file"
      ],
      pkce_plain: false,
    },
    Provider::Mal => ProviderConfig {
      auth_url: "https://myanimelist.net/v1/oauth2/authorize",
      token_url: "https://myanimelist.net/v1/oauth2/token",
      revoke_url: None,
      scopes: &[],
      pkce_plain: true,
    },
  }
}
```

---

## Frontend API Surface

`src/lib/auth.ts`:

```ts
import { invoke } from "@tauri-apps/api/core";

export type OAuthProvider = "google" | "mal";
export type OAuthSecrets = {
  googleClientId: string;
  googleClientSecret: string;
  malClientId: string;
};

export const authApi = {
  setSecrets: (secrets: OAuthSecrets) => invoke<void>("set_secrets", { secrets }),
  removeSecrets: () => invoke<void>("remove_secrets"),
  secretsExist: () => invoke<boolean>("secrets_exist"),
  login: (provider: OAuthProvider) => invoke<void>("login", { provider }),
  logout: (provider: OAuthProvider) => invoke<void>("logout", { provider }),
  getAccessToken: (provider: OAuthProvider) => invoke<string>("get_access_token", { provider }),
};
```

Do not add `getSecrets`.

---

## Rust Module Layout

```text
src-tauri/src/
  lib.rs
  storage/
    mod.rs
    secure_store.rs      # generic internal set/get/remove/exists
  oauth/
    mod.rs               # tauri commands only
    types.rs
    providers.rs
    state.rs             # pending login state
    flow.rs              # authorize URL + callback handling + exchange
    tokens.rs            # getAccessToken + logout + revoke
    store.rs             # key specialization + typed serialization
```

---

## Config and Dependencies

## `src-tauri/tauri.conf.json`

```json
{
  "identifier": "io.github.ys_raptor.anilog",
  "plugins": {
    "deep-link": {
      "mobile": [
        { "scheme": ["anilog"], "appLink": false }
      ],
      "desktop": {
        "schemes": ["anilog"]
      }
    }
  }
}
```

## `src-tauri/Cargo.toml` additions

```toml
[dependencies]
oauth2 = "4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
url = "2"
time = "0.3"
rand = "0.8"
base64 = "0.22"
sha2 = "0.10"
reqwest = { version = "0.12", default-features = false, features = ["rustls-tls"] }

tauri-plugin-oauth = "2"
tauri-plugin-deep-link = "2"
tauri-plugin-opener = "2"
```

## `src-tauri/src/lib.rs`

```rust
mod oauth;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_oauth::init())
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      oauth::init_deeplink_listener(app)?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      oauth::set_secrets,
      oauth::remove_secrets,
      oauth::secrets_exist,
      oauth::login,
      oauth::logout,
      oauth::get_access_token,
    ])
    .run(tauri::generate_context!())
    .expect("error while running app");
}
```

---

## Command Behavior

## `set_secrets(secrets)`

- Validate non-empty fields.
- Save single JSON object to `anilog.secrets`.
- Overwrite existing value atomically.

## `remove_secrets()`

- Delete `anilog.secrets`.
- Delete both token keys:
  - `anilog.google.token`
  - `anilog.mal.token`

## `secrets_exist()`

- Return whether `anilog.secrets` exists.

## `login(provider)`

1. Load secrets internally.
2. Build provider `oauth2::BasicClient`.
3. Generate state + PKCE verifier/challenge.
4. Compute redirect URI by platform.
5. Start callback capture transport (localhost or deep-link).
6. Open auth URL in external browser.
7. Parse callback, validate state/provider/redirect shape.
8. Exchange code for token response.
9. Enforce refresh token presence:
   - if missing, return `MISSING_REFRESH_TOKEN`.
10. Persist token set to provider key.

Mandatory refresh check:

```rust
let refresh = token
  .refresh_token()
  .map(|v| v.secret().to_string())
  .ok_or_else(|| "MISSING_REFRESH_TOKEN".to_string())?;
```

## `get_access_token(provider)`

1. Load provider token set.
2. If not expired (with skew), return existing access token.
3. Otherwise refresh with stored refresh token.
4. Save updated token set.
5. Return updated access token.
6. If refresh fails (invalid/missing), return `REAUTH_REQUIRED`.

## `logout(provider)`

- Best-effort revoke (if provider has revoke endpoint).
- Delete provider token key.
- Clear pending login state.

---

## Error Contract

Return stable error codes from Rust command boundary:

- `SECRETS_MISSING`
- `SECRETS_INVALID`
- `INVALID_PROVIDER`
- `INVALID_CALLBACK`
- `STATE_MISMATCH`
- `MISSING_REFRESH_TOKEN`
- `REAUTH_REQUIRED`
- `TOKEN_EXCHANGE_FAILED`
- `TOKEN_REFRESH_FAILED`
- `INTERNAL`

Do not include sensitive data in error messages.

---

## Security Rules

- Never log client secrets, auth codes, access tokens, or refresh tokens.
- Keep generic secure store internal and unregistered as commands.
- Keep refresh token backend-only.
- Validate callback URL + state strictly.
- Keep opener/callback permissions minimal.
- On `removeSecrets`, clear token keys to avoid stale auth state.

---

## Implementation Steps

1. Add dependencies/plugins in Cargo.
2. Update `tauri.conf.json` identifier and deep-link config.
3. Create `src-tauri/src/storage/` generic internal secure store module.
4. Implement `src-tauri/src/oauth/store.rs` specialization for `anilog.*` keys.
5. Implement oauth provider/types/flow/tokens/state modules.
6. Wire plugins + command handlers in `lib.rs`.
7. Add `src/lib/auth.ts` wrapper.
8. Connect UI actions.
9. Run test matrix.

---

## Test Matrix

## Desktop

- `setSecrets` stores and `secretsExist` returns true.
- Google login succeeds and stores `anilog.google.token`.
- MAL login succeeds and stores `anilog.mal.token`.
- `getAccessToken` returns token and refreshes after expiry.
- Login fails with `MISSING_REFRESH_TOKEN` when provider omits refresh token.
- `logout(provider)` clears only that provider token.

## Mobile

- Deep-link callback completes login on Android and iOS.
- App cold-start callback path works.
- `getAccessToken` refreshes without exposing refresh token.

## Secrets lifecycle

- `removeSecrets` clears `anilog.secrets` and both provider token keys.
- `secretsExist` returns false after removal.

---

## Acceptance Criteria

- Frontend has exactly six OAuth functions.
- No frontend path can read secrets.
- Generic secure store is internal-only.
- Secrets are stored as one JSON object at `anilog.secrets`.
- Token keys use `anilog.google.token` and `anilog.mal.token`.
- Refresh token is mandatory for successful login.
- Desktop uses localhost callback; mobile uses deep-link callback.
