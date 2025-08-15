use serde::{Deserialize, Serialize};
use sqlx::prelude::*;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AnalysisTemplate {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub template_config: serde_json::Value,
    pub is_public: bool,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub usage_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    pub description: Option<String>,
    pub template_config: serde_json::Value,
    pub is_public: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub template_config: serde_json::Value,
    pub is_public: bool,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub usage_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AnalysisSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub file_id: Option<Uuid>,
    pub template_id: Option<Uuid>,
    pub session_name: Option<String>,
    pub session_config: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAnalysisSessionRequest {
    pub file_id: Option<Uuid>,
    pub template_id: Option<Uuid>,
    pub session_name: Option<String>,
    pub session_config: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAnalysisSessionRequest {
    pub session_name: Option<String>,
    pub session_config: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisSessionResponse {
    pub id: Uuid,
    pub file_id: Option<Uuid>,
    pub template_id: Option<Uuid>,
    pub session_name: Option<String>,
    pub session_config: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SavedReport {
    pub id: Uuid,
    pub user_id: Uuid,
    pub file_id: Option<Uuid>,
    pub analysis_session_id: Option<Uuid>,
    pub report_name: String,
    pub report_type: String,
    pub report_data: Option<serde_json::Value>,
    pub file_path: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub file_size: Option<i64>,
    pub download_count: i32,
    pub last_downloaded: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReportRequest {
    pub file_id: Option<Uuid>,
    pub analysis_session_id: Option<Uuid>,
    pub report_name: String,
    pub report_type: String,
    pub report_data: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportResponse {
    pub id: Uuid,
    pub report_name: String,
    pub report_type: String,
    pub file_size: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub download_count: i32,
    pub last_downloaded: Option<DateTime<Utc>>,
}

impl From<AnalysisTemplate> for TemplateResponse {
    fn from(template: AnalysisTemplate) -> Self {
        Self {
            id: template.id,
            name: template.name,
            description: template.description,
            template_config: template.template_config,
            is_public: template.is_public,
            is_system: template.is_system,
            created_at: template.created_at,
            usage_count: template.usage_count,
        }
    }
}

impl From<AnalysisSession> for AnalysisSessionResponse {
    fn from(session: AnalysisSession) -> Self {
        Self {
            id: session.id,
            file_id: session.file_id,
            template_id: session.template_id,
            session_name: session.session_name,
            session_config: session.session_config,
            created_at: session.created_at,
            updated_at: session.updated_at,
            last_accessed: session.last_accessed,
        }
    }
}

impl From<SavedReport> for ReportResponse {
    fn from(report: SavedReport) -> Self {
        Self {
            id: report.id,
            report_name: report.report_name,
            report_type: report.report_type,
            file_size: report.file_size,
            created_at: report.created_at,
            download_count: report.download_count,
            last_downloaded: report.last_downloaded,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    Pdf,
    Html,
    Json,
    Csv,
}

impl ToString for ReportType {
    fn to_string(&self) -> String {
        match self {
            ReportType::Pdf => "pdf".to_string(),
            ReportType::Html => "html".to_string(),
            ReportType::Json => "json".to_string(),
            ReportType::Csv => "csv".to_string(),
        }
    }
}
