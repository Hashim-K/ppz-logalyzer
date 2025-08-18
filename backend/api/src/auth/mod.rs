use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

pub mod middleware;
pub mod service;

pub use middleware::*;
pub use service::*;

/// JWT Claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub username: String,
    pub exp: i64, // Expiration time
    pub iat: i64, // Issued at
    pub jti: String, // JWT ID (session ID)
}

/// Authentication service for handling password hashing and JWT tokens
pub struct AuthService {
    jwt_secret: Vec<u8>,
    jwt_expiry_hours: i64,
}

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("Token expired")]
    TokenExpired,
    #[error("Invalid token")]
    InvalidToken,
    #[error("Password hashing failed: {0}")]
    PasswordHashError(String),
    #[error("JWT error: {0}")]
    JwtError(#[from] jsonwebtoken::errors::Error),
    #[error("Account locked")]
    AccountLocked,
    #[error("User not found")]
    UserNotFound,
    #[error("User not active")]
    UserNotActive,
    #[error("Username already exists")]
    UsernameExists,
    #[error("Email already exists")]
    EmailExists,
}

impl AuthService {
    pub fn new() -> Self {
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "your-256-bit-secret-key-here".to_string())
            .into_bytes();
        
        let jwt_expiry_hours = env::var("JWT_EXPIRY_HOURS")
            .unwrap_or_else(|_| "24".to_string())
            .parse()
            .unwrap_or(24);

        Self {
            jwt_secret,
            jwt_expiry_hours,
        }
    }

    /// Hash a password using Argon2
    pub fn hash_password(&self, password: &str) -> Result<String, AuthError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| AuthError::PasswordHashError(e.to_string()))?
            .to_string();
        Ok(password_hash)
    }

    /// Verify a password against its hash
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AuthError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AuthError::PasswordHashError(e.to_string()))?;
        let argon2 = Argon2::default();
        
        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(e) => Err(AuthError::PasswordHashError(e.to_string())),
        }
    }

    /// Generate a JWT token
    pub fn generate_token(&self, user_id: Uuid, username: String, session_id: Uuid) -> Result<String, AuthError> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.jwt_expiry_hours);

        let claims = Claims {
            sub: user_id.to_string(),
            username,
            exp: exp.timestamp(),
            iat: now.timestamp(),
            jti: session_id.to_string(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(&self.jwt_secret),
        )?;

        Ok(token)
    }

    /// Verify and decode a JWT token
    pub fn verify_token(&self, token: &str) -> Result<Claims, AuthError> {
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true;

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(&self.jwt_secret),
            &validation,
        )?;

        Ok(token_data.claims)
    }

    /// Generate a secure random token (for refresh tokens)
    pub fn generate_random_token(&self) -> String {
        use rand::RngCore;
        let mut rng = rand::thread_rng();
        let mut bytes = [0u8; 32];
        rng.fill_bytes(&mut bytes);
        hex::encode(bytes)
    }
}

impl Default for AuthService {
    fn default() -> Self {
        Self::new()
    }
}
