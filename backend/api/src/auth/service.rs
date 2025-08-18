use chrono::{DateTime, Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;
use ipnetwork::IpNetwork;
use tracing;

use crate::auth::{AuthError, AuthService};
use crate::models::{
    User, CreateUserRequest, LoginRequest, UserResponse,
    UserSession, SessionResponse,
};

pub struct UserService {
    auth_service: AuthService,
}

impl UserService {
    pub fn new() -> Self {
        Self {
            auth_service: AuthService::new(),
        }
    }

    /// Create a new user
    pub async fn create_user(&self, db: &PgPool, request: CreateUserRequest) -> Result<UserResponse, AuthError> {
        // Hash the password
        let password_hash = self.auth_service.hash_password(&request.password)?;
        
        // Create user in database
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, username, email, password_hash, is_active, is_admin, created_at, updated_at, last_login_at, login_attempts, locked_until)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            "#,
            Uuid::new_v4(),
            request.username,
            request.email,
            password_hash,
            true, // is_active
            false, // is_admin
            Utc::now(),
            Utc::now(),
            None as Option<DateTime<Utc>>, // last_login_at
            0, // login_attempts
            None as Option<DateTime<Utc>>, // locked_until
        )
        .fetch_one(db)
        .await
        .map_err(|e| {
            tracing::error!("Database error during user creation: {}", e);
            if e.to_string().contains("unique constraint") {
                // Check which constraint was violated
                let error_message = e.to_string();
                if error_message.contains("username") || error_message.contains("users_username_key") {
                    AuthError::UsernameExists
                } else if error_message.contains("email") || error_message.contains("users_email_key") {
                    AuthError::EmailExists
                } else {
                    AuthError::InvalidCredentials // Generic for unknown unique constraint
                }
            } else {
                AuthError::UserNotFound // Generic error for other DB issues
            }
        })?;

        Ok(user.into())
    }

    /// Authenticate user and create session
    pub async fn login(&self, db: &PgPool, request: LoginRequest, ip_address: Option<IpNetwork>, user_agent: Option<String>) -> Result<(UserResponse, SessionResponse), AuthError> {
        tracing::info!("Login attempt for user: {}", request.username);
        
        // Get user from database
        let user = sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE username = $1 OR email = $1",
            request.username
        )
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!("Database error during login: {}", e);
            AuthError::InvalidCredentials
        })?
        .ok_or_else(|| {
            tracing::warn!("User not found: {}", request.username);
            AuthError::UserNotFound
        })?;

        tracing::info!("User found: {}, active: {}", user.username, user.is_active);

        // Check if user is active
        if !user.is_active {
            tracing::warn!("User {} is not active", user.username);
            return Err(AuthError::UserNotActive);
        }

        // Check if account is locked
        if let Some(locked_until) = user.locked_until {
            if locked_until > Utc::now() {
                tracing::warn!("User {} is locked until {}", user.username, locked_until);
                return Err(AuthError::AccountLocked);
            }
        }

        // Verify password
        tracing::debug!("Verifying password for user: {}", user.username);
        match self.auth_service.verify_password(&request.password, &user.password_hash) {
            Ok(true) => {
                tracing::info!("Password verification successful for user: {}", user.username);
            }
            Ok(false) => {
                tracing::warn!("Invalid password for user: {}", user.username);
                // Increment login attempts
                self.increment_login_attempts(db, user.id).await?;
                return Err(AuthError::InvalidCredentials);
            }
            Err(e) => {
                tracing::error!("Password verification error for user {}: {}", user.username, e);
                return Err(e);
            }
        }

        // Reset login attempts and update last login
        self.reset_login_attempts(db, user.id).await?;

        // Create session
        let session = self.create_session(db, user.id, ip_address, user_agent).await?;

        Ok((user.into(), session))
    }

    /// Create a new session
    pub async fn create_session(&self, db: &PgPool, user_id: Uuid, ip_address: Option<IpNetwork>, user_agent: Option<String>) -> Result<SessionResponse, AuthError> {
        let session_id = Uuid::new_v4();
        let expires_at = Utc::now() + Duration::hours(24);
        
        // Generate JWT token
        let user = sqlx::query!("SELECT username FROM users WHERE id = $1", user_id)
            .fetch_one(db)
            .await
            .map_err(|_| AuthError::UserNotFound)?;
            
        let session_token = self.auth_service.generate_token(user_id, user.username, session_id)?;
        let refresh_token = Some(self.auth_service.generate_random_token());

        tracing::debug!("Creating session with ip_address: {:?}", ip_address);

        // Insert session into database
        let session = sqlx::query_as!(
            UserSession,
            r#"
            INSERT INTO user_sessions (id, user_id, session_token, refresh_token, expires_at, created_at, updated_at, ip_address, user_agent, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            "#,
            session_id,
            user_id,
            session_token,
            refresh_token,
            expires_at,
            Utc::now(),
            Utc::now(),
            ip_address,
            user_agent,
            true
        )
        .fetch_one(db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create session: {:?}", e);
            AuthError::InvalidCredentials
        })?;

        Ok(session.into())
    }

    /// Logout (invalidate session)
    pub async fn logout(&self, db: &PgPool, session_id: Uuid) -> Result<(), AuthError> {
        sqlx::query!(
            "UPDATE user_sessions SET is_active = false, updated_at = $1 WHERE id = $2",
            Utc::now(),
            session_id
        )
        .execute(db)
        .await
        .map_err(|_| AuthError::InvalidCredentials)?;

        Ok(())
    }

    /// Get user by ID
    pub async fn get_user(&self, db: &PgPool, user_id: Uuid) -> Result<UserResponse, AuthError> {
        let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", user_id)
            .fetch_optional(db)
            .await
            .map_err(|_| AuthError::UserNotFound)?
            .ok_or(AuthError::UserNotFound)?;

        Ok(user.into())
    }

    /// Increment login attempts and potentially lock account
    async fn increment_login_attempts(&self, db: &PgPool, user_id: Uuid) -> Result<(), AuthError> {
        const MAX_LOGIN_ATTEMPTS: i32 = 5;
        const LOCKOUT_DURATION_MINUTES: i64 = 15;

        let user = sqlx::query!(
            "UPDATE users SET login_attempts = login_attempts + 1, updated_at = $1 WHERE id = $2 RETURNING login_attempts",
            Utc::now(),
            user_id
        )
        .fetch_one(db)
        .await
        .map_err(|_| AuthError::UserNotFound)?;

        if user.login_attempts >= MAX_LOGIN_ATTEMPTS {
            let locked_until = Utc::now() + Duration::minutes(LOCKOUT_DURATION_MINUTES);
            sqlx::query!(
                "UPDATE users SET locked_until = $1, updated_at = $2 WHERE id = $3",
                locked_until,
                Utc::now(),
                user_id
            )
            .execute(db)
            .await
            .map_err(|_| AuthError::UserNotFound)?;
        }

        Ok(())
    }

    /// Reset login attempts
    async fn reset_login_attempts(&self, db: &PgPool, user_id: Uuid) -> Result<(), AuthError> {
        sqlx::query!(
            "UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = $1, updated_at = $1 WHERE id = $2",
            Utc::now(),
            user_id
        )
        .execute(db)
        .await
        .map_err(|_| AuthError::UserNotFound)?;

        Ok(())
    }

    /// Refresh session token
    pub async fn refresh_session(&self, db: &PgPool, refresh_token: String) -> Result<SessionResponse, AuthError> {
        // Find session with refresh token
        let session = sqlx::query_as!(
            UserSession,
            "SELECT * FROM user_sessions WHERE refresh_token = $1 AND is_active = true AND expires_at > NOW()",
            refresh_token
        )
        .fetch_optional(db)
        .await
        .map_err(|_| AuthError::InvalidToken)?
        .ok_or(AuthError::InvalidToken)?;

        // Get user
        let user = sqlx::query!("SELECT username FROM users WHERE id = $1", session.user_id)
            .fetch_one(db)
            .await
            .map_err(|_| AuthError::UserNotFound)?;

        // Generate new tokens
        let new_expires_at = Utc::now() + Duration::hours(24);
        let new_session_token = self.auth_service.generate_token(session.user_id, user.username, session.id)?;
        let new_refresh_token = Some(self.auth_service.generate_random_token());

        // Update session
        let updated_session = sqlx::query_as!(
            UserSession,
            r#"
            UPDATE user_sessions 
            SET session_token = $1, refresh_token = $2, expires_at = $3, updated_at = $4
            WHERE id = $5
            RETURNING *
            "#,
            new_session_token,
            new_refresh_token,
            new_expires_at,
            Utc::now(),
            session.id
        )
        .fetch_one(db)
        .await
        .map_err(|_| AuthError::InvalidToken)?;

        Ok(updated_session.into())
    }
}

impl Default for UserService {
    fn default() -> Self {
        Self::new()
    }
}
