use keyring_core::{Entry, Error as KeyringError};
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

pub fn init_secure_store() -> Result<(), String> {
  keyring::use_named_store(select_store_name()).map_err(map_keyring_error)
}

#[tauri::command]
pub fn secure_set(request: SecureSetRequest) -> Result<(), String> {
  validate_key(&request.key)?;
  let entry = get_entry(&request.key)?;
  entry.set_password(&request.value).map_err(map_keyring_error)
}

#[tauri::command]
pub fn secure_get(request: SecureGetRequest) -> Result<Option<String>, String> {
  validate_key(&request.key)?;
  let entry = get_entry(&request.key)?;

  match entry.get_password() {
    Ok(value) => Ok(Some(value)),
    Err(KeyringError::NoEntry) => Ok(None),
    Err(err) => Err(map_keyring_error(err)),
  }
}

#[tauri::command]
pub fn secure_delete(request: SecureDeleteRequest) -> Result<(), String> {
  validate_key(&request.key)?;
  let entry = get_entry(&request.key)?;

  match entry.delete_credential() {
    Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
    Err(err) => Err(map_keyring_error(err)),
  }
}

#[tauri::command]
pub fn secure_exists(request: SecureExistsRequest) -> Result<bool, String> {
  validate_key(&request.key)?;
  let entry = get_entry(&request.key)?;

  match entry.get_password() {
    Ok(_) => Ok(true),
    Err(KeyringError::NoEntry) => Ok(false),
    Err(err) => Err(map_keyring_error(err)),
  }
}

fn get_entry(key: &SecureKey) -> Result<Entry, String> {
  Entry::new(&key.service, &key.user).map_err(map_keyring_error)
}

fn validate_key(key: &SecureKey) -> Result<(), String> {
  if key.service.trim().is_empty() {
    return Err("INVALID_INPUT: service is required".to_string());
  }
  if key.user.trim().is_empty() {
    return Err("INVALID_INPUT: user is required".to_string());
  }
  Ok(())
}

fn select_store_name() -> &'static str {
  #[cfg(target_os = "android")]
  {
    return "android";
  }
  #[cfg(target_os = "ios")]
  {
    return "protected";
  }
  #[cfg(target_os = "macos")]
  {
    return "keychain";
  }
  #[cfg(target_os = "windows")]
  {
    return "windows";
  }
  #[cfg(target_os = "linux")]
  {
    return "keyutils";
  }

  #[allow(unreachable_code)]
  "sample"
}

fn map_keyring_error(error: KeyringError) -> String {
  match error {
    KeyringError::NoEntry => "NOT_FOUND: credential does not exist".to_string(),
    KeyringError::NoStorageAccess(err) => {
      format!("PERMISSION_DENIED: secure store is not accessible ({err})")
    }
    KeyringError::NoDefaultStore => {
      "UNAVAILABLE: secure store is not initialized".to_string()
    }
    KeyringError::NotSupportedByStore(vendor) => {
      format!("UNAVAILABLE: store does not support this operation ({vendor})")
    }
    KeyringError::Invalid(field, reason) => {
      format!("INVALID_INPUT: {field} {reason}")
    }
    KeyringError::TooLong(field, limit) => {
      format!("INVALID_INPUT: {field} exceeds platform limit {limit}")
    }
    KeyringError::PlatformFailure(err) => {
      format!("INTERNAL: platform secure storage failure ({err})")
    }
    KeyringError::BadEncoding(_) => {
      "INTERNAL: secure value has invalid encoding".to_string()
    }
    KeyringError::BadDataFormat(_, err) => {
      format!("INTERNAL: secure value format error ({err})")
    }
    KeyringError::Ambiguous(_) => {
      "INTERNAL: more than one credential matched the same key".to_string()
    }
    _ => format!("INTERNAL: {error}"),
  }
}
