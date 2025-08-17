// Mock data for processed logs - replace with real data later
export interface ProcessedLog {
  id: string
  filename: string
  uploadDate: Date
  status: "processing" | "completed" | "error"
  fileSize: number
  recordCount?: number
  flightDuration?: number
  maxAltitude?: number
  maxSpeed?: number
  error?: string
}

export const mockLogs: ProcessedLog[] = [
  {
    id: "log_001",
    filename: "flight_session_2024_001.log",
    uploadDate: new Date("2024-03-15T10:30:00"),
    status: "completed",
    fileSize: 2.4 * 1024 * 1024, // 2.4MB
    recordCount: 1420,
    flightDuration: 140, // seconds
    maxAltitude: 140,
    maxSpeed: 30
  },
  {
    id: "log_002", 
    filename: "test_hover_mission.csv",
    uploadDate: new Date("2024-03-14T15:45:00"),
    status: "completed",
    fileSize: 856 * 1024, // 856KB
    recordCount: 890,
    flightDuration: 89,
    maxAltitude: 25,
    maxSpeed: 8
  },
  {
    id: "log_003",
    filename: "autonomous_waypoint_flight.log",
    uploadDate: new Date("2024-03-13T09:15:00"),
    status: "processing",
    fileSize: 3.2 * 1024 * 1024, // 3.2MB
  },
  {
    id: "log_004",
    filename: "corrupted_telemetry.log",
    uploadDate: new Date("2024-03-12T14:20:00"),
    status: "error",
    fileSize: 1.1 * 1024 * 1024, // 1.1MB
    error: "Invalid telemetry format detected"
  }
]

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`
}
