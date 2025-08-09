use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiConfig {
    pub name: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub params: HashMap<String, String>,
    pub body: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Source {
    pub name: String,
    pub base_url: String,
    pub username: String,
    pub password: String,
    pub endpoints: Vec<ApiConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub sources: Vec<Source>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    #[serde(rename = "accessKey")]
    pub access_key: String,
    #[serde(rename = "endDateSubscription")]
    pub end_date_subscription: String,
    #[serde(rename = "commentRu")]
    pub comment_ru: String,
    #[serde(rename = "commentEn")]
    pub comment_en: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auth_response_deserializes_camel_case_fields() {
        let json = r#"{
            "accessKey": "abc123",
            "endDateSubscription": "2025-01-01",
            "commentRu": "ок",
            "commentEn": "ok"
        }"#;

        let resp: AuthResponse = serde_json::from_str(json).expect("valid json");
        assert_eq!(resp.access_key, "abc123");
        assert_eq!(resp.end_date_subscription, "2025-01-01");
        assert_eq!(resp.comment_ru, "ок");
        assert_eq!(resp.comment_en, "ok");
    }
}
