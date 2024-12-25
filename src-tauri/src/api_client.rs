use crate::models::ApiConfig;
use reqwest::{self, Method};
use serde_json::Value;
use std::collections::HashMap;

pub struct ApiClient {
    client: reqwest::Client,
}

impl ApiClient {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    pub async fn execute_request(
        &self,
        api: ApiConfig,
        access_key: Option<String>,
        base_url: &str,
    ) -> Result<String, String> {
        let request = self.prepare_request(&api, access_key, base_url)?;
        self.send_request(request).await
    }

    fn prepare_request(
        &self,
        api: &ApiConfig,
        access_key: Option<String>,
        base_url: &str,
    ) -> Result<reqwest::RequestBuilder, String> {
        let url = format!("{}{}", base_url, api.url);
        let mut headers = api.headers.clone();

        if let Some(key) = access_key {
            headers.insert("accessKey".to_string(), key);
        }

        let mut request = self.client.request(Method::POST, &url);

        // Add headers
        for (key, value) in headers {
            request = request.header(key, value);
        }

        // Add query parameters
        for (key, value) in &api.params {
            request = request.query(&[(key, value)]);
        }

        // Add body if present
        if (!api.body.is_null()) {
            request = request.json(&api.body);
        }

        Ok(request)
    }

    async fn send_request(&self, request: reqwest::RequestBuilder) -> Result<String, String> {
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
