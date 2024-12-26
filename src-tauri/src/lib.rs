use reqwest;
use serde::{Deserialize, Serialize};
use std::fs;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    sources: Vec<Source>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Source {
    name: String,
    base_url: String,
    username: String,
    password: String,
    endpoints: Vec<ApiConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ApiConfig {
    name: String,
    url: String,
    headers: std::collections::HashMap<String, String>,
    params: std::collections::HashMap<String, String>,
    body: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthRequest {
    username: String,
    password: String,
}

#[derive(Debug, Deserialize)]
struct AuthResponse {
    accessKey: String,
    endDateSubscription: String,
    commentRu: String,
    commentEn: String,
}

#[derive(Debug, Clone)]
struct Client {
    http_client: reqwest::Client,
}

impl Client {
    fn new() -> Self {
        Self {
            http_client: reqwest::Client::new(),
        }
    }

    async fn authenticate(&self, username: &str, password: &str) -> Result<String, String> {
        let auth_request = AuthRequest {
            username: username.to_string(),
            password: password.to_string(),
        };

        let auth_response = self
            .http_client
            .post("https://restapi.credinform.ru/api/Authorization/GetAccessKey")
            .json(&auth_request)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !auth_response.status().is_success() {
            return Err(format!(
                "Auth failed with status: {}",
                auth_response.status()
            ));
        }

        let auth_data: AuthResponse = auth_response.json().await.map_err(|e| e.to_string())?;

        println!(
            "Authorized successfully, access key: {}",
            auth_data.accessKey
        );
        Ok(auth_data.accessKey)
    }

    async fn execute_request(
        &self,
        mut api: ApiConfig,
        access_key: Option<String>,
    ) -> Result<String, String> {
        if let Some(ref key) = access_key {
            api.headers.insert("accessKey".to_string(), key.to_string());
        }

        let mut request = self.http_client.request(reqwest::Method::POST, &api.url);

        // Add headers
        for (key, value) in &api.headers {
            request = request.header(key, value);
        }

        // Add query parameters
        for (key, value) in &api.params {
            request = request.query(&[(key, value)]);
        }

        // Add body if present
        if !api.body.is_null() {
            request = request.json(&api.body);
        }

        println!("Making request: {:?}", request);

        let response = request.send().await.map_err(|e| e.to_string())?;

        let response_text = response.text().await.map_err(|e| e.to_string())?;

        println!("Response received: {}", response_text);
        Ok(response_text)
    }
}

#[tauri::command]
async fn read_config() -> Result<Config, String> {
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let config_path = current_dir.join("config.yaml"); // Изменено с config.toml

    let config_content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: Config = serde_yaml::from_str(&config_content) // Изменено с toml::from_str
        .map_err(|e| e.to_string())?;

    Ok(config)
}

#[derive(Debug, Serialize, Deserialize)]
struct RequestConfig {
    source: String,
    api: ApiConfig,
    use_auth: bool,
}

#[tauri::command]
async fn make_credinform_request(
    source: String,
    api: ApiConfig,
) -> Result<String, String> {
    let config = read_config().await?;
    let source_config = config
        .sources
        .iter()
        .find(|s| s.name == source)
        .ok_or_else(|| "Source not found".to_string())?;

    let client = Client::new();
    let access_key = client
        .authenticate(&source_config.username, &source_config.password)
        .await?;
    let mut full_api = api.clone();
    full_api.url = format!("{}{}", source_config.base_url, api.url);
    client.execute_request(full_api, Some(access_key)).await
}

#[tauri::command]
async fn make_request(source_name: String, api: ApiConfig) -> Result<String, String> {
    let config = read_config().await?;
    let source_config = config
        .sources
        .iter()
        .find(|s| s.name == source_name)
        .ok_or_else(|| "Source not found".to_string())?;

    let client = Client::new();

    let mut full_api = api.clone();
    full_api.url = format!("{}{}", source_config.base_url, api.url);
    client.execute_request(full_api, None).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
