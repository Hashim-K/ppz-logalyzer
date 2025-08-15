use serde::{Deserialize, Serialize};
use sqlx::prelude::*;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::net::IpAddr;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub session_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSessionRequest {
    pub user_id: Uuid,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
    pub expires_in_seconds: Option<i64>, // Default to 24 hours if None
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionResponse {
    pub id: Uuid,
    pub session_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

impl From<UserSession> for SessionResponse {
    fn from(session: UserSession) -> Self {
        Self {
            id: session.id,
            session_token: session.session_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            created_at: session.created_at,
        }
    }
}

impl UserSession {
    pub fn is_expired(&self) -> bool {
        self.expires_at <= Utc::now()
    }

    pub fn is_valid(&self) -> bool {
        self.is_active && !self.is_expired()
    }
}
