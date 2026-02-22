use std::{
    collections::HashMap,
    sync::{mpsc::Sender, Mutex, OnceLock},
};

use thiserror::Error;
use url::Url;

use super::types::Provider;

#[derive(Debug, Error)]
pub enum OAuthStateError {
    #[error("INTERNAL")]
    Internal,
}

impl OAuthStateError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::Internal => "INTERNAL",
        }
    }
}

impl From<OAuthStateError> for String {
    fn from(value: OAuthStateError) -> Self {
        value.code().to_string()
    }
}

fn mobile_waiters() -> &'static Mutex<HashMap<Provider, Sender<String>>> {
    static WAITERS: OnceLock<Mutex<HashMap<Provider, Sender<String>>>> = OnceLock::new();
    WAITERS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn pending_mobile_urls() -> &'static Mutex<HashMap<Provider, String>> {
    static URLS: OnceLock<Mutex<HashMap<Provider, String>>> = OnceLock::new();
    URLS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn register_mobile_waiter(
    provider: Provider,
    sender: Sender<String>,
) -> Result<(), OAuthStateError> {
    let mut map = mobile_waiters()
        .lock()
        .map_err(|_| OAuthStateError::Internal)?;
    map.insert(provider, sender);
    Ok(())
}

pub fn clear_mobile_waiter(provider: Provider) -> Result<(), OAuthStateError> {
    let mut map = mobile_waiters()
        .lock()
        .map_err(|_| OAuthStateError::Internal)?;
    map.remove(&provider);
    Ok(())
}

pub fn take_pending_mobile_url(provider: Provider) -> Result<Option<String>, OAuthStateError> {
    let mut map = pending_mobile_urls()
        .lock()
        .map_err(|_| OAuthStateError::Internal)?;
    Ok(map.remove(&provider))
}

pub fn dispatch_mobile_callback(url: String) {
    let parsed = match Url::parse(&url) {
        Ok(v) => v,
        Err(_) => return,
    };

    let provider = match provider_from_mobile_callback(&parsed) {
        Some(v) => v,
        None => return,
    };

    if let Ok(mut waiters) = mobile_waiters().lock() {
        if let Some(sender) = waiters.remove(&provider) {
            let _ = sender.send(url);
            return;
        }
    }

    if let Ok(mut urls) = pending_mobile_urls().lock() {
        urls.insert(provider, url);
    }
}

pub fn provider_from_mobile_callback(url: &Url) -> Option<Provider> {
    if url.scheme() != "anilog" {
        return None;
    }

    if url.host_str() != Some("oauth") {
        return None;
    }

    let path = url.path().trim_matches('/');
    match path {
        "google/callback" => Some(Provider::Google),
        "mal/callback" => Some(Provider::Mal),
        _ => None,
    }
}
