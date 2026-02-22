use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::storage::secure_store::{self, SecureStoreError};

use super::types::{Provider, TokenSet};

pub const OAUTH_SECRETS_KEY: &str = "anilog.secrets";
pub const GOOGLE_TOKEN_KEY: &str = "anilog.google.token";
pub const MAL_TOKEN_KEY: &str = "anilog.mal.token";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthSecrets {
    pub google_client_id: String,
    pub google_client_secret: String,
    pub mal_client_id: String,
}

#[derive(Debug, Error)]
pub enum OAuthStoreError {
    #[error("SECRETS_MISSING")]
    SecretsMissing,
    #[error("SECRETS_INVALID")]
    SecretsInvalid,
    #[error("REAUTH_REQUIRED")]
    ReauthRequired,
    #[error("INTERNAL")]
    Internal,
    #[error(transparent)]
    SecureStore(#[from] SecureStoreError),
}

impl OAuthStoreError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::SecretsMissing => "SECRETS_MISSING",
            Self::SecretsInvalid => "SECRETS_INVALID",
            Self::ReauthRequired => "REAUTH_REQUIRED",
            Self::Internal => "INTERNAL",
            Self::SecureStore(err) => err.code(),
        }
    }
}

impl From<OAuthStoreError> for String {
    fn from(value: OAuthStoreError) -> Self {
        value.code().to_string()
    }
}

pub fn save_oauth_secrets(secrets: &OAuthSecrets) -> Result<(), OAuthStoreError> {
    let payload = serde_json::to_string(secrets).map_err(|_| OAuthStoreError::Internal)?;
    secure_store::set(OAUTH_SECRETS_KEY, &payload)?;
    Ok(())
}

pub fn load_oauth_secrets() -> Result<OAuthSecrets, OAuthStoreError> {
    let value = secure_store::get(OAUTH_SECRETS_KEY)?.ok_or(OAuthStoreError::SecretsMissing)?;

    serde_json::from_str(&value).map_err(|_| OAuthStoreError::SecretsInvalid)
}

pub fn remove_oauth_secrets() -> Result<(), OAuthStoreError> {
    secure_store::remove(OAUTH_SECRETS_KEY)?;
    Ok(())
}

pub fn oauth_secrets_exist() -> Result<bool, OAuthStoreError> {
    let exists = secure_store::exists(OAUTH_SECRETS_KEY)?;
    Ok(exists)
}

pub fn token_key(provider: Provider) -> &'static str {
    match provider {
        Provider::Google => GOOGLE_TOKEN_KEY,
        Provider::Mal => MAL_TOKEN_KEY,
    }
}

pub fn save_tokens(provider: Provider, token_set: &TokenSet) -> Result<(), OAuthStoreError> {
    let payload = serde_json::to_string(token_set).map_err(|_| OAuthStoreError::Internal)?;
    secure_store::set(token_key(provider), &payload)?;
    Ok(())
}

pub fn load_tokens(provider: Provider) -> Result<TokenSet, OAuthStoreError> {
    let value = secure_store::get(token_key(provider))?.ok_or(OAuthStoreError::ReauthRequired)?;
    serde_json::from_str(&value).map_err(|_| OAuthStoreError::ReauthRequired)
}

pub fn delete_tokens(provider: Provider) -> Result<(), OAuthStoreError> {
    secure_store::remove(token_key(provider))?;
    Ok(())
}

pub fn clear_all_tokens() -> Result<(), OAuthStoreError> {
    secure_store::remove(GOOGLE_TOKEN_KEY)?;
    secure_store::remove(MAL_TOKEN_KEY)?;
    Ok(())
}

pub fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or_default()
}
