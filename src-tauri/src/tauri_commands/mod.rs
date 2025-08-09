use crate::application::{ApiService, CredinformAuth, NoAuth};
use crate::domain::{ApiConfig, Config};
use log::info;
use std::fs;
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[tauri::command]
async fn read_config(_app: tauri::AppHandle) -> Result<Config, String> {
    let mut candidate_paths: Vec<PathBuf> = Vec::new();

    if let Ok(path_str) = std::env::var("API_CLIENT_CONFIG") {
        candidate_paths.push(PathBuf::from(path_str));
    }

    if let Ok(current_dir) = std::env::current_dir() {
        info!("Current working directory: {}", current_dir.display());
        candidate_paths.push(current_dir.join("config.yaml"));
        candidate_paths.push(current_dir.join("config.yml"));
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            info!("Executable directory: {}", exe_dir.display());
            candidate_paths.push(exe_dir.join("config.yaml"));
            candidate_paths.push(exe_dir.join("config.yml"));
            candidate_paths.push(exe_dir.join("resources").join("config.yaml"));
            candidate_paths.push(exe_dir.join("resources").join("config.yml"));
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent_dir) = exe_path.parent().and_then(|p| p.parent()) {
            candidate_paths.push(parent_dir.join("config.yaml"));
            candidate_paths.push(parent_dir.join("config.yml"));
        }
    }

    if let Some(proj_dirs) = directories::ProjectDirs::from("com", "api-client", "api_client") {
        candidate_paths.push(proj_dirs.config_dir().join("config.yaml"));
        candidate_paths.push(proj_dirs.config_dir().join("config.yml"));
        candidate_paths.push(proj_dirs.preference_dir().join("config.yaml"));
        candidate_paths.push(proj_dirs.preference_dir().join("config.yml"));
        candidate_paths.push(proj_dirs.data_dir().join("config.yaml"));
        candidate_paths.push(proj_dirs.data_dir().join("config.yml"));
    }

    let config_path = candidate_paths
        .into_iter()
        .find(|p| p.exists())
        .ok_or_else(|| "config.yaml not found in expected locations".to_string())?;

    let config_content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;

    let config: Config = serde_yaml::from_str(&config_content).map_err(|e| e.to_string())?;
    info!("Config loaded successfully");

    Ok(config)
}

#[tauri::command]
async fn make_credinform_request(
    app: tauri::AppHandle,
    source: String,
    api: ApiConfig,
) -> Result<String, String> {
    let config = read_config(app.clone()).await?;
    let source_config = config
        .sources
        .iter()
        .find(|s| s.name == source)
        .ok_or_else(|| "Source not found".to_string())?;

    let auth = CredinformAuth::new(
        crate::infrastructure::HttpTransport::new(),
        source_config.base_url.clone(),
        source_config.username.clone(),
        source_config.password.clone(),
    );
    let service = ApiService::new(crate::infrastructure::HttpTransport::new(), auth);
    let mut full_api = api.clone();
    full_api.url = format!("{}{}", source_config.base_url, api.url);
    service.execute(full_api).await
}

#[tauri::command]
async fn make_request(
    app: tauri::AppHandle,
    source_name: String,
    api: ApiConfig,
) -> Result<String, String> {
    let config = read_config(app.clone()).await?;
    let source_config = config
        .sources
        .iter()
        .find(|s| s.name == source_name)
        .ok_or_else(|| "Source not found".to_string())?;

    let service = ApiService::new(crate::infrastructure::HttpTransport::new(), NoAuth);
    let mut full_api = api.clone();
    full_api.url = format!("{}{}", source_config.base_url, api.url);
    service.execute(full_api).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_config,
            make_request,
            make_credinform_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
