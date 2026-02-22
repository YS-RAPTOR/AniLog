mod oauth;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            storage::secure_store::init_secure_store()
                .map_err(|e| -> Box<dyn std::error::Error> { e.into() })?;

            oauth::init_deeplink_listener(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            oauth::get_secrets,
            oauth::set_secrets,
            oauth::remove_secrets,
            oauth::secrets_exist,
            oauth::login,
            oauth::logout,
            oauth::get_access_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
