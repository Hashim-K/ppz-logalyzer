'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FlightSummary } from '@/types/api';
import { Plane, Battery, Clock, Gauge } from 'lucide-react';

interface FlightDataTabProps {
  sessionId: string;
  flightSummary?: FlightSummary;
}

// Mock telemetry data - TODO: Replace with real API calls
const mockTelemetryStats = {
  gpsMessages: 450,
  imuMessages: 1800,
  attitudeMessages: 900,
  batteryMessages: 90,
  totalMessages: 3240,
  dataRate: 5.2, // messages per second
};

const mockFlightPhases = [
  { name: 'Pre-flight', duration: 120, color: 'bg-gray-500' },
  { name: 'Takeoff', duration: 45, color: 'bg-green-500' },
  { name: 'Cruise', duration: 1200, color: 'bg-blue-500' },
  { name: 'Landing', duration: 60, color: 'bg-orange-500' },
  { name: 'Post-flight', duration: 90, color: 'bg-gray-500' },
];

export default function FlightDataTab({ sessionId, flightSummary }: FlightDataTabProps) {
  if (!flightSummary) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No flight data available</h3>
          <p className="text-gray-600">Flight data will appear here once telemetry is processed</p>
          <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
        </CardContent>
      </Card>
    );
  }

  const totalDuration = mockFlightPhases.reduce((sum, phase) => sum + phase.duration, 0);

  return (
    <div className="space-y-6">
      {/* Flight Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Aircraft ID</p>
                <p className="text-2xl font-bold">AC-{flightSummary.aircraft_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Flight Duration</p>
                <p className="text-2xl font-bold">
                  {Math.floor(flightSummary.duration / 60)}m {flightSummary.duration % 60}s
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Start Time</p>
                <p className="text-lg">{new Date(flightSummary.start_time).toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Time</p>
                <p className="text-lg">{new Date(flightSummary.end_time).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="h-5 w-5" />
              Battery Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Battery Usage</span>
                <span className="text-sm text-gray-600">{flightSummary.battery_usage}%</span>
              </div>
              <Progress value={flightSummary.battery_usage} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  {100 - flightSummary.battery_usage}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge 
                  variant={flightSummary.battery_usage > 70 ? "destructive" : 
                          flightSummary.battery_usage > 30 ? "secondary" : "default"}
                  className="mt-1"
                >
                  {flightSummary.battery_usage > 70 ? "Critical" : 
                   flightSummary.battery_usage > 30 ? "Warning" : "Good"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flight Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Flight Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Max Speed</p>
              <p className="text-3xl font-bold text-blue-600">{flightSummary.max_speed.toFixed(1)}</p>
              <p className="text-sm text-gray-500">m/s</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Max Altitude</p>
              <p className="text-3xl font-bold text-green-600">{flightSummary.max_altitude}</p>
              <p className="text-sm text-gray-500">meters</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Distance</p>
              <p className="text-3xl font-bold text-purple-600">
                {(flightSummary.total_distance / 1000).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">km</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Avg Speed</p>
              <p className="text-3xl font-bold text-orange-600">
                {(flightSummary.total_distance / flightSummary.duration).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">m/s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flight Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Flight Phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
              {mockFlightPhases.map((phase, index) => (
                <div
                  key={index}
                  className={phase.color}
                  style={{ width: `${(phase.duration / totalDuration) * 100}%` }}
                  title={`${phase.name}: ${phase.duration}s`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {mockFlightPhases.map((phase, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                  <div>
                    <p className="text-sm font-medium">{phase.name}</p>
                    <p className="text-xs text-gray-600">{phase.duration}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Telemetry Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">GPS Messages</p>
              <p className="text-2xl font-bold text-blue-600">{mockTelemetryStats.gpsMessages}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">IMU Messages</p>
              <p className="text-2xl font-bold text-green-600">{mockTelemetryStats.imuMessages}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Attitude</p>
              <p className="text-2xl font-bold text-purple-600">{mockTelemetryStats.attitudeMessages}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Battery</p>
              <p className="text-2xl font-bold text-orange-600">{mockTelemetryStats.batteryMessages}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Data Rate</p>
              <p className="text-2xl font-bold text-red-600">{mockTelemetryStats.dataRate}</p>
              <p className="text-xs text-gray-500">msg/sec</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Messages:</span> {mockTelemetryStats.totalMessages.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Note: This data is currently mocked. Real telemetry parsing will be implemented in the backend API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
