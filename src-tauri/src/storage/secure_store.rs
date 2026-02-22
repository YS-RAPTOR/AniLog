use keyring_core::{Entry, Error as KeyringError};
use thiserror::Error;

const SERVICE_NAME: &str = "anilog";

#[derive(Debug, Clone, Error)]
pub enum SecureStoreError {
    #[error("INVALID_INPUT: key is required")]
    InvalidKey,
    #[error("NOT_FOUND: credential does not exist")]
    NotFound,
    #[error("PERMISSION_DENIED: secure store is not accessible ({0})")]
    PermissionDenied(String),
    #[error("UNAVAILABLE: {0}")]
    Unavailable(String),
    #[error("INTERNAL: {0}")]
    Internal(String),
}

impl SecureStoreError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::InvalidKey => "INVALID_INPUT",
            Self::NotFound => "NOT_FOUND",
            Self::PermissionDenied(_) => "PERMISSION_DENIED",
            Self::Unavailable(_) => "UNAVAILABLE",
            Self::Internal(_) => "INTERNAL",
        }
    }

    pub fn message(&self) -> String {
        match self {
            Self::InvalidKey => "key is required".to_string(),
            Self::NotFound => "credential does not exist".to_string(),
            Self::PermissionDenied(reason) => format!("secure store is not accessible ({reason})"),
            Self::Unavailable(reason) => reason.clone(),
            Self::Internal(reason) => reason.clone(),
        }
    }
}

impl From<SecureStoreError> for String {
    fn from(value: SecureStoreError) -> Self {
        value.to_string()
    }
}
pub fn init_secure_store() -> Result<(), SecureStoreError> {
    keyring::use_named_store(select_store_name()).map_err(map_keyring_error)
}

pub fn set(key: &str, value: &str) -> Result<(), SecureStoreError> {
    validate_key(key)?;
    let entry = get_entry(key)?;
    entry.set_password(value).map_err(map_keyring_error)
}

pub fn get(key: &str) -> Result<Option<String>, SecureStoreError> {
    validate_key(key)?;
    let entry = get_entry(key)?;

    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(err) => Err(map_keyring_error(err)),
    }
}

pub fn remove(key: &str) -> Result<(), SecureStoreError> {
    validate_key(key)?;
    let entry = get_entry(key)?;

    match entry.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(err) => Err(map_keyring_error(err)),
    }
}

pub fn exists(key: &str) -> Result<bool, SecureStoreError> {
    validate_key(key)?;
    let entry = get_entry(key)?;

    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(KeyringError::NoEntry) => Ok(false),
        Err(err) => Err(map_keyring_error(err)),
    }
}

fn get_entry(key: &str) -> Result<Entry, SecureStoreError> {
    Entry::new(SERVICE_NAME, key).map_err(map_keyring_error)
}

fn validate_key(key: &str) -> Result<(), SecureStoreError> {
    if key.trim().is_empty() {
        return Err(SecureStoreError::InvalidKey);
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

fn map_keyring_error(error: KeyringError) -> SecureStoreError {
    match error {
        KeyringError::NoEntry => SecureStoreError::NotFound,
        KeyringError::NoStorageAccess(err) => SecureStoreError::PermissionDenied(err.to_string()),
        KeyringError::NoDefaultStore => {
            SecureStoreError::Unavailable("secure store is not initialized".to_string())
        }
        KeyringError::NotSupportedByStore(vendor) => SecureStoreError::Unavailable(format!(
            "store does not support this operation ({vendor})"
        )),
        KeyringError::Invalid(field, reason) => {
            SecureStoreError::Internal(format!("invalid input from keyring ({field} {reason})"))
        }
        KeyringError::TooLong(field, limit) => {
            SecureStoreError::Internal(format!("input too long for store ({field} max {limit})"))
        }
        KeyringError::PlatformFailure(err) => {
            SecureStoreError::Internal(format!("platform secure storage failure ({err})"))
        }
        KeyringError::BadEncoding(_) => {
            SecureStoreError::Internal("secure value has invalid encoding".to_string())
        }
        KeyringError::BadDataFormat(_, err) => {
            SecureStoreError::Internal(format!("secure value format error ({err})"))
        }
        KeyringError::Ambiguous(_) => {
            SecureStoreError::Internal("more than one credential matched the same key".to_string())
        }
        _ => SecureStoreError::Internal(error.to_string()),
    }
}
