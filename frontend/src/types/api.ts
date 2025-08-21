// API Response Types based on backend analysis

export enum TimeFormat {
  TWELVE_HOUR = '12h',
  TWENTY_FOUR_HOUR = '24h'
}

export interface AnalysisSessionResponse {
  id: string;
  file_id?: string;
  template_id?: string;
  session_name?: string;
  session_config: {
    file_ids?: string[];
    base_filename?: string;
    auto_created?: boolean;
    created_at?: string;
    // Additional config fields
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface LogFileInfo {
  id: string;
  original_filename: string;
  file_size: number;
  upload_timestamp: string;
  processing_status: string; // 'pending' | 'processing' | 'completed' | 'failed'
  content_type: string;
  is_processed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

// Mock data types for dashboard (until backend processing is implemented)
export interface SessionStatistics {
  aircraft_count: number;
  message_count: number;
  duration_seconds: number;
  message_types: number;
  file_size: number;
}

// Telemetry data types (TODO: Move to backend when API is implemented)
export interface TelemetryMessage {
  timestamp: number;
  aircraft_id: number;
  message_type: string;
  data: Record<string, unknown>;
}

export interface FlightSummary {
  session_id: string;
  aircraft_id: number;
  duration: number; // seconds
  start_time: string;
  end_time: string;
  max_altitude: number; // meters
  max_speed: number; // m/s
  total_distance: number; // meters
  battery_usage: number; // percentage
  message_count: number;
}

export interface GPSTrajectory {
  aircraft_id: number;
  points: GPSPoint[];
}

export interface GPSPoint {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export interface FlightAlert {
  id: string;
  timestamp: number;
  aircraft_id: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: string;
}

export interface AircraftInfo {
  id: number;
  name: string;
  message_count: number;
  status: 'active' | 'inactive';
}

export interface MessageTypeInfo {
  type: string;
  count: number;
  last_seen: string;
}
