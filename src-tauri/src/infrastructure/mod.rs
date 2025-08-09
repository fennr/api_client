use reqwest::Client as HttpClient;
use serde::de::DeserializeOwned;
use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct HttpTransport {
    pub client: HttpClient,
}

impl Default for HttpTransport {
    fn default() -> Self {
        Self {
            client: HttpClient::new(),
        }
    }
}

impl HttpTransport {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn post_json_value(
        &self,
        url: &str,
        headers: &HashMap<String, String>,
        params: &HashMap<String, String>,
        body: &Value,
    ) -> Result<String, String> {
        let mut request = self.client.request(reqwest::Method::POST, url);

        for (k, v) in headers {
            request = request.header(k, v);
        }
        for (k, v) in params {
            request = request.query(&[(k, v)]);
        }
        if !body.is_null() {
            request = request.json(body);
        }
        let response = request.send().await.map_err(|e| e.to_string())?;
        let response_text = response.text().await.map_err(|e| e.to_string())?;
        Ok(response_text)
    }

    pub async fn post_json<TReq, TRes>(
        &self,
        url: &str,
        headers: &HashMap<String, String>,
        params: &HashMap<String, String>,
        body: &TReq,
    ) -> Result<TRes, String>
    where
        TReq: Serialize + ?Sized,
        TRes: DeserializeOwned,
    {
        let mut request = self.client.request(reqwest::Method::POST, url);
        for (k, v) in headers {
            request = request.header(k, v);
        }
        for (k, v) in params {
            request = request.query(&[(k, v)]);
        }
        let response = request.json(body).send().await.map_err(|e| e.to_string())?;
        if !response.status().is_success() {
            return Err(format!("HTTP failed with status: {}", response.status()));
        }
        let data = response.json::<TRes>().await.map_err(|e| e.to_string())?;
        Ok(data)
    }
}
