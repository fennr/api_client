use crate::domain::{ApiConfig, AuthRequest, AuthResponse};
use crate::infrastructure::HttpTransport;
use async_trait::async_trait;

#[async_trait]
pub trait Authorizer: Send + Sync {
    async fn get_access_key(&self) -> Result<Option<String>, String>;
}

pub struct NoAuth;

#[async_trait]
impl Authorizer for NoAuth {
    async fn get_access_key(&self) -> Result<Option<String>, String> {
        Ok(None)
    }
}

pub struct CredinformAuth {
    http: HttpTransport,
    base_url: String,
    username: String,
    password: String,
}

impl CredinformAuth {
    pub fn new(http: HttpTransport, base_url: String, username: String, password: String) -> Self {
        Self {
            http,
            base_url,
            username,
            password,
        }
    }
}

#[async_trait]
impl Authorizer for CredinformAuth {
    async fn get_access_key(&self) -> Result<Option<String>, String> {
        let auth_url = format!(
            "{}/Authorization/GetAccessKey",
            self.base_url.trim_end_matches('/')
        );
        let auth_request = AuthRequest {
            username: self.username.clone(),
            password: self.password.clone(),
        };
        let data: AuthResponse = self
            .http
            .post_json::<_, AuthResponse>(
                &auth_url,
                &Default::default(),
                &Default::default(),
                &auth_request,
            )
            .await?;
        Ok(Some(data.access_key))
    }
}

pub struct ApiService<A: Authorizer> {
    http: HttpTransport,
    authorizer: A,
}

impl<A: Authorizer> ApiService<A> {
    pub fn new(http: HttpTransport, authorizer: A) -> Self {
        Self { http, authorizer }
    }

    pub async fn execute(&self, mut api: ApiConfig) -> Result<String, String> {
        if let Some(key) = self.authorizer.get_access_key().await? {
            api.headers.insert("accessKey".to_string(), key);
        }
        self.http
            .post_json_value(&api.url, &api.headers, &api.params, &api.body)
            .await
    }
}
