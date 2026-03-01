use std::{borrow::Cow, sync::mpsc, time::Duration};

use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope,
    TokenResponse, TokenUrl,
};
use tauri::{AppHandle, Runtime};
use tauri_plugin_opener::OpenerExt;
use thiserror::Error;
use url::Url;

use super::{
    providers,
    store::{self, OAuthSecrets, OAuthStoreError},
    types::{Provider, TokenSet},
};

#[cfg(any(target_os = "android", target_os = "ios"))]
use super::state;

const CALLBACK_TIMEOUT: Duration = Duration::from_secs(240);

struct CallbackCapture {
    callback_url: String,
    redirect_uri: String,
    pkce_verifier: PkceCodeVerifier,
}

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
struct DesktopOAuthServerGuard {
    port: Option<u16>,
}

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
impl DesktopOAuthServerGuard {
    fn new(port: u16) -> Self {
        Self { port: Some(port) }
    }

    fn disarm(&mut self) {
        self.port = None;
    }
}

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
impl Drop for DesktopOAuthServerGuard {
    fn drop(&mut self) {
        if let Some(port) = self.port.take() {
            let _ = tauri_plugin_oauth::cancel(port);
        }
    }
}

#[cfg(any(target_os = "android", target_os = "ios"))]
struct MobileWaiterGuard {
    provider: Provider,
    armed: bool,
}

#[cfg(any(target_os = "android", target_os = "ios"))]
impl MobileWaiterGuard {
    fn new(provider: Provider) -> Self {
        Self {
            provider,
            armed: true,
        }
    }

    fn disarm(&mut self) {
        self.armed = false;
    }
}

#[cfg(any(target_os = "android", target_os = "ios"))]
impl Drop for MobileWaiterGuard {
    fn drop(&mut self) {
        if self.armed {
            let _ = state::clear_mobile_waiter(self.provider);
        }
    }
}

#[derive(Debug, Error)]
pub enum OAuthFlowError {
    #[error("UNSUPPORTED_PLATFORM")]
    UnsupportedPlatform,
    #[error("INVALID_CALLBACK")]
    InvalidCallback,
    #[error("OAUTH_TIMEOUT")]
    OAuthTimeout,
    #[error("STATE_MISMATCH")]
    StateMismatch,
    #[error("TOKEN_EXCHANGE_FAILED")]
    TokenExchangeFailed,
    #[error("MISSING_REFRESH_TOKEN")]
    MissingRefreshToken,
    #[error("USER_CANCELLED")]
    UserCancelled,
    #[error("INTERNAL")]
    Internal,
    #[error(transparent)]
    Store(#[from] OAuthStoreError),
}

impl OAuthFlowError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::UnsupportedPlatform => "UNSUPPORTED_PLATFORM",
            Self::InvalidCallback => "INVALID_CALLBACK",
            Self::OAuthTimeout => "OAUTH_TIMEOUT",
            Self::StateMismatch => "STATE_MISMATCH",
            Self::TokenExchangeFailed => "TOKEN_EXCHANGE_FAILED",
            Self::MissingRefreshToken => "MISSING_REFRESH_TOKEN",
            Self::UserCancelled => "USER_CANCELLED",
            Self::Internal => "INTERNAL",
            Self::Store(err) => err.code(),
        }
    }
}

impl From<OAuthFlowError> for String {
    fn from(value: OAuthFlowError) -> Self {
        value.code().to_string()
    }
}

pub async fn login<R: Runtime>(
    provider: Provider,
    app: AppHandle<R>,
) -> Result<(), OAuthFlowError> {
    let secrets = store::load_oauth_secrets()?;
    let capture = wait_for_callback_url(provider, &secrets, &app).await?;
    let token_set = exchange_code(provider, &secrets, capture).await?;
    store::save_tokens(provider, &token_set)?;
    Ok(())
}

fn build_client(
    provider: Provider,
    redirect_uri: &str,
    secrets: &OAuthSecrets,
) -> Result<BasicClient, OAuthFlowError> {
    let cfg = providers::config(provider);
    let client_id = providers::client_id_for(provider, secrets);
    let client_secret = providers::client_secret_for(provider, secrets);

    let client = BasicClient::new(
        ClientId::new(client_id),
        client_secret.map(ClientSecret::new),
        AuthUrl::new(cfg.auth_url.to_string()).map_err(|_| OAuthFlowError::Internal)?,
        Some(TokenUrl::new(cfg.token_url.to_string()).map_err(|_| OAuthFlowError::Internal)?),
    )
    .set_redirect_uri(
        RedirectUrl::new(redirect_uri.to_string()).map_err(|_| OAuthFlowError::Internal)?,
    );

    Ok(client)
}

fn build_authorize_url(
    provider: Provider,
    redirect_uri: &str,
    secrets: &OAuthSecrets,
) -> Result<(Url, String, PkceCodeVerifier), OAuthFlowError> {
    let client = build_client(provider, redirect_uri, secrets)?;
    let cfg = providers::config(provider);
    let (pkce_challenge, pkce_verifier) = if cfg.pkce_plain {
        PkceCodeChallenge::new_random_plain()
    } else {
        PkceCodeChallenge::new_random_sha256()
    };

    let mut request = client
        .authorize_url(CsrfToken::new_random)
        .set_pkce_challenge(pkce_challenge);

    for scope in cfg.scopes {
        request = request.add_scope(Scope::new(scope.to_string()));
    }

    if provider == Provider::Google {
        request = request
            .add_extra_param("access_type", "offline")
            .add_extra_param("prompt", "consent");
    }

    let (auth_url, csrf) = request.url();
    Ok((auth_url, csrf.secret().to_string(), pkce_verifier))
}

async fn wait_for_callback_url<R: Runtime>(
    provider: Provider,
    secrets: &OAuthSecrets,
    app: &AppHandle<R>,
) -> Result<CallbackCapture, OAuthFlowError> {
    #[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
    {
        return wait_for_callback_url_desktop(provider, secrets, app).await;
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        return wait_for_callback_url_mobile(provider, secrets, app).await;
    }

    #[allow(unreachable_code)]
    Err(OAuthFlowError::UnsupportedPlatform)
}

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
async fn wait_for_callback_url_desktop<R: Runtime>(
    provider: Provider,
    secrets: &OAuthSecrets,
    app: &AppHandle<R>,
) -> Result<CallbackCapture, OAuthFlowError> {
    let (sender, receiver) = mpsc::channel::<String>();
    let oauth_config = tauri_plugin_oauth::OauthConfig {
        ports: Some(vec![2003, 2030, 2300, 3002, 3020, 3200]),
        response: Some(Cow::Borrowed(
            "<html><body><p>Login complete. You can return to AniLog.</p></body></html>",
        )),
    };

    let port = tauri_plugin_oauth::start_with_config(oauth_config, move |url| {
        let _ = sender.send(url);
    })
    .map_err(|_| OAuthFlowError::Internal)?;
    let mut server_guard = DesktopOAuthServerGuard::new(port);

    let redirect_uri = format!("http://127.0.0.1:{port}/oauth/{provider}/callback");
    let (auth_url, state, pkce_verifier) = build_authorize_url(provider, &redirect_uri, secrets)?;
    app.opener()
        .open_url(auth_url.as_str(), None::<&str>)
        .map_err(|_| OAuthFlowError::Internal)?;

    let callback_url = receiver
        .recv_timeout(CALLBACK_TIMEOUT)
        .map_err(|_| OAuthFlowError::OAuthTimeout)?;

    server_guard.disarm();
    let _ = tauri_plugin_oauth::cancel(port);

    validate_callback_redirect(&callback_url, &redirect_uri)?;
    validate_callback_state(&callback_url, &state)?;
    Ok(CallbackCapture {
        callback_url,
        redirect_uri,
        pkce_verifier,
    })
}

#[cfg(any(target_os = "android", target_os = "ios"))]
async fn wait_for_callback_url_mobile<R: Runtime>(
    provider: Provider,
    secrets: &OAuthSecrets,
    app: &AppHandle<R>,
) -> Result<CallbackCapture, OAuthFlowError> {
    let _ = state::take_pending_mobile_url(provider).map_err(|_| OAuthFlowError::Internal)?;

    let (sender, receiver) = mpsc::channel::<String>();
    state::register_mobile_waiter(provider, sender).map_err(|_| OAuthFlowError::Internal)?;
    let mut waiter_guard = MobileWaiterGuard::new(provider);

    let redirect_uri = format!("anilog://oauth/{provider}/callback");
    let (auth_url, state, pkce_verifier) = build_authorize_url(provider, &redirect_uri, secrets)?;

    app.opener()
        .open_url(auth_url.as_str(), None::<&str>)
        .map_err(|_| OAuthFlowError::Internal)?;

    let callback_url = receiver
        .recv_timeout(CALLBACK_TIMEOUT)
        .map_err(|_| OAuthFlowError::OAuthTimeout)?;

    waiter_guard.disarm();
    let _ = state::clear_mobile_waiter(provider);
    validate_callback_redirect(&callback_url, &redirect_uri)?;
    validate_callback_state(&callback_url, &state)?;
    Ok(CallbackCapture {
        callback_url,
        redirect_uri,
        pkce_verifier,
    })
}

fn extract_callback_code(callback_url: &str) -> Result<String, OAuthFlowError> {
    let url = Url::parse(callback_url).map_err(|_| OAuthFlowError::InvalidCallback)?;

    if let Some(err) = callback_error_from_url(&url) {
        return Err(err);
    }

    for (key, value) in url.query_pairs() {
        if key == "code" {
            return Ok(value.to_string());
        }
    }
    Err(OAuthFlowError::InvalidCallback)
}

fn validate_callback_state(callback_url: &str, expected_state: &str) -> Result<(), OAuthFlowError> {
    let url = Url::parse(callback_url).map_err(|_| OAuthFlowError::InvalidCallback)?;

    if let Some(err) = callback_error_from_url(&url) {
        return Err(err);
    }

    let state = url
        .query_pairs()
        .find(|(k, _)| k == "state")
        .map(|(_, v)| v.to_string())
        .ok_or(OAuthFlowError::StateMismatch)?;

    if state == expected_state {
        Ok(())
    } else {
        Err(OAuthFlowError::StateMismatch)
    }
}

fn validate_callback_redirect(
    callback_url: &str,
    redirect_uri: &str,
) -> Result<(), OAuthFlowError> {
    let callback = Url::parse(callback_url).map_err(|_| OAuthFlowError::InvalidCallback)?;
    let expected = Url::parse(redirect_uri).map_err(|_| OAuthFlowError::Internal)?;

    if callback.scheme() != expected.scheme()
        || callback.host_str() != expected.host_str()
        || callback.port_or_known_default() != expected.port_or_known_default()
        || callback.path() != expected.path()
    {
        return Err(OAuthFlowError::InvalidCallback);
    }

    Ok(())
}

fn callback_error_from_url(url: &Url) -> Option<OAuthFlowError> {
    let error = url
        .query_pairs()
        .find(|(k, _)| k == "error")
        .map(|(_, v)| v.to_string())?;

    if error == "access_denied" {
        return Some(OAuthFlowError::UserCancelled);
    }

    Some(OAuthFlowError::InvalidCallback)
}

async fn exchange_code(
    provider: Provider,
    secrets: &OAuthSecrets,
    capture: CallbackCapture,
) -> Result<TokenSet, OAuthFlowError> {
    let client = build_client(provider, &capture.redirect_uri, secrets)?;
    let code = extract_callback_code(&capture.callback_url)?;

    let token = client
        .exchange_code(AuthorizationCode::new(code))
        .set_pkce_verifier(capture.pkce_verifier)
        .request_async(async_http_client)
        .await
        .map_err(|_| OAuthFlowError::TokenExchangeFailed)?;

    let refresh_token = token
        .refresh_token()
        .map(|v| v.secret().to_string())
        .ok_or(OAuthFlowError::MissingRefreshToken)?;

    let expires_at = token
        .expires_in()
        .map(|d| store::now_unix() + d.as_secs() as i64);

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
