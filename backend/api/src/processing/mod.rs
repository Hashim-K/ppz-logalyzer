//! File processing pipeline for PaparazziUAV log files
//!
//! This module handles:
//! - Processing uploaded log file pairs (.log/.data)
//! - Schema-aware parsing using detected schemas
//! - File validation and error recovery
//! - Processing status tracking and notifications

use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;
use tracing::{debug, info, warn, error};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::schema::{SchemaManager, PaparazziSchema, SchemaDetectionResult};

/// File processing pipeline manager
#[derive(Debug)]
pub struct FileProcessor {
    schema_manager: SchemaManager,
    processing_queue: Vec<ProcessingTask>,
}

/// Represents a file processing task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingTask {
    pub id: Uuid,
    pub log_file_path: PathBuf,
    pub data_file_path: Option<PathBuf>,
    pub status: ProcessingStatus,
    pub schema_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub progress: f64,
}

/// Processing status for tracking
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProcessingStatus {
    Queued,
    Processing,
    Completed,
    Failed,
    SchemaError,
    ValidationError,
}

/// Result of file processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub task_id: Uuid,
    pub status: ProcessingStatus,
    pub parsed_data: Option<ParsedLogData>,
    pub schema_used: Option<String>, // Schema hash
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
    pub processing_time_ms: u64,
    pub records_processed: usize,
}

/// Parsed log data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedLogData {
    pub metadata: LogFileMetadata,
    pub messages: Vec<ParsedMessage>,
    pub statistics: ProcessingStatistics,
}

/// Metadata extracted from log files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFileMetadata {
    pub aircraft_name: Option<String>,
    pub aircraft_id: Option<u32>,
    pub flight_time: Option<DateTime<Utc>>,
    pub duration_seconds: Option<f64>,
    pub paparazzi_version: Option<String>,
    pub airframe_config: Option<String>,
    pub flight_plan: Option<String>,
}

/// Individual parsed message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedMessage {
    pub timestamp: f64,
    pub message_id: u32,
    pub message_name: String,
    pub fields: std::collections::HashMap<String, FieldValue>,
    pub raw_data: Option<Vec<u8>>,
}

/// Field value with type information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FieldValue {
    Uint8(u8),
    Int8(i8),
    Uint16(u16),
    Int16(i16),
    Uint32(u32),
    Int32(i32),
    Uint64(u64),
    Int64(i64),
    Float(f32),
    Double(f64),
    String(String),
    Array(Vec<FieldValue>),
}

/// Processing statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingStatistics {
    pub total_messages: usize,
    pub message_type_counts: std::collections::HashMap<String, usize>,
    pub processing_time_ms: u64,
    pub bytes_processed: u64,
    pub parse_errors: usize,
    pub warnings: usize,
}

impl FileProcessor {
    /// Create a new file processor
    pub fn new() -> Self {
        Self {
            schema_manager: SchemaManager::new(),
            processing_queue: Vec::new(),
        }
    }

    /// Add a file pair to the processing queue
    pub async fn queue_file_pair(
        &mut self,
        log_path: PathBuf,
        data_path: Option<PathBuf>,
    ) -> Result<Uuid> {
        // Validate files exist
        if !log_path.exists() {
            return Err(anyhow!("Log file does not exist: {}", log_path.display()));
        }

        if let Some(ref data_path) = data_path {
            if !data_path.exists() {
                return Err(anyhow!("Data file does not exist: {}", data_path.display()));
            }
        }

        let task_id = Uuid::new_v4();
        let task = ProcessingTask {
            id: task_id,
            log_file_path: log_path.clone(),
            data_file_path: data_path,
            status: ProcessingStatus::Queued,
            schema_hash: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            error_message: None,
            progress: 0.0,
        };

        self.processing_queue.push(task);
        info!("Queued file processing task: {} for file: {}", 
              task_id, log_path.display());

        Ok(task_id)
    }

    /// Process the next file in the queue
    pub async fn process_next(&mut self) -> Result<Option<ProcessingResult>> {
        let task_index = self.processing_queue.iter()
            .position(|t| t.status == ProcessingStatus::Queued);

        let task_index = match task_index {
            Some(idx) => idx,
            None => return Ok(None), // No queued tasks
        };

        // Update task status
        self.processing_queue[task_index].status = ProcessingStatus::Processing;
        self.processing_queue[task_index].started_at = Some(Utc::now());

        let task = self.processing_queue[task_index].clone();
        let result = self.process_file_task(&task).await;

        // Update task with result
        match &result {
            Ok(processing_result) => {
                self.processing_queue[task_index].status = processing_result.status.clone();
                self.processing_queue[task_index].completed_at = Some(Utc::now());
                if processing_result.status == ProcessingStatus::Failed {
                    self.processing_queue[task_index].error_message = 
                        Some(processing_result.errors.join("; "));
                }
            }
            Err(e) => {
                self.processing_queue[task_index].status = ProcessingStatus::Failed;
                self.processing_queue[task_index].error_message = Some(e.to_string());
                self.processing_queue[task_index].completed_at = Some(Utc::now());
            }
        }

        result.map(Some)
    }

    /// Process a specific file task
    async fn process_file_task(&mut self, task: &ProcessingTask) -> Result<ProcessingResult> {
        let start_time = std::time::Instant::now();
        info!("Processing file task: {}", task.id);

        // Step 1: Detect schema
        let schema_result = self.schema_manager
            .detect_schema_from_log(&task.log_file_path).await?;

        let schema = match schema_result.schema {
            Some(schema) => schema,
            None => {
                warn!("No schema detected for file: {}", task.log_file_path.display());
                return Ok(ProcessingResult {
                    task_id: task.id,
                    status: ProcessingStatus::SchemaError,
                    parsed_data: None,
                    schema_used: None,
                    warnings: schema_result.warnings,
                    errors: vec!["No schema could be detected or loaded".to_string()],
                    processing_time_ms: start_time.elapsed().as_millis() as u64,
                    records_processed: 0,
                });
            }
        };

        // Step 2: Parse log file using detected schema
        let parsed_data = match self.parse_log_file(&task.log_file_path, &schema).await {
            Ok(data) => data,
            Err(e) => {
                error!("Failed to parse log file: {}", e);
                return Ok(ProcessingResult {
                    task_id: task.id,
                    status: ProcessingStatus::Failed,
                    parsed_data: None,
                    schema_used: Some(self.schema_manager.get_schema_hash(&schema)),
                    warnings: schema_result.warnings,
                    errors: vec![format!("Parse error: {}", e)],
                    processing_time_ms: start_time.elapsed().as_millis() as u64,
                    records_processed: 0,
                });
            }
        };

        // Step 3: Validate parsed data
        let validation_result = self.validate_parsed_data(&parsed_data, &schema);

        let final_status = if validation_result.is_empty() {
            ProcessingStatus::Completed
        } else {
            ProcessingStatus::ValidationError
        };

        let processing_time = start_time.elapsed().as_millis() as u64;

        Ok(ProcessingResult {
            task_id: task.id,
            status: final_status,
            parsed_data: Some(parsed_data.clone()),
            schema_used: Some(self.schema_manager.get_schema_hash(&schema)),
            warnings: [schema_result.warnings, validation_result].concat(),
            errors: vec![],
            processing_time_ms: processing_time,
            records_processed: parsed_data.messages.len(),
        })
    }

    /// Parse log file using the provided schema
    async fn parse_log_file(
        &self,
        log_path: &Path,
        schema: &PaparazziSchema,
    ) -> Result<ParsedLogData> {
        info!("Parsing log file: {} with schema", log_path.display());

        // Read log file content
        let content = fs::read_to_string(log_path).await
            .map_err(|e| anyhow!("Cannot read log file: {}", e))?;

        let mut messages = Vec::new();
        let mut metadata = LogFileMetadata {
            aircraft_name: schema.aircraft.as_ref().map(|a| a.name.clone()),
            aircraft_id: schema.aircraft.as_ref().map(|a| a.ac_id),
            flight_time: None,
            duration_seconds: None,
            paparazzi_version: None,
            airframe_config: None,
            flight_plan: None,
        };

        let mut line_count = 0;
        let mut parse_errors = 0;
        let mut message_type_counts = std::collections::HashMap::new();

        // Parse each line of the log file
        for (line_no, line) in content.lines().enumerate() {
            line_count += 1;
            
            // Skip empty lines and comments
            if line.trim().is_empty() || line.starts_with('#') {
                continue;
            }

            // Try to parse the line as a message
            match self.parse_log_line(line, schema) {
                Ok(Some(message)) => {
                    *message_type_counts.entry(message.message_name.clone())
                        .or_insert(0) += 1;
                    messages.push(message);
                }
                Ok(None) => {
                    // Line was parsed but didn't contain a message (header info)
                    if let Some(meta_update) = self.extract_metadata_from_line(line) {
                        self.update_metadata(&mut metadata, meta_update);
                    }
                }
                Err(e) => {
                    parse_errors += 1;
                    debug!("Parse error on line {}: {}", line_no + 1, e);
                }
            }
        }

        // Calculate duration from first and last message timestamps
        if let (Some(first), Some(last)) = (messages.first(), messages.last()) {
            metadata.duration_seconds = Some(last.timestamp - first.timestamp);
        }

        let statistics = ProcessingStatistics {
            total_messages: messages.len(),
            message_type_counts,
            processing_time_ms: 0, // Will be filled by caller
            bytes_processed: content.len() as u64,
            parse_errors,
            warnings: 0, // Will be filled by validation
        };

        Ok(ParsedLogData {
            metadata,
            messages,
            statistics,
        })
    }

    /// Parse a single log line into a message
    fn parse_log_line(
        &self,
        line: &str,
        schema: &PaparazziSchema,
    ) -> Result<Option<ParsedMessage>> {
        // Simplified parsing logic - real implementation would be more complex
        // Expected format: timestamp message_id field1=value1 field2=value2 ...
        
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            return Ok(None); // Not a message line
        }

        // Parse timestamp
        let timestamp = parts[0].parse::<f64>()
            .map_err(|_| anyhow!("Invalid timestamp: {}", parts[0]))?;

        // Parse message ID or name
        let message_info = if let Ok(msg_id) = parts[1].parse::<u32>() {
            // Message ID provided
            schema.messages.values()
                .find(|m| m.id == msg_id)
                .ok_or_else(|| anyhow!("Unknown message ID: {}", msg_id))?
        } else {
            // Message name provided
            schema.messages.get(parts[1])
                .ok_or_else(|| anyhow!("Unknown message name: {}", parts[1]))?
        };

        // Parse field values
        let mut fields = std::collections::HashMap::new();
        for part in parts.iter().skip(2) {
            if let Some((field_name, value_str)) = part.split_once('=') {
                if let Some(field_schema) = message_info.fields.iter()
                    .find(|f| f.name == field_name) {
                    
                    let field_value = self.parse_field_value(value_str, &field_schema.r#type)?;
                    fields.insert(field_name.to_string(), field_value);
                }
            }
        }

        Ok(Some(ParsedMessage {
            timestamp,
            message_id: message_info.id,
            message_name: message_info.name.clone(),
            fields,
            raw_data: None,
        }))
    }

    /// Parse a field value according to its type
    fn parse_field_value(
        &self,
        value_str: &str,
        field_type: &crate::schema::FieldType,
    ) -> Result<FieldValue> {
        use crate::schema::FieldType;
        
        match field_type {
            FieldType::Uint8 => Ok(FieldValue::Uint8(value_str.parse()?)),
            FieldType::Int8 => Ok(FieldValue::Int8(value_str.parse()?)),
            FieldType::Uint16 => Ok(FieldValue::Uint16(value_str.parse()?)),
            FieldType::Int16 => Ok(FieldValue::Int16(value_str.parse()?)),
            FieldType::Uint32 => Ok(FieldValue::Uint32(value_str.parse()?)),
            FieldType::Int32 => Ok(FieldValue::Int32(value_str.parse()?)),
            FieldType::Uint64 => Ok(FieldValue::Uint64(value_str.parse()?)),
            FieldType::Int64 => Ok(FieldValue::Int64(value_str.parse()?)),
            FieldType::Float => Ok(FieldValue::Float(value_str.parse()?)),
            FieldType::Double => Ok(FieldValue::Double(value_str.parse()?)),
            FieldType::String => Ok(FieldValue::String(value_str.to_string())),
            FieldType::Array { element_type: _, size: _ } => {
                // Simplified array parsing - split by commas
                let elements: Result<Vec<_>> = value_str.split(',')
                    .map(|s| self.parse_field_value(s.trim(), field_type))
                    .collect();
                Ok(FieldValue::Array(elements?))
            }
        }
    }

    /// Extract metadata from a log line
    fn extract_metadata_from_line(&self, line: &str) -> Option<MetadataUpdate> {
        if line.contains("AIRCRAFT:") {
            if let Some(name) = line.split("AIRCRAFT:").nth(1) {
                return Some(MetadataUpdate::AircraftName(name.trim().to_string()));
            }
        }
        
        if line.contains("VERSION:") {
            if let Some(version) = line.split("VERSION:").nth(1) {
                return Some(MetadataUpdate::Version(version.trim().to_string()));
            }
        }
        
        None
    }

    /// Update metadata with extracted information
    fn update_metadata(&self, metadata: &mut LogFileMetadata, update: MetadataUpdate) {
        match update {
            MetadataUpdate::AircraftName(name) => metadata.aircraft_name = Some(name),
            MetadataUpdate::Version(version) => metadata.paparazzi_version = Some(version),
            MetadataUpdate::FlightTime(time) => metadata.flight_time = Some(time),
        }
    }

    /// Validate parsed data against schema
    fn validate_parsed_data(
        &self,
        data: &ParsedLogData,
        schema: &PaparazziSchema,
    ) -> Vec<String> {
        let mut warnings = Vec::new();

        // Check if all message types in data are defined in schema
        let schema_messages: std::collections::HashSet<_> = 
            schema.messages.keys().collect();

        for message in &data.messages {
            if !schema_messages.contains(&message.message_name) {
                warnings.push(format!("Unknown message type: {}", message.message_name));
            }
        }

        // Check for missing required fields
        for message in &data.messages {
            if let Some(msg_schema) = schema.messages.get(&message.message_name) {
                for field_schema in &msg_schema.fields {
                    if !message.fields.contains_key(&field_schema.name) {
                        warnings.push(format!(
                            "Missing field '{}' in message '{}'",
                            field_schema.name,
                            message.message_name
                        ));
                    }
                }
            }
        }

        warnings
    }

    /// Get processing queue status
    pub fn get_queue_status(&self) -> Vec<ProcessingTask> {
        self.processing_queue.clone()
    }

    /// Get task by ID
    pub fn get_task(&self, task_id: &Uuid) -> Option<&ProcessingTask> {
        self.processing_queue.iter().find(|t| t.id == *task_id)
    }

    /// Remove completed tasks older than specified duration
    pub fn cleanup_completed_tasks(&mut self, max_age_hours: u64) {
        let cutoff = Utc::now() - chrono::Duration::hours(max_age_hours as i64);
        
        self.processing_queue.retain(|task| {
            if matches!(task.status, ProcessingStatus::Completed | ProcessingStatus::Failed) {
                if let Some(completed_at) = task.completed_at {
                    completed_at > cutoff
                } else {
                    true // Keep tasks without completion time
                }
            } else {
                true // Keep non-completed tasks
            }
        });
    }
}

/// Metadata update types
#[derive(Debug, Clone)]
enum MetadataUpdate {
    AircraftName(String),
    Version(String),
    FlightTime(DateTime<Utc>),
}

impl Default for FileProcessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_file_processor_creation() {
        let processor = FileProcessor::new();
        assert!(processor.processing_queue.is_empty());
    }

    #[test]
    fn test_field_value_parsing() {
        let processor = FileProcessor::new();
        
        let result = processor.parse_field_value("42", &crate::schema::FieldType::Uint32);
        assert!(result.is_ok());
        
        if let Ok(FieldValue::Uint32(value)) = result {
            assert_eq!(value, 42);
        } else {
            panic!("Expected Uint32 value");
        }
    }
}
