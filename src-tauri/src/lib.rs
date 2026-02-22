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
