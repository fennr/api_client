use serde::{Deserialize, Serialize};
use std::fs;
use reqwest;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    api: Vec<ApiConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiConfig {
    name: String,
    url: String,
    headers: std::collections::HashMap<String, String>,
    params: std::collections::HashMap<String, String>,
    body: serde_json::Value,
}

#[tauri::command]
async fn read_config() -> Result<Config, String> {
    let current_dir = std::env::current_dir()
        .map_err(|e| e.to_string())?;
    let config_path = current_dir.join("config.toml");

    let config_content = fs::read_to_string(config_path)
        .map_err(|e| e.to_string())?;
    let config: Config = toml::from_str(&config_content)
        .map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
async fn make_request(api: ApiConfig) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut request = client.request(reqwest::Method::POST, &api.url);

    // Add headers
    for (key, value) in api.headers {
        request = request.header(key, value);
    }

    // Add query parameters
    for (key, value) in api.params {
        request = request.query(&[(key, value)]);
    }

    // Add body if present
    if !api.body.is_null() {
        request = request.json(&api.body);
    }

    println!("{:?}", request);

    let response = request
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let response_text = response
        .text()
        .await
        .map_err(|e| e.to_string())?;

    println!("{}", response_text);

    Ok(response_text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_config, make_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
