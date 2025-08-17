//! PaparazziUAV telemetry parsing and processing module

use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use tokio::fs;
use tracing::{debug, info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaparazziLogFile {
    pub log_path: String,
    pub data_path: Option<String>,
    pub configuration: LogConfiguration,
    pub metadata: LogMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfiguration {
    pub time_of_day: Option<f64>,
    pub aircraft: Option<AircraftConfig>,
    pub messages: HashMap<String, MessageDefinition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AircraftConfig {
    pub name: String,
    pub ac_id: Option<u32>,
    pub airframe: Option<String>,
    pub flight_plan: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageDefinition {
    pub id: u32,
    pub name: String,
    pub fields: Vec<FieldDefinition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldDefinition {
    pub name: String,
    pub field_type: String,
    pub unit: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogMetadata {
    pub paparazzi_version: Option<String>,
    pub creation_time: Option<chrono::DateTime<chrono::Utc>>,
    pub aircraft_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryRecord {
    pub timestamp: f64,
    pub aircraft_id: u32,
    pub message_name: String,
    pub values: Vec<String>,
}

/// Parse PaparazziUAV log configuration from .log file
pub async fn parse_log_configuration<P: AsRef<Path>>(log_file_path: P) -> Result<LogConfiguration> {
    let content = fs::read_to_string(&log_file_path).await
        .map_err(|e| anyhow!("Failed to read log file: {}", e))?;
    
    info!("Parsing log configuration from: {}", log_file_path.as_ref().display());
    
    // Basic XML parsing to extract time_of_day and data_file
    let mut config = LogConfiguration {
        time_of_day: None,
        aircraft: None,
        messages: HashMap::new(),
    };
    
    // Extract time_of_day from configuration tag
    if let Some(time_match) = content.find("time_of_day=") {
        if let Some(start) = content[time_match..].find('"') {
            if let Some(end) = content[time_match + start + 1..].find('"') {
                let time_str = &content[time_match + start + 1..time_match + start + 1 + end];
                config.time_of_day = time_str.parse().ok();
            }
        }
    }
    
    debug!("Parsed configuration with time_of_day: {:?}", config.time_of_day);
    Ok(config)
}

/// Parse telemetry data from .data file
pub async fn parse_telemetry_data<P: AsRef<Path>>(data_file_path: P) -> Result<Vec<TelemetryRecord>> {
    let content = fs::read_to_string(&data_file_path).await
        .map_err(|e| anyhow!("Failed to read data file: {}", e))?;
    
    info!("Parsing telemetry data from: {}", data_file_path.as_ref().display());
    
    let mut records = Vec::new();
    
    for (line_num, line) in content.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 3 {
            warn!("Skipping invalid line {}: insufficient parts", line_num + 1);
            continue;
        }
        
        match parse_telemetry_line(parts) {
            Ok(record) => records.push(record),
            Err(e) => {
                debug!("Failed to parse line {}: {}", line_num + 1, e);
                continue;
            }
        }
    }
    
    info!("Parsed {} telemetry records", records.len());
    Ok(records)
}

fn parse_telemetry_line(parts: Vec<&str>) -> Result<TelemetryRecord> {
    if parts.len() < 3 {
        return Err(anyhow!("Line has fewer than 3 parts"));
    }
    
    let timestamp: f64 = parts[0].parse()
        .map_err(|e| anyhow!("Invalid timestamp '{}': {}", parts[0], e))?;
    
    let aircraft_id: u32 = parts[1].parse()
        .map_err(|e| anyhow!("Invalid aircraft_id '{}': {}", parts[1], e))?;
    
    let message_name = parts[2].to_string();
    let values: Vec<String> = parts[3..].iter().map(|s| s.to_string()).collect();
    
    Ok(TelemetryRecord {
        timestamp,
        aircraft_id,
        message_name,
        values,
    })
}

/// Determine the corresponding .data file path for a .log file
pub fn get_data_file_path<P: AsRef<Path>>(log_file_path: P) -> Option<String> {
    let log_path = log_file_path.as_ref();
    if let Some(stem) = log_path.file_stem() {
        let data_path = log_path.with_file_name(format!("{}.data", stem.to_string_lossy()));
        if data_path.exists() {
            Some(data_path.to_string_lossy().to_string())
        } else {
            None
        }
    } else {
        None
    }
}

/// Parse both .log and .data files for a complete PaparazziUAV log
pub async fn parse_paparazzi_log<P: AsRef<Path>>(log_file_path: P) -> Result<PaparazziLogFile> {
    let log_path = log_file_path.as_ref().to_string_lossy().to_string();
    
    // Parse configuration
    let configuration = parse_log_configuration(&log_file_path).await?;
    
    // Find corresponding data file
    let data_path = get_data_file_path(&log_file_path);
    
    // Extract basic metadata
    let metadata = LogMetadata {
        paparazzi_version: None, // TODO: Extract from XML
        creation_time: None,     // TODO: Extract from timestamp
        aircraft_id: None,       // TODO: Extract from configuration
    };
    
    Ok(PaparazziLogFile {
        log_path,
        data_path,
        configuration,
        metadata,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_parse_telemetry_line() {
        let parts = vec!["36.642", "38", "EFF_MAT_STAB", "0.0", "-0.008314", "0.0"];
        let result = parse_telemetry_line(parts).unwrap();
        
        assert_eq!(result.timestamp, 36.642);
        assert_eq!(result.aircraft_id, 38);
        assert_eq!(result.message_name, "EFF_MAT_STAB");
        assert_eq!(result.values.len(), 3);
    }
}