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

        let auth_response = self.http_client
            .post("https://restapi.credinform.ru/api/Authorization/GetAccessKey")
            .json(&auth_request)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !auth_response.status().is_success() {
            return Err(format!("Auth failed with status: {}", auth_response.status()));
        }

        let auth_data: AuthResponse = auth_response
            .json()
            .await
            .map_err(|e| e.to_string())?;

        println!("Authorized successfully, access key: {}", auth_data.accessKey);
        Ok(auth_data.accessKey)
    }

    async fn execute_request(&self, mut api: ApiConfig, access_key: String) -> Result<String, String> {
        api.headers.insert("accessKey".to_string(), access_key);

        let url = format!("https://restapi.credinform.ru/api{}", api.url);
        let mut request = self.http_client.request(reqwest::Method::POST, &url);

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

        let response = request
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let response_text = response
            .text()
            .await
            .map_err(|e| e.to_string())?;

        println!("Response received: {}", response_text);
        Ok(response_text)
    }
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
    let client = Client::new();
    
    // Получаем токен доступа
    let access_key = client.authenticate("Dmitry.Khokhlovkin@uralchem.com", "123456").await?;
    println!("{}", access_key);
    
    // Выполняем запрос с полученным токеном
    client.execute_request(api, access_key).await
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
