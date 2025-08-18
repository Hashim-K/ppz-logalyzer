use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
};
use std::sync::Arc;
use uuid::Uuid;

use super::{AuthError, AuthService, Claims};
use crate::routes::AppState;

/// Authentication middleware that validates JWT tokens
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_service = AuthService::new();
    
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| {
            if header.starts_with("Bearer ") {
                Some(&header[7..])
            } else {
                None
            }
        });

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let claims = match auth_service.verify_token(token) {
        Ok(claims) => claims,
        Err(AuthError::TokenExpired) => return Err(StatusCode::UNAUTHORIZED),
        Err(AuthError::InvalidToken) => return Err(StatusCode::UNAUTHORIZED),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Verify session is still active in database
    let session_id = match Uuid::parse_str(&claims.jti) {
        Ok(id) => id,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    let session_exists = sqlx::query!(
        "SELECT id FROM user_sessions WHERE id = $1 AND is_active = true AND expires_at > NOW()",
        session_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if session_exists.is_none() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Add user information to request extensions
    request.extensions_mut().insert(claims);
    
    Ok(next.run(request).await)
}

/// Optional authentication middleware - doesn't fail if no token provided
pub async fn optional_auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_service = AuthService::new();
    
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| {
            if header.starts_with("Bearer ") {
                Some(&header[7..])
            } else {
                None
            }
        });

    if let Some(token) = auth_header {
        if let Ok(claims) = auth_service.verify_token(token) {
            // Verify session is still active in database
            if let Ok(session_id) = Uuid::parse_str(&claims.jti) {
                let session_exists = sqlx::query!(
                    "SELECT id FROM user_sessions WHERE id = $1 AND is_active = true AND expires_at > NOW()",
                    session_id
                )
                .fetch_optional(&state.db)
                .await;

                if let Ok(Some(_)) = session_exists {
                    request.extensions_mut().insert(claims);
                }
            }
        }
    }
    
    Ok(next.run(request).await)
}

/// Extract user claims from request extensions
pub fn get_current_user(request: &Request) -> Option<&Claims> {
    request.extensions().get::<Claims>()
}
