use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, ClientId, ClientSecret, RefreshToken,
    TokenResponse, TokenUrl,
};
use thiserror::Error;

use super::{
    providers,
    store::{self, OAuthSecrets, OAuthStoreError},
    types::{Provider, TokenSet},
};

const EXPIRY_SKEW_SECONDS: i64 = 90;

#[derive(Debug, Error)]
pub enum OAuthTokenError {
    #[error("REAUTH_REQUIRED")]
    ReauthRequired,
    #[error("TOKEN_REFRESH_FAILED")]
    TokenRefreshFailed,
    #[error("INTERNAL")]
    Internal,
    #[error(transparent)]
    Store(#[from] OAuthStoreError),
}

impl OAuthTokenError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::ReauthRequired => "REAUTH_REQUIRED",
            Self::TokenRefreshFailed => "TOKEN_REFRESH_FAILED",
            Self::Internal => "INTERNAL",
            Self::Store(err) => err.code(),
        }
    }
}

impl From<OAuthTokenError> for String {
    fn from(value: OAuthTokenError) -> Self {
        value.code().to_string()
    }
}

pub async fn get_valid_access_token(provider: Provider) -> Result<String, OAuthTokenError> {
    let mut tokens = store::load_tokens(provider)?;

    if !is_expired(tokens.expires_at) {
        return Ok(tokens.access_token);
    }

    let secrets = store::load_oauth_secrets()?;
    tokens = refresh_with_oauth2(provider, &secrets, &tokens).await?;
    store::save_tokens(provider, &tokens)?;
    Ok(tokens.access_token)
}

pub async fn logout(provider: Provider) -> Result<(), OAuthTokenError> {
    if let (Ok(tokens), Ok(secrets)) = (store::load_tokens(provider), store::load_oauth_secrets()) {
        let _ = maybe_revoke(provider, &secrets, &tokens).await;
    }

    store::delete_tokens(provider)?;
    Ok(())
}

pub fn clear_all_tokens() -> Result<(), OAuthTokenError> {
    store::clear_all_tokens()?;
    Ok(())
}

fn is_expired(expires_at: Option<i64>) -> bool {
    match expires_at {
        Some(exp) => exp <= store::now_unix() + EXPIRY_SKEW_SECONDS,
        None => true,
    }
}

fn refresh_client(
    provider: Provider,
    secrets: &OAuthSecrets,
) -> Result<BasicClient, OAuthTokenError> {
    let cfg = providers::config(provider);
    let client = BasicClient::new(
        ClientId::new(providers::client_id_for(provider, secrets)),
        providers::client_secret_for(provider, secrets).map(ClientSecret::new),
        AuthUrl::new(cfg.auth_url.to_string()).map_err(|_| OAuthTokenError::Internal)?,
        Some(TokenUrl::new(cfg.token_url.to_string()).map_err(|_| OAuthTokenError::Internal)?),
    );

    Ok(client)
}

async fn refresh_with_oauth2(
    provider: Provider,
    secrets: &OAuthSecrets,
    tokens: &TokenSet,
) -> Result<TokenSet, OAuthTokenError> {
    if tokens.refresh_token.trim().is_empty() {
        return Err(OAuthTokenError::ReauthRequired);
    }

    let client = refresh_client(provider, secrets)?;

    let token = client
        .exchange_refresh_token(&RefreshToken::new(tokens.refresh_token.clone()))
        .request_async(async_http_client)
        .await
        .map_err(|_| OAuthTokenError::TokenRefreshFailed)?;

    let refresh_token = token
        .refresh_token()
        .map(|v| v.secret().to_string())
        .unwrap_or_else(|| tokens.refresh_token.clone());

    if refresh_token.trim().is_empty() {
        return Err(OAuthTokenError::ReauthRequired);
    }

    let expires_at = token
        .expires_in()
        .map(|duration| store::now_unix() + duration.as_secs() as i64);

    Ok(TokenSet {
        access_token: token.access_token().secret().to_string(),
        refresh_token,
        token_type: Some(token.token_type().as_ref().to_string()),
        scope: token.scopes().map(|v| {
            v.iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
                .join(" ")
        }),
        expires_at,
        updated_at: store::now_unix(),
    })
}

async fn maybe_revoke(
    provider: Provider,
    _secrets: &OAuthSecrets,
    tokens: &TokenSet,
) -> Result<(), OAuthTokenError> {
    let cfg = providers::config(provider);
    let revoke_url = match cfg.revoke_url {
        Some(v) => v,
        None => return Ok(()),
    };

    let client = reqwest::Client::new();
    let _ = client
        .post(revoke_url)
        .form(&[("token", tokens.refresh_token.as_str())])
        .send()
        .await
        .map_err(|_| OAuthTokenError::Internal)?;

    Ok(())
}
