use sqlx::PgPool;
use uuid::Uuid;
use tracing::{error, info, debug};

use crate::models::analysis::{
    AnalysisSession, CreateAnalysisSessionRequest, UpdateAnalysisSessionRequest, 
    AnalysisSessionResponse, AnalysisTemplate, CreateTemplateRequest, TemplateResponse
};

/// Analysis service for managing analysis sessions and templates
pub struct AnalysisService;

impl AnalysisService {
    pub fn new() -> Self {
        Self
    }

    /// Create a new analysis session
    pub async fn create_session(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        request: CreateAnalysisSessionRequest,
    ) -> Result<AnalysisSessionResponse, AnalysisError> {
        debug!("Creating analysis session for user: {}", user_id);

        let session = sqlx::query_as!(
            AnalysisSession,
            r#"
            INSERT INTO analysis_sessions (user_id, file_id, template_id, session_name, session_config)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, file_id, template_id, session_name, session_config, created_at, updated_at, last_accessed
            "#,
            user_id,
            request.file_id,
            request.template_id,
            request.session_name,
            request.session_config
        )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("Failed to create analysis session: {}", e);
            AnalysisError::DatabaseError(e)
        })?;

        info!("Created analysis session: {} for user: {}", session.id, user_id);
        Ok(session.into())
    }

    /// Get an analysis session by ID
    pub async fn get_session(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        session_id: Uuid,
    ) -> Result<AnalysisSessionResponse, AnalysisError> {
        debug!("Getting analysis session: {} for user: {}", session_id, user_id);

        let session = sqlx::query_as!(
            AnalysisSession,
            r#"
            SELECT id, user_id, file_id, template_id, session_name, session_config, created_at, updated_at, last_accessed
            FROM analysis_sessions
            WHERE id = $1 AND user_id = $2
            "#,
            session_id,
            user_id
        )
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            error!("Failed to get analysis session: {}", e);
            AnalysisError::DatabaseError(e)
        })?
        .ok_or(AnalysisError::SessionNotFound)?;

        // Update last_accessed timestamp
        let _ = sqlx::query!(
            "UPDATE analysis_sessions SET last_accessed = NOW() WHERE id = $1",
            session_id
        )
        .execute(pool)
        .await;

        Ok(session.into())
    }

    /// List all analysis sessions for a user
    pub async fn list_sessions(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Result<Vec<AnalysisSessionResponse>, AnalysisError> {
        debug!("Listing analysis sessions for user: {}", user_id);

        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);

        let sessions = sqlx::query_as!(
            AnalysisSession,
            r#"
            SELECT id, user_id, file_id, template_id, session_name, session_config, created_at, updated_at, last_accessed
            FROM analysis_sessions
            WHERE user_id = $1
            ORDER BY updated_at DESC
            LIMIT $2 OFFSET $3
            "#,
            user_id,
            limit as i64,
            offset as i64
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            error!("Failed to list analysis sessions: {}", e);
            AnalysisError::DatabaseError(e)
        })?;

        Ok(sessions.into_iter().map(|session| session.into()).collect())
    }

    /// Update an analysis session
    pub async fn update_session(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        session_id: Uuid,
        request: UpdateAnalysisSessionRequest,
    ) -> Result<AnalysisSessionResponse, AnalysisError> {
        debug!("Updating analysis session: {} for user: {}", session_id, user_id);

        // Build dynamic update query based on provided fields
        let mut query = String::from("UPDATE analysis_sessions SET updated_at = NOW()");
        let mut params = Vec::new();
        let mut param_count = 0;

        if let Some(session_name) = &request.session_name {
            param_count += 1;
            query.push_str(&format!(", session_name = ${}", param_count));
            params.push(session_name.clone());
        }

        if let Some(session_config) = &request.session_config {
            param_count += 1;
            query.push_str(&format!(", session_config = ${}", param_count));
            params.push(session_config.to_string());
        }

        param_count += 1;
        query.push_str(&format!(" WHERE id = ${}", param_count));
        param_count += 1;
        query.push_str(&format!(" AND user_id = ${}", param_count));
        query.push_str(" RETURNING id, user_id, file_id, template_id, session_name, session_config, created_at, updated_at, last_accessed");

        // Execute the update
        let mut query_builder = sqlx::query_as::<_, AnalysisSession>(&query);
        
        for param in &params {
            query_builder = query_builder.bind(param);
        }
        
        let session = query_builder
            .bind(session_id)
            .bind(user_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| {
                error!("Failed to update analysis session: {}", e);
                AnalysisError::DatabaseError(e)
            })?
            .ok_or(AnalysisError::SessionNotFound)?;

        info!("Updated analysis session: {} for user: {}", session_id, user_id);
        Ok(session.into())
    }

    /// Delete an analysis session
    pub async fn delete_session(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        session_id: Uuid,
    ) -> Result<(), AnalysisError> {
        debug!("Deleting analysis session: {} for user: {}", session_id, user_id);

        let result = sqlx::query!(
            "DELETE FROM analysis_sessions WHERE id = $1 AND user_id = $2",
            session_id,
            user_id
        )
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete analysis session: {}", e);
            AnalysisError::DatabaseError(e)
        })?;

        if result.rows_affected() == 0 {
            return Err(AnalysisError::SessionNotFound);
        }

        info!("Deleted analysis session: {} for user: {}", session_id, user_id);
        Ok(())
    }

    /// Create a new analysis template
    pub async fn create_template(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        request: CreateTemplateRequest,
    ) -> Result<TemplateResponse, AnalysisError> {
        debug!("Creating analysis template for user: {}", user_id);

        let template = sqlx::query_as!(
            AnalysisTemplate,
            r#"
            INSERT INTO analysis_templates (user_id, name, description, template_config, is_public)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, name, description, template_config, is_public, is_system, created_at, updated_at, usage_count
            "#,
            user_id,
            request.name,
            request.description,
            request.template_config,
            request.is_public.unwrap_or(false)
        )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("Failed to create analysis template: {}", e);
            AnalysisError::DatabaseError(e)
        })?;

        info!("Created analysis template: {} for user: {}", template.id, user_id);
        Ok(template.into())
    }

    /// List analysis templates for a user (including public ones)
    pub async fn list_templates(
        &self,
        pool: &PgPool,
        user_id: Uuid,
    ) -> Result<Vec<TemplateResponse>, AnalysisError> {
        debug!("Listing analysis templates for user: {}", user_id);

        let templates = sqlx::query_as!(
            AnalysisTemplate,
            r#"
            SELECT id, user_id, name, description, template_config, is_public, is_system, created_at, updated_at, usage_count
            FROM analysis_templates
            WHERE user_id = $1 OR is_public = true OR is_system = true
            ORDER BY is_system DESC, usage_count DESC, created_at DESC
            "#,
            user_id
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            error!("Failed to list analysis templates: {}", e);
            AnalysisError::DatabaseError(e)
        })?;

        Ok(templates.into_iter().map(|template| template.into()).collect())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AnalysisError {
    #[error("Session not found")]
    SessionNotFound,
    #[error("Template not found")]
    TemplateNotFound,
    #[error("Access denied")]
    AccessDenied,
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Invalid configuration: {0}")]
    InvalidConfiguration(String),
}
