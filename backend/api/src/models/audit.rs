use serde::{Deserialize, Serialize};
use sqlx::prelude::*;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AuditLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub action_type: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<Uuid>,
    pub old_values: Option<serde_json::Value>,
    pub new_values: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub success: bool,
    pub error_message: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAuditLogRequest {
    pub user_id: Option<Uuid>,
    pub action_type: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<Uuid>,
    pub old_values: Option<serde_json::Value>,
    pub new_values: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub success: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PerformanceMetric {
    pub id: Uuid,
    pub metric_type: String,
    pub metric_name: String,
    pub metric_value: rust_decimal::Decimal,
    pub unit: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub user_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMetricRequest {
    pub metric_type: String,
    pub metric_name: String,
    pub metric_value: f64,
    pub unit: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub user_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SystemAlert {
    pub id: Uuid,
    pub alert_type: String,
    pub severity: String,
    pub title: String,
    pub message: String,
    pub metadata: Option<serde_json::Value>,
    pub user_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
    pub is_resolved: bool,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAlertRequest {
    pub alert_type: String,
    pub severity: AlertSeverity,
    pub title: String,
    pub message: String,
    pub metadata: Option<serde_json::Value>,
    pub user_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveAlertRequest {
    pub resolved_by: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertResponse {
    pub id: Uuid,
    pub alert_type: String,
    pub severity: String,
    pub title: String,
    pub message: String,
    pub metadata: Option<serde_json::Value>,
    pub user_id: Option<Uuid>,
    pub file_id: Option<Uuid>,
    pub is_resolved: bool,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CacheEntry {
    pub id: Uuid,
    pub cache_key: String,
    pub cache_value: serde_json::Value,
    pub metadata: Option<serde_json::Value>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub accessed_count: i32,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Login,
    Logout,
    FileUpload,
    FileDelete,
    FileShare,
    UserCreate,
    UserUpdate,
    UserDelete,
    SessionCreate,
    SessionDelete,
    AnalysisCreate,
    AnalysisUpdate,
    AnalysisDelete,
    ReportGenerate,
    TemplateCreate,
    TemplateUpdate,
    TemplateDelete,
}

impl ToString for ActionType {
    fn to_string(&self) -> String {
        match self {
            ActionType::Login => "login".to_string(),
            ActionType::Logout => "logout".to_string(),
            ActionType::FileUpload => "file_upload".to_string(),
            ActionType::FileDelete => "file_delete".to_string(),
            ActionType::FileShare => "file_share".to_string(),
            ActionType::UserCreate => "user_create".to_string(),
            ActionType::UserUpdate => "user_update".to_string(),
            ActionType::UserDelete => "user_delete".to_string(),
            ActionType::SessionCreate => "session_create".to_string(),
            ActionType::SessionDelete => "session_delete".to_string(),
            ActionType::AnalysisCreate => "analysis_create".to_string(),
            ActionType::AnalysisUpdate => "analysis_update".to_string(),
            ActionType::AnalysisDelete => "analysis_delete".to_string(),
            ActionType::ReportGenerate => "report_generate".to_string(),
            ActionType::TemplateCreate => "template_create".to_string(),
            ActionType::TemplateUpdate => "template_update".to_string(),
            ActionType::TemplateDelete => "template_delete".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Low,
    Medium,
    High,
    Critical,
}

impl ToString for AlertSeverity {
    fn to_string(&self) -> String {
        match self {
            AlertSeverity::Low => "low".to_string(),
            AlertSeverity::Medium => "medium".to_string(),
            AlertSeverity::High => "high".to_string(),
            AlertSeverity::Critical => "critical".to_string(),
        }
    }
}

impl From<SystemAlert> for AlertResponse {
    fn from(alert: SystemAlert) -> Self {
        Self {
            id: alert.id,
            alert_type: alert.alert_type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            metadata: alert.metadata,
            user_id: alert.user_id,
            file_id: alert.file_id,
            is_resolved: alert.is_resolved,
            resolved_by: alert.resolved_by,
            resolved_at: alert.resolved_at,
            created_at: alert.created_at,
        }
    }
}

impl CacheEntry {
    pub fn is_expired(&self) -> bool {
        self.expires_at
            .map(|expires| expires <= Utc::now())
            .unwrap_or(false)
    }
}
