mod flow;
mod providers;
#[cfg(any(target_os = "android", target_os = "ios"))]
mod state;
pub mod store;
mod tokens;
pub mod types;

use tauri::{App, Runtime};

use self::{store::OAuthSecrets, types::Provider};

pub fn init_deeplink_listener<R: Runtime>(_app: &mut App<R>) -> tauri::Result<()> {
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        use tauri_plugin_deep_link::DeepLinkExt;

        if let Some(urls) = _app
            .deep_link()
            .get_current()
            .map_err(|error| std::io::Error::other(error.to_string()))?
        {
            for url in urls {
                state::dispatch_mobile_callback(url.to_string());
            }
        }

        _app.deep_link().on_open_url(|event| {
            for url in event.urls() {
                state::dispatch_mobile_callback(url.to_string());
            }
        });
    }

    Ok(())
}

#[tauri::command]
pub fn set_secrets(secrets: OAuthSecrets) -> Result<(), String> {
    validate_secrets(&secrets)?;
    store::save_oauth_secrets(&secrets)?;
    Ok(())
}

#[tauri::command]
pub fn remove_secrets() -> Result<(), String> {
    store::remove_oauth_secrets()?;
    tokens::clear_all_tokens()?;
    Ok(())
}

#[tauri::command]
pub fn get_secrets() -> Result<OAuthSecrets, String> {
    let secrets = store::load_oauth_secrets()?;
    Ok(secrets)
}

#[tauri::command]
pub fn secrets_exist() -> Result<bool, String> {
    let exists = store::oauth_secrets_exist()?;
    Ok(exists)
}

#[tauri::command]
pub async fn login<R: Runtime>(provider: Provider, app: tauri::AppHandle<R>) -> Result<(), String> {
    flow::login(provider, app).await?;
    Ok(())
}

#[tauri::command]
pub async fn logout(provider: Provider) -> Result<(), String> {
    tokens::logout(provider).await?;
    Ok(())
}

#[tauri::command]
pub async fn get_access_token(provider: Provider) -> Result<String, String> {
    let access_token = tokens::get_valid_access_token(provider).await?;
    Ok(access_token)
}

fn validate_secrets(secrets: &OAuthSecrets) -> Result<(), String> {
    if secrets.google_client_id.trim().is_empty()
        || secrets.google_client_secret.trim().is_empty()
        || secrets.mal_client_id.trim().is_empty()
    {
        return Err("INVALID_INPUT".to_string());
    }

    Ok(())
}
