use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Serialize;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::fs;
use tracing::{error, info};
use uuid::Uuid;

// App state
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
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

async fn healthz() -> &'static str {
    "ok"
}

async fn upload_log_files(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<Json<ApiResponse<Vec<FileUploadResponse>>>, StatusCode> {
    let mut uploaded_files = Vec::new();
    
    // Create uploads directory if it doesn't exist
    if let Err(e) = fs::create_dir_all("uploads").await {
        error!("Failed to create uploads directory: {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let _name = field.name().unwrap_or("unknown").to_string();
        let original_filename = field.file_name().unwrap_or("unknown").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
        
        // Read file data
        let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
        let file_size = data.len() as i64;
        
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
        
        // For now, we'll use a dummy user_id. In real implementation, get from auth
        let user_id = Uuid::new_v4(); // TODO: Replace with actual user from auth
        
        // Insert into database
        let upload_timestamp = chrono::Utc::now();
        let result = sqlx::query!(
            r#"
            INSERT INTO log_files (id, user_id, original_filename, storage_path, file_size, file_hash, content_type, upload_timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, original_filename, file_size, upload_timestamp, content_type
            "#,
            file_id,
            user_id,
            original_filename,
            storage_path,
            file_size,
            file_hash,
            content_type,
            upload_timestamp
        ).fetch_one(&state.db).await;

        match result {
            Ok(record) => {
                info!("Successfully uploaded file: {} ({})", original_filename, file_id);
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

    Ok(Json(ApiResponse {
        success: true,
        data: Some(uploaded_files),
        message: "Files uploaded successfully".to_string(),
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

/// Build the application router.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/healthz", get(healthz))
        .route("/api/files/upload", post(upload_log_files))
        .route("/api/files", get(list_log_files))
        .route("/api/files/{file_id}", get(get_log_file))
        .route("/api/files/{file_id}", axum::routing::delete(delete_log_file))
}
