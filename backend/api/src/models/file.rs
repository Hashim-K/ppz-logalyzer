use serde::{Deserialize, Serialize};
use sqlx::prelude::*;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LogFile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub original_filename: String,
    pub file_hash: String,
    pub file_size: i64,
    pub content_type: Option<String>,
    pub storage_path: String,
    pub upload_timestamp: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: i32,
    pub is_processed: bool,
    pub processing_status: String,
    pub processing_error: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileUploadRequest {
    pub original_filename: String,
    pub content_type: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResponse {
    pub id: Uuid,
    pub original_filename: String,
    pub file_size: i64,
    pub content_type: Option<String>,
    pub upload_timestamp: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: i32,
    pub is_processed: bool,
    pub processing_status: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FileShare {
    pub id: Uuid,
    pub file_id: Uuid,
    pub shared_by_user_id: Uuid,
    pub shared_with_user_id: Option<Uuid>,
    pub share_token: Option<String>,
    pub permissions: serde_json::Value,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub accessed_count: i32,
    pub last_accessed: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFileShareRequest {
    pub file_id: Uuid,
    pub shared_with_user_id: Option<Uuid>, // None for public share
    pub permissions: serde_json::Value,
    pub expires_in_hours: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareResponse {
    pub id: Uuid,
    pub share_token: Option<String>,
    pub permissions: serde_json::Value,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ParsedData {
    pub id: Uuid,
    pub file_id: Uuid,
    pub data_type: String,
    pub timestamp_field: Option<DateTime<Utc>>,
    pub raw_data: serde_json::Value,
    pub indexed_fields: Option<serde_json::Value>,
    pub sequence_number: Option<i64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedDataQuery {
    pub file_id: Uuid,
    pub data_types: Option<Vec<String>>,
    pub timestamp_start: Option<DateTime<Utc>>,
    pub timestamp_end: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileAnnotation {
    pub id: Uuid,
    pub user_id: Uuid,
    pub file_id: Uuid,
    pub timestamp_start: Option<DateTime<Utc>>,
    pub timestamp_end: Option<DateTime<Utc>>,
    pub data_point_id: Option<Uuid>,
    pub annotation_type: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub color: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAnnotationRequest {
    pub file_id: Uuid,
    pub timestamp_start: Option<DateTime<Utc>>,
    pub timestamp_end: Option<DateTime<Utc>>,
    pub data_point_id: Option<Uuid>,
    pub annotation_type: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub color: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: Option<bool>,
}

impl From<LogFile> for FileResponse {
    fn from(file: LogFile) -> Self {
        Self {
            id: file.id,
            original_filename: file.original_filename,
            file_size: file.file_size,
            content_type: file.content_type,
            upload_timestamp: file.upload_timestamp,
            last_accessed: file.last_accessed,
            access_count: file.access_count,
            is_processed: file.is_processed,
            processing_status: file.processing_status,
            metadata: file.metadata,
        }
    }
}

impl From<FileShare> for ShareResponse {
    fn from(share: FileShare) -> Self {
        Self {
            id: share.id,
            share_token: share.share_token,
            permissions: share.permissions,
            expires_at: share.expires_at,
            created_at: share.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

impl ToString for ProcessingStatus {
    fn to_string(&self) -> String {
        match self {
            ProcessingStatus::Pending => "pending".to_string(),
            ProcessingStatus::Processing => "processing".to_string(),
            ProcessingStatus::Completed => "completed".to_string(),
            ProcessingStatus::Failed => "failed".to_string(),
        }
    }
}

impl LogFile {
    pub fn is_processing_complete(&self) -> bool {
        self.processing_status == "completed"
    }

    pub fn has_processing_error(&self) -> bool {
        self.processing_status == "failed" && self.processing_error.is_some()
    }
}

impl FileShare {
    pub fn is_expired(&self) -> bool {
        self.expires_at
            .map(|expires| expires <= Utc::now())
            .unwrap_or(false)
    }

    pub fn is_valid(&self) -> bool {
        self.is_active && !self.is_expired()
    }
}
