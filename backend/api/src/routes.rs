use axum::{
    extract::{Multipart, State, Path, Request, ConnectInfo},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router, body::to_bytes,
};
use chrono::{DateTime, Utc, NaiveDate};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::{path::Path as StdPath, sync::Arc, net::SocketAddr};
use tokio::fs;
use tracing::{error, info, warn};
use uuid::Uuid;
use ipnetwork::IpNetwork;

use crate::auth::{AuthError, UserService, get_current_user};
use crate::analysis::{AnalysisService, AnalysisError};
use crate::models::{CreateUserRequest, LoginRequest, UserResponse, SessionResponse};
use crate::models::analysis::{CreateAnalysisSessionRequest, UpdateAnalysisSessionRequest, AnalysisSessionResponse, CreateTemplateRequest, TemplateResponse};
use crate::schema::{SchemaManager};
// use crate::processing::{FileProcessor, ProcessingResult, ProcessingStatus};

// App state
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub schema_manager: Arc<tokio::sync::Mutex<SchemaManager>>,
    // pub file_processor: Arc<tokio::sync::Mutex<FileProcessor>>,
}

// Helper functions for file pairing and timestamp extraction

/// Extract timestamp from PaparazziUAV filename format: DD_MM_YY__HH_MM_SS.ext
fn extract_timestamp_from_filename(filename: &str) -> Option<DateTime<Utc>> {
    let re = Regex::new(r"(\d{2})_(\d{2})_(\d{2})__(\d{2})_(\d{2})_(\d{2})").ok()?;
    let caps = re.captures(filename)?;
    
    let day: u32 = caps.get(1)?.as_str().parse().ok()?;
    let month: u32 = caps.get(2)?.as_str().parse().ok()?;
    let year: i32 = caps.get(3)?.as_str().parse::<u32>().ok()? as i32 + 2000; // Convert YY to 20YY
    let hour: u32 = caps.get(4)?.as_str().parse().ok()?;
    let minute: u32 = caps.get(5)?.as_str().parse().ok()?;
    let second: u32 = caps.get(6)?.as_str().parse().ok()?;
    
    NaiveDate::from_ymd_opt(year, month, day)?
        .and_hms_opt(hour, minute, second)?
        .and_utc()
        .into()
}

/// Parse filename to extract base name and extension
fn parse_filename(filename: &str) -> (String, String) {
    match StdPath::new(filename).file_stem().and_then(|s| s.to_str()) {
        Some(stem) => {
            let extension = StdPath::new(filename)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_string();
            (stem.to_string(), extension)
        }
        None => (filename.to_string(), String::new())
    }
}

/// Get or create a file pair ID for files with the same base filename
async fn get_or_create_pair_id(
    pool: &PgPool,
    base_filename: &str,
) -> Result<Uuid, sqlx::Error> {
    // First try to find existing pair
    if let Ok(record) = sqlx::query!(
        "SELECT file_pair_id FROM log_files WHERE base_filename = $1 LIMIT 1",
        base_filename
    )
    .fetch_one(pool)
    .await
    {
        return Ok(record.file_pair_id.unwrap_or_else(Uuid::new_v4));
    }
    
    // Create new pair ID
    Ok(Uuid::new_v4())
}

// Response types
#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

#[derive(Serialize)]
pub struct FileUploadResponse {
    pub file_id: Uuid,
    pub original_filename: String,
    pub file_size: u64,
    pub upload_timestamp: chrono::DateTime<chrono::Utc>,
    pub content_type: String,
}

#[derive(Serialize)]
pub struct LogFileInfo {
    pub id: Uuid,
    pub original_filename: String,
    pub file_size: i64,
    pub upload_timestamp: chrono::DateTime<chrono::Utc>,
    pub processing_status: String,
    pub content_type: String,
    pub is_processed: bool,
}

#[derive(Serialize)]
pub struct SchemaDetectionResponse {
    pub success: bool,
    pub schema_found: bool,
    pub confidence: f64,
    pub source: String,
    pub warnings: Vec<String>,
    pub schema_hash: Option<String>,
}

#[derive(Serialize)]
pub struct ProcessingStatusResponse {
    pub task_id: Uuid,
    pub status: String,
    pub progress: f64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub error_message: Option<String>,
    pub records_processed: Option<usize>,
}

#[derive(Deserialize)]
pub struct ProcessFileRequest {
    pub file_id: Uuid,
}

async fn healthz() -> &'static str {
    "ok"
}

async fn health(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Check database connection
    let db_status = match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };
    
    let overall_status = if db_status == "healthy" { "healthy" } else { "unhealthy" };
    
    let health_status = serde_json::json!({
        "status": overall_status,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        "version": "0.1.0",
        "checks": {
            "database": db_status,
            "schema_manager": "ok",
            "file_processor": "ok"
        }
    });

    if overall_status == "healthy" {
        Ok(Json(health_status))
    } else {
        Err(StatusCode::SERVICE_UNAVAILABLE)
    }
}

async fn root() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "service": "ppz-logalyzer-api",
        "version": "0.1.0", 
        "status": "running",
        "description": "PaparazziUAV Log Analyzer Backend API",
        "endpoints": {
            "health": "/health",
            "files": "/api/files",
            "upload": "/api/files/upload", 
            "schema": "/api/files/{id}/schema",
            "processing": "/api/processing"
        }
    }))
}

async fn upload_log_files(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<Vec<FileUploadResponse>>>, StatusCode> {
    // For now, we'll use a fixed user ID for testing
    // TODO: Extract from authentication token
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    
    info!("Upload request received for user: {}", user_id);
    let mut uploaded_files = Vec::new();
    let mut file_pairs: std::collections::HashMap<String, Vec<Uuid>> = std::collections::HashMap::new();
    
    // Create uploads directory if it doesn't exist
    if let Err(e) = fs::create_dir_all("uploads").await {
        error!("Failed to create uploads directory: {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        error!("Failed to get next multipart field: {}", e);
        StatusCode::BAD_REQUEST
    })? {
        let field_name = field.name().unwrap_or("unknown").to_string();
        let original_filename = field.file_name().unwrap_or("unknown").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
        
        info!("Processing field: name={}, filename={}, content_type={}", field_name, original_filename, content_type);
        
        // Read file data
        let data = field.bytes().await.map_err(|e| {
            error!("Failed to read field bytes: {}", e);
            StatusCode::BAD_REQUEST
        })?;
        let file_size = data.len() as i64;
        
        info!("File size: {} bytes", file_size);
        
        // Generate unique file ID and save path
        let file_id = Uuid::new_v4();
        let storage_path = format!("uploads/{}", file_id);
        
        // Save file to disk
        if let Err(e) = fs::write(&storage_path, &data).await {
            error!("Failed to save file {}: {}", original_filename, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }

        // Calculate file hash for deduplication
        let file_hash = blake3::hash(&data).to_hex().to_string();
        
        // Extract timestamp and parse filename for pairing
        let extracted_timestamp = extract_timestamp_from_filename(&original_filename);
        let (base_filename, file_extension) = parse_filename(&original_filename);
        
        // Get or create a file pair ID for files with the same base filename
        let file_pair_id = match get_or_create_pair_id(&state.db, &base_filename).await {
            Ok(pair_id) => Some(pair_id),
            Err(e) => {
                warn!("Failed to get/create pair ID for {}: {}", base_filename, e);
                None
            }
        };
        
        // Track files by their base filename for session creation
        file_pairs.entry(base_filename.clone()).or_insert_with(Vec::new);
        
        // Ensure test user exists (for development only)
        let _ = sqlx::query!(
            "INSERT INTO users (id, username, email, password_hash) VALUES ($1, 'test_user', 'test@example.com', 'dummy_hash') ON CONFLICT (id) DO NOTHING",
            user_id
        ).execute(&state.db).await;
        
        // Insert into database with enhanced file pairing info
        let upload_timestamp = chrono::Utc::now();
        let result = sqlx::query!(
            r#"
            INSERT INTO log_files (id, user_id, original_filename, storage_path, file_size, file_hash, content_type, upload_timestamp, file_pair_id, base_filename, extracted_timestamp, file_extension)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, original_filename, file_size, upload_timestamp, content_type
            "#,
            file_id,
            user_id,  // Use authenticated user
            original_filename,
            storage_path,
            file_size,
            file_hash,
            content_type,
            upload_timestamp,
            file_pair_id,
            base_filename,
            extracted_timestamp,
            file_extension
        ).fetch_one(&state.db).await;

        match result {
            Ok(record) => {
                info!("Successfully uploaded file: {} ({})", original_filename, file_id);
                
                // Track file for session creation
                file_pairs.entry(base_filename.clone()).or_insert_with(Vec::new).push(record.id);
                
                uploaded_files.push(FileUploadResponse {
                    file_id: record.id,
                    original_filename: record.original_filename,
                    file_size: record.file_size as u64,
                    upload_timestamp: record.upload_timestamp,
                    content_type: record.content_type.unwrap_or_default(),
                });
            }
            Err(e) => {
                error!("Database error for file {}: {}", original_filename, e);
                // Clean up file on database error
                let _ = fs::remove_file(&storage_path).await;
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    }

    if uploaded_files.is_empty() {
        return Ok(Json(ApiResponse {
            success: false,
            data: None,
            message: "No files were uploaded".to_string(),
        }));
    }

    // Automatically create analysis sessions for file pairs
    let analysis_service = AnalysisService::new();
    let mut created_sessions = Vec::new();

    for (base_filename, file_ids) in file_pairs {
        if file_ids.len() >= 2 {
            // Create session for pairs (2 or more files with same base name)
            let session_name = format!("Analysis: {}", base_filename);
            let session_description = format!("Auto-created session for {} files uploaded on {}", 
                file_ids.len(), chrono::Utc::now().format("%Y-%m-%d %H:%M"));
            
            let session_config = serde_json::json!({
                "file_ids": file_ids,
                "base_filename": base_filename,
                "auto_created": true,
                "created_at": chrono::Utc::now().to_rfc3339()
            });
            
            let config_typed = match serde_json::from_value(session_config) {
                Ok(config) => config,
                Err(e) => {
                    warn!("Failed to serialize session config: {}", e);
                    continue;
                }
            };

            let create_session_request = CreateAnalysisSessionRequest {
                file_id: file_ids.first().cloned(), // Use first file as reference
                template_id: None,
                session_name: Some(session_name.clone()),
                session_config: config_typed,
            };

            match analysis_service.create_session(&state.db, user_id, create_session_request).await {
                Ok(session) => {
                    info!("Auto-created analysis session: {} for files: {:?}", session_name, file_ids);
                    created_sessions.push(session);
                }
                Err(e) => {
                    warn!("Failed to create analysis session for {}: {:?}", base_filename, e);
                }
            }
        }
    }

    let message = if created_sessions.is_empty() {
        "Files uploaded successfully".to_string()
    } else {
        format!("Files uploaded successfully. Created {} analysis session(s)", created_sessions.len())
    };

    Ok(Json(ApiResponse {
        success: true,
        data: Some(uploaded_files),
        message,
    }))
}

async fn list_log_files(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<Vec<LogFileInfo>>>, StatusCode> {
    let result = sqlx::query_as!(
        LogFileInfo,
        r#"
        SELECT 
            id,
            original_filename,
            file_size,
            upload_timestamp,
            COALESCE(processing_status, 'pending') as "processing_status!",
            COALESCE(content_type, 'application/octet-stream') as "content_type!",
            is_processed
        FROM log_files
        ORDER BY upload_timestamp DESC
        "#
    ).fetch_all(&state.db).await;

    match result {
        Ok(files) => {
            Ok(Json(ApiResponse {
                success: true,
                data: Some(files),
                message: "Files retrieved successfully".to_string(),
            }))
        }
        Err(e) => {
            error!("Database error retrieving files: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_log_file(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(file_id): axum::extract::Path<Uuid>,
) -> Result<Json<ApiResponse<LogFileInfo>>, StatusCode> {
    let result = sqlx::query_as!(
        LogFileInfo,
        r#"
        SELECT 
            id,
            original_filename,
            file_size,
            upload_timestamp,
            COALESCE(processing_status, 'pending') as "processing_status!",
            COALESCE(content_type, 'application/octet-stream') as "content_type!",
            is_processed
        FROM log_files
        WHERE id = $1
        "#,
        file_id
    ).fetch_optional(&state.db).await;

    match result {
        Ok(Some(file)) => {
            Ok(Json(ApiResponse {
                success: true,
                data: Some(file),
                message: "File retrieved successfully".to_string(),
            }))
        }
        Ok(None) => {
            Ok(Json(ApiResponse {
                success: false,
                data: None,
                message: "File not found".to_string(),
            }))
        }
        Err(e) => {
            error!("Database error retrieving file {}: {}", file_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn delete_log_file(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(file_id): axum::extract::Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    // Get file info first to delete from disk
    let file_info = sqlx::query!(
        "SELECT storage_path FROM log_files WHERE id = $1",
        file_id
    ).fetch_optional(&state.db).await
     .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let storage_path = match file_info {
        Some(info) => info.storage_path,
        None => {
            return Ok(Json(ApiResponse {
                success: false,
                data: None,
                message: "File not found".to_string(),
            }));
        }
    };

    // Delete from database
    let result = sqlx::query!(
        "DELETE FROM log_files WHERE id = $1",
        file_id
    ).execute(&state.db).await;

    match result {
        Ok(rows) if rows.rows_affected() > 0 => {
            // Delete file from disk
            if let Err(e) = fs::remove_file(&storage_path).await {
                error!("Failed to delete file from disk: {}", e);
            }
            
            info!("Successfully deleted file: {}", file_id);
            Ok(Json(ApiResponse {
                success: true,
                data: Some(()),
                message: "File deleted successfully".to_string(),
            }))
        }
        Ok(_) => {
            Ok(Json(ApiResponse {
                success: false,
                data: None,
                message: "File not found".to_string(),
            }))
        }
        Err(e) => {
            error!("Database error deleting file {}: {}", file_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Parse and analyze a specific log file
async fn detect_schema(
    State(state): State<Arc<AppState>>,
    Path(file_id): Path<Uuid>,
) -> Result<Json<ApiResponse<SchemaDetectionResponse>>, StatusCode> {
    // Get file path and pairing info from database
    let file_info = sqlx::query!(
        "SELECT storage_path, original_filename, file_pair_id, base_filename, file_extension FROM log_files WHERE id = $1",
        file_id
    ).fetch_optional(&state.db).await
     .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (storage_path, original_filename, file_pair_id, base_filename, file_extension) = match file_info {
        Some(info) => (
            info.storage_path, 
            info.original_filename,
            info.file_pair_id,
            info.base_filename,
            info.file_extension
        ),
        None => {
            return Ok(Json(ApiResponse {
                success: false,
                data: None,
                message: "File not found".to_string(),
            }));
        }
    };

    // Find the matching file with the same file_pair_id but different extension
    let target_extension = if file_extension == Some("log".to_string()) { "data" } else { "log" };
    let paired_file_info = sqlx::query!(
        "SELECT storage_path FROM log_files WHERE file_pair_id = $1 AND file_extension = $2 AND id != $3",
        file_pair_id,
        target_extension,
        file_id
    ).fetch_optional(&state.db).await
     .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let paired_storage_path = match paired_file_info {
        Some(info) => info.storage_path,
        None => {
            return Ok(Json(ApiResponse {
                success: false,
                data: None,
                message: format!("Matching .{} file not found for pair", target_extension),
            }));
        }
    };

    // Parse the log file using our schema manager with explicit log/data paths
    let mut schema_manager = state.schema_manager.lock().await;
    let (log_path, data_path) = if file_extension == Some("log".to_string()) {
        (std::path::PathBuf::from(&storage_path), std::path::PathBuf::from(&paired_storage_path))
    } else {
        (std::path::PathBuf::from(&paired_storage_path), std::path::PathBuf::from(&storage_path))
    };

    match schema_manager.parse_log_file_with_data(&log_path, &data_path).await {
        Ok(log_file) => {
            let stats = schema_manager.get_log_statistics(&log_file);
            
            let response = SchemaDetectionResponse {
                success: true,
                schema_found: true,
                confidence: 1.0, // We successfully parsed it
                source: format!("Parsed from {} with {} messages", original_filename, stats.total_messages),
                warnings: vec![], // Add warnings if needed
                schema_hash: Some(format!("v{}-ac{}", 
                    log_file.configuration.paparazzi_version.unwrap_or_else(|| "unknown".to_string()),
                    log_file.configuration.aircraft.ac_id)),
            };

            Ok(Json(ApiResponse {
                success: true,
                data: Some(response),
                message: format!("Successfully parsed log file with {} messages", stats.total_messages),
            }))
        }
        Err(e) => {
            warn!("Failed to parse log file {}: {}", original_filename, e);
            
            let response = SchemaDetectionResponse {
                success: false,
                schema_found: false,
                confidence: 0.0,
                source: "Failed to parse".to_string(),
                warnings: vec![format!("Parse error: {}", e)],
                schema_hash: None,
            };

            Ok(Json(ApiResponse {
                success: false,
                data: Some(response),
                message: format!("Failed to parse log file: {}", e),
            }))
        }
    }
}

// Authentication route handlers

/// Register a new user
async fn register(
    State(state): State<Arc<AppState>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(request): Json<CreateUserRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, (StatusCode, Json<ApiResponse<()>>)> {
    info!("Registration request received: {:?}", request);
    
    let user_service = UserService::new();
    let ip_address = Some(IpNetwork::from(addr.ip()));
    let user_agent = None; // TODO: Extract from headers
    
    match user_service.create_user(&state.db, request).await {
        Ok(user) => {
            // Create a session for the newly registered user
            match user_service.create_session(&state.db, user.id, ip_address, user_agent).await {
                Ok(session) => Ok(Json(ApiResponse {
                    success: true,
                    data: Some(LoginResponse { user, session }),
                    message: "User created successfully".to_string(),
                })),
                Err(_) => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse {
                        success: false,
                        data: None,
                        message: "User created but session creation failed".to_string(),
                    })
                ))
            }
        },
        Err(AuthError::UsernameExists) => Err((
            StatusCode::CONFLICT,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "Username already exists".to_string(),
            })
        )),
        Err(AuthError::EmailExists) => Err((
            StatusCode::CONFLICT,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "Email already exists".to_string(),
            })
        )),
        Err(AuthError::InvalidCredentials) => Err((
            StatusCode::CONFLICT,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "Username or email already exists".to_string(),
            })
        )),
        Err(e) => {
            error!("Registration error: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    data: None,
                    message: "Internal server error".to_string(),
                })
            ))
        },
    }
}

/// Login user
async fn login(
    State(state): State<Arc<AppState>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<ApiResponse<LoginResponse>>, (StatusCode, Json<ApiResponse<()>>)> {
    let user_service = UserService::new();
    let ip_address = Some(IpNetwork::from(addr.ip()));
    let user_agent = None; // TODO: Extract from headers
    
    match user_service.login(&state.db, request, ip_address, user_agent).await {
        Ok((user, session)) => Ok(Json(ApiResponse {
            success: true,
            data: Some(LoginResponse { user, session }),
            message: "Login successful".to_string(),
        })),
        Err(AuthError::InvalidCredentials) => Err((
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "Invalid credentials".to_string(),
            })
        )),
        Err(AuthError::AccountLocked) => Err((
            StatusCode::LOCKED,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "Account is locked".to_string(),
            })
        )),
        Err(AuthError::UserNotActive) => Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "User account is not active".to_string(),
            })
        )),
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                data: None,
                message: "Internal server error".to_string(),
            })
        )),
    }
}

/// Logout user (invalidate session)
async fn logout(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let session_id = Uuid::parse_str(&claims.jti).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    let user_service = UserService::new();
    match user_service.logout(&state.db, session_id).await {
        Ok(()) => Ok(Json(ApiResponse {
            success: true,
            data: Some(()),
            message: "Logged out successfully".to_string(),
        })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Get current user profile
async fn profile(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<UserResponse>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    let user_service = UserService::new();
    match user_service.get_user(&state.db, user_id).await {
        Ok(user) => Ok(Json(ApiResponse {
            success: true,
            data: Some(user),
            message: "User profile retrieved".to_string(),
        })),
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

/// Refresh session token
async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(request): Json<RefreshTokenRequest>,
) -> Result<Json<ApiResponse<SessionResponse>>, StatusCode> {
    let user_service = UserService::new();
    
    match user_service.refresh_session(&state.db, request.refresh_token).await {
        Ok(session) => Ok(Json(ApiResponse {
            success: true,
            data: Some(session),
            message: "Token refreshed successfully".to_string(),
        })),
        Err(AuthError::InvalidToken) => Err(StatusCode::UNAUTHORIZED),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Check if username is available
async fn check_username_availability(
    State(state): State<Arc<AppState>>,
    Path(username): Path<String>,
) -> Json<ApiResponse<bool>> {
    let is_available = sqlx::query!(
        "SELECT id FROM users WHERE username = $1",
        username
    )
    .fetch_optional(&state.db)
    .await
    .map(|result| result.is_none())
    .unwrap_or(false);

    Json(ApiResponse {
        success: true,
        data: Some(is_available),
        message: if is_available {
            "Username is available".to_string()
        } else {
            "Username is already taken".to_string()
        },
    })
}

/// Check if email is available
async fn check_email_availability(
    State(state): State<Arc<AppState>>,
    Path(email): Path<String>,
) -> Json<ApiResponse<bool>> {
    let is_available = sqlx::query!(
        "SELECT id FROM users WHERE email = $1",
        email
    )
    .fetch_optional(&state.db)
    .await
    .map(|result| result.is_none())
    .unwrap_or(false);

    Json(ApiResponse {
        success: true,
        data: Some(is_available),
        message: if is_available {
            "Email is available".to_string()
        } else {
            "Email is already registered".to_string()
        },
    })
}

// Response types for authentication

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: UserResponse,
    pub session: SessionResponse,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

// Analysis session route handlers

/// Create a new analysis session
async fn create_analysis_session(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<AnalysisSessionResponse>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    // Extract JSON from request body manually
    let bytes = to_bytes(request.into_body(), usize::MAX)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let session_request: CreateAnalysisSessionRequest = serde_json::from_slice(&bytes)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let analysis_service = AnalysisService::new();
    match analysis_service.create_session(&state.db, user_id, session_request).await {
        Ok(session) => Ok(Json(ApiResponse {
            success: true,
            data: Some(session),
            message: "Analysis session created successfully".to_string(),
        })),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// Get an analysis session by ID
async fn get_analysis_session(
    State(state): State<Arc<AppState>>,
    Path(session_id): Path<Uuid>,
    request: Request,
) -> Result<Json<ApiResponse<AnalysisSessionResponse>>, StatusCode> {
    // TODO: Extract from authentication token
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    
    let analysis_service = AnalysisService::new();
    match analysis_service.get_session(&state.db, user_id, session_id).await {
        Ok(session) => Ok(Json(ApiResponse {
            success: true,
            data: Some(session),
            message: "Analysis session retrieved successfully".to_string(),
        })),
        Err(AnalysisError::SessionNotFound) => Err(StatusCode::NOT_FOUND),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// List all analysis sessions for the current user
async fn list_analysis_sessions(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<Vec<AnalysisSessionResponse>>>, StatusCode> {
    // TODO: Extract from authentication token
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    
    let analysis_service = AnalysisService::new();
    match analysis_service.list_sessions(&state.db, user_id, None, None).await {
        Ok(sessions) => Ok(Json(ApiResponse {
            success: true,
            data: Some(sessions),
            message: "Analysis sessions retrieved successfully".to_string(),
        })),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// Update an analysis session
async fn update_analysis_session(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<AnalysisSessionResponse>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    // Extract path parameter and JSON from request
    let path = request.uri().path();
    let session_id = path.split('/').last()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let bytes = to_bytes(request.into_body(), usize::MAX)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let update_request: UpdateAnalysisSessionRequest = serde_json::from_slice(&bytes)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let analysis_service = AnalysisService::new();
    match analysis_service.update_session(&state.db, user_id, session_id, update_request).await {
        Ok(session) => Ok(Json(ApiResponse {
            success: true,
            data: Some(session),
            message: "Analysis session updated successfully".to_string(),
        })),
        Err(AnalysisError::SessionNotFound) => Err(StatusCode::NOT_FOUND),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// Delete an analysis session
async fn delete_analysis_session(
    State(state): State<Arc<AppState>>,
    Path(session_id): Path<Uuid>,
    request: Request,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    let analysis_service = AnalysisService::new();
    match analysis_service.delete_session(&state.db, user_id, session_id).await {
        Ok(()) => Ok(Json(ApiResponse {
            success: true,
            data: Some(()),
            message: "Analysis session deleted successfully".to_string(),
        })),
        Err(AnalysisError::SessionNotFound) => Err(StatusCode::NOT_FOUND),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// Create a new analysis template
async fn create_analysis_template(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<TemplateResponse>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    // Extract JSON from request body manually
    let bytes = to_bytes(request.into_body(), usize::MAX)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let template_request: CreateTemplateRequest = serde_json::from_slice(&bytes)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let analysis_service = AnalysisService::new();
    match analysis_service.create_template(&state.db, user_id, template_request).await {
        Ok(template) => Ok(Json(ApiResponse {
            success: true,
            data: Some(template),
            message: "Analysis template created successfully".to_string(),
        })),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// List analysis templates for the current user
async fn list_analysis_templates(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> Result<Json<ApiResponse<Vec<TemplateResponse>>>, StatusCode> {
    let claims = get_current_user(&request).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    let analysis_service = AnalysisService::new();
    match analysis_service.list_templates(&state.db, user_id).await {
        Ok(templates) => Ok(Json(ApiResponse {
            success: true,
            data: Some(templates),
            message: "Analysis templates retrieved successfully".to_string(),
        })),
        Err(AnalysisError::DatabaseError(_)) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

/// Build the application router.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/healthz", get(healthz))
        .route("/health", get(health))
        .route("/", get(root))
        // Authentication routes
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/profile", get(profile))
        .route("/api/auth/refresh", post(refresh_token))
        .route("/api/auth/check-username/{username}", get(check_username_availability))
        .route("/api/auth/check-email/{email}", get(check_email_availability))
        // File management routes
        .route("/api/files/upload", post(upload_log_files))
        .route("/api/files", get(list_log_files))
        .route("/api/files/{file_id}", get(get_log_file))
        .route("/api/files/{file_id}", axum::routing::delete(delete_log_file))
        .route("/api/files/{file_id}/schema", get(detect_schema))
        // Analysis session routes
        .route("/api/analysis/sessions", post(create_analysis_session))
        .route("/api/analysis/sessions", get(list_analysis_sessions))
        .route("/api/analysis/sessions/{session_id}", get(get_analysis_session))
        .route("/api/analysis/sessions/{session_id}", axum::routing::put(update_analysis_session))
        .route("/api/analysis/sessions/{session_id}", axum::routing::delete(delete_analysis_session))
        // Analysis template routes
        .route("/api/analysis/templates", post(create_analysis_template))
        .route("/api/analysis/templates", get(list_analysis_templates))
        // TODO: Add processing endpoints later
        // .route("/api/processing/process", post(process_file))
        // .route("/api/processing/status/{task_id}", get(get_processing_status))
        // .route("/api/processing/process-next", post(process_next_queued))
}
