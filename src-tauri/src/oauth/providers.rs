use crate::oauth::store::OAuthSecrets;

use super::types::Provider;

pub struct ProviderConfig {
    pub auth_url: &'static str,
    pub token_url: &'static str,
    pub revoke_url: Option<&'static str>,
    pub scopes: &'static [&'static str],
    pub pkce_plain: bool,
}

#[cfg(any(target_os = "android", target_os = "ios"))]
pub struct MobileRedirectConfig {
    pub oauth_redirect_uri: String,
    pub callback_uri: String,
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
                "https://www.googleapis.com/auth/drive.appdata",
                "https://www.googleapis.com/auth/youtube",
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

pub fn client_id_for(provider: Provider, secrets: &OAuthSecrets) -> String {
    match provider {
        Provider::Google => secrets.google_client_id.clone(),
        Provider::Mal => secrets.mal_client_id.clone(),
    }
}

pub fn client_secret_for(provider: Provider, secrets: &OAuthSecrets) -> Option<String> {
    match provider {
        Provider::Google => Some(secrets.google_client_secret.clone()),
        Provider::Mal => None,
    }
}

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
pub fn desktop_redirect_uri(provider: Provider, port: u16) -> String {
    format!("http://127.0.0.1:{port}/oauth/{provider}/callback")
}

#[cfg(any(target_os = "android", target_os = "ios"))]
pub fn mobile_redirect_config(provider: Provider) -> MobileRedirectConfig {
    match provider {
        Provider::Google => MobileRedirectConfig {
            oauth_redirect_uri: "https://ys-raptor.github.io/AniLog/oauth/google/callback"
                .to_string(),
            callback_uri: "anilog://oauth/google/callback".to_string(),
        },
        Provider::Mal => MobileRedirectConfig {
            oauth_redirect_uri: "anilog://oauth/mal/callback".to_string(),
            callback_uri: "anilog://oauth/mal/callback".to_string(),
        },
    }
}
