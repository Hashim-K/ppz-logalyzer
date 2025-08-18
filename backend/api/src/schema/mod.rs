use std::collections::HashMap;

pub struct SchemaManager {
    cache: HashMap<String, String>,
}

impl SchemaManager {
    /// Parse a PaparazziUAV log file with explicit log and data file paths
    pub async fn parse_log_file_with_data(&mut self, log_path: &Path, data_path: &Path) -> Result<LogFile> {
        let log_path = log_path.to_path_buf();
        let data_file_path = data_path.to_path_buf();
        let cache_key = format!("{}|{}", log_path.to_string_lossy(), data_file_path.to_string_lossy());

        info!("Parsing PaparazziUAV log file: {:?} with data file: {:?}", log_path, data_file_path);

        // Read and parse the .log file
        let log_content = fs::read_to_string(&log_path).await
            .map_err(|e| anyhow!("Failed to read log file {:?}: {}", log_path, e))?;

        let configuration = self.parse_log_configuration(&log_content)?;

        // Parse telemetry messages from the provided data file
        let telemetry_messages = self.parse_telemetry_data(&data_file_path, &configuration).await?;

        let log_file = LogFile {
            configuration,
            messages: telemetry_messages,
            file_path: log_path.clone(),
            data_file_path,
        };

        Ok(log_file)
    }
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
        }
    }
}

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;
use tracing::{debug, info, warn};

/// Represents a parsed PaparazziUAV log file with its configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFile {
    pub configuration: LogConfiguration,
    pub messages: Vec<TelemetryMessage>,
    pub file_path: PathBuf,
    pub data_file_path: PathBuf,
}

/// Configuration extracted from the .log file header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfiguration {
    pub time_of_day: f64,
    pub data_file: String,
    pub aircraft: AircraftInfo,
    pub paparazzi_version: Option<String>,
    pub build_version: Option<String>,
}

/// Aircraft configuration information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AircraftInfo {
    pub ac_id: u32,
    pub name: String,
    pub flight_plan: Option<String>,
    pub airframe: Option<String>,
    pub firmware: Option<String>,
}

/// Individual telemetry message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryMessage {
    pub timestamp: f64,
    pub sender_id: u8,
    pub message_id: u8,
    pub message_name: String,
    pub fields: HashMap<String, String>,
}

/// Statistics about a log file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStatistics {
    pub total_messages: usize,
    pub unique_senders: usize,
    pub unique_message_types: usize,
    pub time_span: f64,
    pub message_rate: f64,
}

impl SchemaManager {
    /// Parse a PaparazziUAV log file pair (.log + .data)
    pub async fn parse_log_file(&mut self, log_path: &Path) -> Result<LogFile> {
        let log_path = log_path.to_path_buf();
        let cache_key = log_path.to_string_lossy().to_string();
        
        info!("Parsing PaparazziUAV log file: {:?}", log_path);

        // Read and parse the .log file
        let log_content = fs::read_to_string(&log_path).await
            .map_err(|e| anyhow!("Failed to read log file {:?}: {}", log_path, e))?;

        let configuration = self.parse_log_configuration(&log_content)?;
        
        // Determine data file path
        let data_file_path = log_path.with_extension("data");
        if !data_file_path.exists() {
            return Err(anyhow!("Data file not found: {:?}", data_file_path));
        }

        // Parse telemetry messages
        let telemetry_messages = self.parse_telemetry_data(&data_file_path, &configuration).await?;

        let log_file = LogFile {
            configuration,
            messages: telemetry_messages,
            file_path: log_path.clone(),
            data_file_path,
        };

        Ok(log_file)
    }

    /// Get statistics for a log file
    pub fn get_log_statistics(&self, log_file: &LogFile) -> LogStatistics {
        let total_messages = log_file.messages.len();
        let unique_senders: std::collections::HashSet<u8> = log_file.messages.iter().map(|m| m.sender_id).collect();
        let unique_message_types: std::collections::HashSet<u8> = log_file.messages.iter().map(|m| m.message_id).collect();
        
        let time_span = if total_messages > 1 {
            log_file.messages.last().unwrap().timestamp - log_file.messages.first().unwrap().timestamp
        } else {
            0.0
        };
        
        let message_rate = if time_span > 0.0 {
            total_messages as f64 / time_span
        } else {
            0.0
        };

        LogStatistics {
            total_messages,
            unique_senders: unique_senders.len(),
            unique_message_types: unique_message_types.len(),
            time_span,
            message_rate,
        }
    }

    /// Parse the log file configuration from .log file content
    fn parse_log_configuration(&self, log_content: &str) -> Result<LogConfiguration> {
        // Find the paparazzi version from comments
        let paparazzi_version = log_content
            .lines()
            .find(|line| line.contains("paparazzi_version"))
            .and_then(|line| {
                if let Some(start) = line.find("paparazzi_version") {
                    let version_part = &line[start..];
                    if let Some(v_start) = version_part.find(' ') {
                        let version_str = &version_part[v_start + 1..];
                        Some(version_str.trim_end_matches(" -->").trim().to_string())
                    } else {
                        None
                    }
                } else {
                    None
                }
            });

        // Find the configuration element
        let config_start = log_content.find("<configuration")
            .ok_or_else(|| anyhow!("No <configuration> element found in log file"))?;
        let config_line_end = log_content[config_start..].find('>')
            .ok_or_else(|| anyhow!("Malformed <configuration> element"))?;
        let config_element = &log_content[config_start..config_start + config_line_end + 1];
        
        // Extract configuration attributes
        let time_of_day = self.extract_attribute(config_element, "time_of_day")?
            .parse::<f64>()
            .map_err(|_| anyhow!("Invalid time_of_day format"))?;
        
        let data_file = self.extract_attribute(config_element, "data_file")?;
        
        // Find aircraft configuration
        let aircraft_start = log_content.find("<aircraft")
            .ok_or_else(|| anyhow!("No <aircraft> element found in log file"))?;
        let aircraft_line_end = log_content[aircraft_start..].find('>')
            .ok_or_else(|| anyhow!("Malformed <aircraft> element"))?;
        let aircraft_element = &log_content[aircraft_start..aircraft_start + aircraft_line_end + 1];
        
        let ac_id = self.extract_attribute(aircraft_element, "ac_id")?
            .parse::<u32>()
            .map_err(|_| anyhow!("Invalid ac_id format"))?;
        
        let ac_name = self.extract_attribute(aircraft_element, "name")
            .unwrap_or_else(|_| format!("Aircraft_{}", ac_id));
        
        let aircraft = AircraftInfo {
            ac_id,
            name: ac_name,
            flight_plan: self.extract_attribute(aircraft_element, "flight_plan").ok(),
            airframe: self.extract_attribute(aircraft_element, "airframe").ok(),
            firmware: None, // Will be extracted from firmware element if needed
        };
        
        Ok(LogConfiguration {
            time_of_day,
            data_file,
            aircraft,
            paparazzi_version,
            build_version: None, // Can be extracted from build comment if needed
        })
    }

    /// Parse telemetry data from .data file
    async fn parse_telemetry_data(&self, data_path: &Path, _config: &LogConfiguration) -> Result<Vec<TelemetryMessage>> {
        let data_content = fs::read_to_string(data_path).await
            .map_err(|e| anyhow!("Failed to read data file {:?}: {}", data_path, e))?;
        
        let mut messages = Vec::new();
        
        for (line_num, line) in data_content.lines().enumerate() {
            if line.trim().is_empty() || line.starts_with('#') {
                continue;
            }
            
            match self.parse_telemetry_line(line) {
                Ok(msg) => messages.push(msg),
                Err(e) => {
                    // Log warning but continue parsing
                    info!("Warning: Failed to parse line {}: {} ({})", line_num + 1, e, line);
                }
            }
        }
        
        info!("Parsed {} telemetry messages from {:?}", messages.len(), data_path);
        Ok(messages)
    }

    /// Extract an attribute value from XML content
    fn extract_attribute(&self, xml_content: &str, attr_name: &str) -> Result<String> {
        let pattern = format!(r#"{}="([^"]*)""#, attr_name);
        let re = regex::Regex::new(&pattern)
            .map_err(|e| anyhow!("Invalid regex pattern: {}", e))?;
        
        let captures = re.captures(xml_content)
            .ok_or_else(|| anyhow!("Attribute '{}' not found", attr_name))?;
        
        Ok(captures[1].to_string())
    }

    /// Parse a single telemetry message line
    fn parse_telemetry_line(&self, line: &str) -> Result<TelemetryMessage> {
        // PaparazziUAV telemetry format: (timestamp sender_id MESSAGE_NAME field1 field2 ...)
        let trimmed = line.trim();
        
        // Remove parentheses if present
        let content = if trimmed.starts_with('(') && trimmed.ends_with(')') {
            &trimmed[1..trimmed.len()-1]
        } else {
            trimmed
        };
        
        let parts: Vec<&str> = content.split_whitespace().collect();
        
        if parts.len() < 3 {
            return Err(anyhow!("Invalid telemetry line format: too few fields"));
        }
        
        let timestamp = parts[0].parse::<f64>()
            .map_err(|_| anyhow!("Invalid timestamp format"))?;
        
        let sender_id = parts[1].parse::<u8>()
            .map_err(|_| anyhow!("Invalid sender_id format"))?;
        
        // Message name is the third field (string, not numeric ID)
        let message_name = parts[2].to_string();
        
        // Generate a consistent numeric ID from the message name for compatibility
        let message_id = {
            let mut hash: u32 = 0;
            for byte in message_name.bytes() {
                hash = hash.wrapping_mul(31).wrapping_add(byte as u32);
            }
            (hash % 256) as u8  // Keep it within u8 range
        };
        
        let mut fields = HashMap::new();
        for (i, field) in parts.iter().skip(3).enumerate() {
            fields.insert(format!("field_{}", i), field.to_string());
        }
        
        Ok(TelemetryMessage {
            timestamp,
            sender_id,
            message_id,
            message_name,
            fields,
        })
    }
}
