'use client';

import { LineChart } from '@/components/charts/line-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlightSummary } from '@/types/api';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface ChartsTabProps {
  sessionId: string;
  flightSummary?: FlightSummary;
}

// Mock telemetry time series data - TODO: Replace with real API calls
const mockTelemetryData = [
  { timestamp: 0, altitude: 100, speed: 0, battery: 100, gps_satellites: 8, temperature: 25 },
  { timestamp: 30, altitude: 120, speed: 8, battery: 98, gps_satellites: 9, temperature: 24 },
  { timestamp: 60, altitude: 140, speed: 12, battery: 95, gps_satellites: 10, temperature: 22 },
  { timestamp: 90, altitude: 150, speed: 15, battery: 92, gps_satellites: 11, temperature: 20 },
  { timestamp: 120, altitude: 145, speed: 14, battery: 88, gps_satellites: 10, temperature: 18 },
  { timestamp: 150, altitude: 135, speed: 12, battery: 85, gps_satellites: 9, temperature: 16 },
  { timestamp: 180, altitude: 125, speed: 10, battery: 82, gps_satellites: 8, temperature: 18 },
  { timestamp: 210, altitude: 115, speed: 8, battery: 78, gps_satellites: 9, temperature: 20 },
  { timestamp: 240, altitude: 105, speed: 5, battery: 75, gps_satellites: 10, temperature: 22 },
  { timestamp: 270, altitude: 100, speed: 2, battery: 73, gps_satellites: 8, temperature: 24 },
];

const mockIMUData = [
  { timestamp: 0, accel_x: 0.1, accel_y: 0.0, accel_z: 9.8, gyro_x: 0.0, gyro_y: 0.0, gyro_z: 0.0 },
  { timestamp: 30, accel_x: 1.2, accel_y: 0.3, accel_z: 9.9, gyro_x: 5.2, gyro_y: 1.1, gyro_z: 0.5 },
  { timestamp: 60, accel_x: 2.1, accel_y: 0.8, accel_z: 10.1, gyro_x: 8.4, gyro_y: 2.3, gyro_z: 1.2 },
  { timestamp: 90, accel_x: 1.8, accel_y: 1.2, accel_z: 10.2, gyro_x: 6.1, gyro_y: 3.1, gyro_z: 0.8 },
  { timestamp: 120, accel_x: 1.5, accel_y: 0.9, accel_z: 10.0, gyro_x: 4.2, gyro_y: 2.8, gyro_z: 0.6 },
  { timestamp: 150, accel_x: 1.2, accel_y: 0.6, accel_z: 9.9, gyro_x: 3.1, gyro_y: 2.2, gyro_z: 0.4 },
  { timestamp: 180, accel_x: 0.9, accel_y: 0.4, accel_z: 9.8, gyro_x: 2.5, gyro_y: 1.8, gyro_z: 0.3 },
  { timestamp: 210, accel_x: 0.6, accel_y: 0.2, accel_z: 9.8, gyro_x: 1.8, gyro_y: 1.2, gyro_z: 0.2 },
  { timestamp: 240, accel_x: 0.3, accel_y: 0.1, accel_z: 9.8, gyro_x: 1.2, gyro_y: 0.8, gyro_z: 0.1 },
  { timestamp: 270, accel_x: 0.1, accel_y: 0.0, accel_z: 9.8, gyro_x: 0.5, gyro_y: 0.2, gyro_z: 0.0 },
];

export default function ChartsTab({ sessionId, flightSummary }: ChartsTabProps) {
  if (!flightSummary) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No telemetry data available</h3>
          <p className="text-gray-600">Charts will appear here once telemetry data is processed</p>
          <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Flight Data Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Altitude & Speed Profile"
          description="Primary flight parameters over time"
          data={mockTelemetryData}
          dataKeys={['altitude', 'speed']}
          xAxisKey="timestamp"
          height={350}
        />
        
        <LineChart
          title="Battery & Temperature"
          description="System monitoring parameters"
          data={mockTelemetryData}
          dataKeys={['battery', 'temperature']}
          xAxisKey="timestamp"
          height={350}
        />
      </div>

      {/* GPS & Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            GPS & Navigation Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            title="GPS Quality"
            description="GPS satellite count and signal quality over time"
            data={mockTelemetryData}
            dataKeys={['gps_satellites']}
            xAxisKey="timestamp"
            height={300}
          />
        </CardContent>
      </Card>

      {/* IMU Sensor Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            IMU Sensor Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              title="Accelerometer Data"
              description="3-axis acceleration measurements (m/s²)"
              data={mockIMUData}
              dataKeys={['accel_x', 'accel_y', 'accel_z']}
              xAxisKey="timestamp"
              height={300}
            />
            
            <LineChart
              title="Gyroscope Data"
              description="3-axis angular velocity measurements (rad/s)"
              data={mockIMUData}
              dataKeys={['gyro_x', 'gyro_y', 'gyro_z']}
              xAxisKey="timestamp"
              height={300}
            />
          </div>
        </CardContent>
      </Card>

      {/* Complete Telemetry Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Flight Telemetry</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            title="All Flight Parameters"
            description="Comprehensive view of all telemetry data"
            data={mockTelemetryData}
            dataKeys={['altitude', 'speed', 'battery', 'temperature']}
            xAxisKey="timestamp"
            height={400}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Chart Data:</span> Currently showing mock telemetry data. 
              Real-time telemetry parsing will provide actual flight data from PaparazziUAV log files.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Session: {sessionId} | Data Points: {mockTelemetryData.length} | Duration: {Math.max(...mockTelemetryData.map(d => d.timestamp))}s
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
