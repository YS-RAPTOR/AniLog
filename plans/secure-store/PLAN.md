# Secure Store Implementation Plan

## Goal

Implement one app-owned secure storage interface for AniLog that works on Android, iOS, macOS, Windows, and Linux, while hiding all platform differences from the frontend.

The backend will use keyring v4 stores and expose Tauri commands:

- `secure_set`
- `secure_get`
- `secure_delete`
- `secure_exists`

## High-Level Design

### Frontend boundary

- Frontend imports only `src/lib/secure-store.ts`.
- Frontend never imports `tauri-plugin-keyring` or `tauri-plugin-keystore`.
- Frontend passes canonical key `{ service, user }` for every operation.

### Backend boundary

- Rust module `src-tauri/src/secure_store.rs` owns all secure storage logic.
- Tauri command handlers are thin wrappers around keyring-core entry operations.
- Store backend is selected once at startup in `setup`.

### Store selection policy

- Android -> `android`
- iOS -> `protected`
- macOS -> `keychain` by default
- Windows -> `windows`
- Linux -> `keyutils`

Optional debug override can be added later via environment variable, but not required for initial implementation.

---

## Data Contract

Use one request model everywhere.

```ts
export type SecureKey = {
  service: string;
  user: string;
};

export type SecureSetRequest = {
  key: SecureKey;
  value: string;
};

export type SecureGetRequest = {
  key: SecureKey;
};

export type SecureDeleteRequest = {
  key: SecureKey;
};

export type SecureExistsRequest = {
  key: SecureKey;
};
```

Command return types:

- `secure_set` -> `void`
- `secure_get` -> `string | null`
- `secure_delete` -> `void`
- `secure_exists` -> `boolean`

### Error normalization

Backend errors should be normalized to stable string codes:

- `INVALID_INPUT`
- `NOT_FOUND`
- `UNAVAILABLE`
- `PERMISSION_DENIED`
- `INTERNAL`

Keep full internal error in backend logs; return only safe code/message to frontend.

---

## Detailed Implementation Steps

## Step 1: Update `src-tauri/Cargo.toml`

Add keyring ecosystem dependencies directly in the app backend.

```toml
[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.10.0" }
tauri-plugin-log = "2"

# New
keyring = "4.0.0-rc.3"
keyring-core = "0.7.2"
```

If Cargo resolution fails for store crates, mirror upstream patch block from keyring demo:

```toml
[patch.crates-io]
android-native-keyring-store = { git = "https://github.com/open-source-cooperative/android-native-keyring-store.git", branch = "next" }
apple-native-keyring-store = { git = "https://github.com/open-source-cooperative/apple-native-keyring-store.git", branch = "next" }
dbus-secret-service-keyring-store = { git = "https://github.com/open-source-cooperative/dbus-secret-service-keyring-store.git", branch = "next" }
linux-keyutils-keyring-store = { git = "https://github.com/open-source-cooperative/linux-keyutils-keyring-store.git", branch = "next" }
windows-native-keyring-store = { git = "https://github.com/open-source-cooperative/windows-native-keyring-store.git", branch = "next" }
zbus-secret-service-keyring-store = { git = "https://github.com/open-source-cooperative/zbus-secret-service-keyring-store.git", branch = "next" }
```

## Step 2: Add backend module `src-tauri/src/secure_store.rs`

Create request models, store init, command handlers, and error mapping.

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureKey {
  pub service: String,
  pub user: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureSetRequest {
  pub key: SecureKey,
  pub value: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureGetRequest {
  pub key: SecureKey,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureDeleteRequest {
  pub key: SecureKey,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureExistsRequest {
  pub key: SecureKey,
}
```

Store initialization helper:

```rust
pub fn init_secure_store() -> Result<(), String> {
  let store_name = select_store_name();
  keyring::use_named_store(store_name).map_err(map_keyring_err)
}

fn select_store_name() -> &'static str {
  #[cfg(target_os = "android")]
  { return "android"; }
  #[cfg(target_os = "ios")]
  { return "protected"; }
  #[cfg(target_os = "macos")]
  { return "keychain"; }
  #[cfg(target_os = "windows")]
  { return "windows"; }
  #[cfg(target_os = "linux")]
  { return "keyutils"; }
  #[allow(unreachable_code)]
  "sample"
}
```

Command handlers:

```rust
#[tauri::command]
pub fn secure_set(request: SecureSetRequest) -> Result<(), String> {
  validate_key(&request.key)?;
  let entry = keyring_core::Entry::new(&request.key.service, &request.key.user)
    .map_err(map_keyring_err)?;
  entry.set_password(&request.value).map_err(map_keyring_err)
}

#[tauri::command]
pub fn secure_get(request: SecureGetRequest) -> Result<Option<String>, String> {
  validate_key(&request.key)?;
  let entry = keyring_core::Entry::new(&request.key.service, &request.key.user)
    .map_err(map_keyring_err)?;
  match entry.get_password() {
    Ok(value) => Ok(Some(value)),
    Err(keyring_core::Error::NoEntry) => Ok(None),
    Err(err) => Err(map_keyring_err(err)),
  }
}

#[tauri::command]
pub fn secure_delete(request: SecureDeleteRequest) -> Result<(), String> {
  validate_key(&request.key)?;
  let entry = keyring_core::Entry::new(&request.key.service, &request.key.user)
    .map_err(map_keyring_err)?;
  match entry.delete_credential() {
    Ok(()) | Err(keyring_core::Error::NoEntry) => Ok(()),
    Err(err) => Err(map_keyring_err(err)),
  }
}

#[tauri::command]
pub fn secure_exists(request: SecureExistsRequest) -> Result<bool, String> {
  validate_key(&request.key)?;
  let entry = keyring_core::Entry::new(&request.key.service, &request.key.user)
    .map_err(map_keyring_err)?;
  match entry.get_password() {
    Ok(_) => Ok(true),
    Err(keyring_core::Error::NoEntry) => Ok(false),
    Err(err) => Err(map_keyring_err(err)),
  }
}
```

Validation and error mapping:

```rust
fn validate_key(key: &SecureKey) -> Result<(), String> {
  if key.service.trim().is_empty() || key.user.trim().is_empty() {
    return Err("INVALID_INPUT: service and user are required".to_string());
  }
  Ok(())
}

fn map_keyring_err<E: std::fmt::Display>(err: E) -> String {
  let message = err.to_string();
  if message.contains("NoEntry") {
    return "NOT_FOUND: credential does not exist".to_string();
  }
  if message.contains("Permission") || message.contains("denied") {
    return "PERMISSION_DENIED: secure store denied access".to_string();
  }
  format!("INTERNAL: {message}")
}
```

## Step 3: Wire commands in `src-tauri/src/lib.rs`

```rust
mod secure_store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      secure_store::init_secure_store()
        .map_err(|e| -> Box<dyn std::error::Error> { e.into() })?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      secure_store::secure_set,
      secure_store::secure_get,
      secure_store::secure_delete,
      secure_store::secure_exists,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

## Step 4: Add frontend wrapper `src/lib/secure-store.ts`

```ts
import { invoke } from "@tauri-apps/api/core";

export type SecureKey = {
  service: string;
  user: string;
};

export const secureStore = {
  set: (key: SecureKey, value: string) =>
    invoke<void>("secure_set", { request: { key, value } }),

  get: (key: SecureKey) =>
    invoke<string | null>("secure_get", { request: { key } }),

  delete: (key: SecureKey) =>
    invoke<void>("secure_delete", { request: { key } }),

  exists: (key: SecureKey) =>
    invoke<boolean>("secure_exists", { request: { key } }),
};
```

## Step 5: Replace call sites

Search and replace any direct secure storage imports/calls in frontend.

Target patterns to remove:

- `@impierce/tauri-plugin-keystore`
- `tauri-plugin-keyring-api`
- any direct plugin `invoke("plugin:*")`

Replace with `secureStore.*` calls.

---

## File-by-File Change List

### `src-tauri/Cargo.toml`

- Add `keyring` and `keyring-core`.
- Optionally add `[patch.crates-io]` store overrides if build issues appear.

### `src-tauri/src/lib.rs`

- Add `mod secure_store;`.
- Call `secure_store::init_secure_store()` in setup.
- Register all four commands.

### `src-tauri/src/secure_store.rs` (new)

- Request models.
- Platform store selector.
- Key validation.
- Command handlers: set/get/delete/exists.
- Error normalization helpers.

### `src/lib/secure-store.ts` (new)

- Typed wrapper around Tauri `invoke`.
- Exports `set/get/delete/exists`.

### `README.md`

- Document secure store API.
- Document canonical key format (`service`, `user`).
- Document platform store mapping.

---

## Risks and Mitigations

### Risk: keyring v4 RC crate churn

- Pin exact versions in Cargo.
- Keep all storage logic in one backend module.
- Use upstream patch block only when needed.

### Risk: platform-specific constraints (Apple signing, Linux env)

- Default macOS to `keychain` for broad compatibility.
- Keep iOS on `protected`.
- Keep Linux default as `keyutils` first.

### Risk: thread sequencing on some stores

- Keep operations simple and synchronous per command.
- Avoid racing operations on the same key from multiple threads.

---

## Acceptance Criteria

- Frontend has one secure-store module and no platform branches.
- Backend initializes correct store for each target OS.
- `secure_set/get/delete/exists` behave consistently on all targets.
- Missing key behavior is stable (`get -> null`, `exists -> false`).
- No biometric prompt is required on every operation by default.
- Plan is fully documented and implementation-ready.

---

## Immediate Execution Checklist

1. Update `src-tauri/Cargo.toml` dependencies.
2. Add `src-tauri/src/secure_store.rs` with snippets above.
3. Wire setup and command registration in `src-tauri/src/lib.rs`.
4. Add `src/lib/secure-store.ts` wrapper.
5. Replace old plugin call sites.
6. Run app and verify command flow on target platforms.
