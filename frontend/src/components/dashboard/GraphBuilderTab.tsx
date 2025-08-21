'use client';

import { ChartBuilder } from '@/components/charts/chart-builder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlightSummary } from '@/types/api';
import { Settings, Save, Share2, Download } from 'lucide-react';

interface GraphBuilderTabProps {
  sessionId: string;
  flightSummary?: FlightSummary;
}

// Mock telemetry data for graph builder - TODO: Replace with real API calls
const mockGraphData = [
  { timestamp: 0, altitude: 100, speed: 0, battery: 100, gps_sats: 8, temp: 25, accel_x: 0.1, accel_y: 0.0, accel_z: 9.8, gyro_x: 0.0, roll: 0, pitch: 0, yaw: 0 },
  { timestamp: 30, altitude: 120, speed: 8, battery: 98, gps_sats: 9, temp: 24, accel_x: 1.2, accel_y: 0.3, accel_z: 9.9, gyro_x: 5.2, roll: 2, pitch: -1, yaw: 5 },
  { timestamp: 60, altitude: 140, speed: 12, battery: 95, gps_sats: 10, temp: 22, accel_x: 2.1, accel_y: 0.8, accel_z: 10.1, gyro_x: 8.4, roll: 5, pitch: -3, yaw: 12 },
  { timestamp: 90, altitude: 150, speed: 15, battery: 92, gps_sats: 11, temp: 20, accel_x: 1.8, accel_y: 1.2, accel_z: 10.2, gyro_x: 6.1, roll: 8, pitch: -5, yaw: 18 },
  { timestamp: 120, altitude: 145, speed: 14, battery: 88, gps_sats: 10, temp: 18, accel_x: 1.5, accel_y: 0.9, accel_z: 10.0, gyro_x: 4.2, roll: 6, pitch: -3, yaw: 15 },
  { timestamp: 150, altitude: 135, speed: 12, battery: 85, gps_sats: 9, temp: 16, accel_x: 1.2, accel_y: 0.6, accel_z: 9.9, gyro_x: 3.1, roll: 4, pitch: -2, yaw: 12 },
  { timestamp: 180, altitude: 125, speed: 10, battery: 82, gps_sats: 8, temp: 18, accel_x: 0.9, accel_y: 0.4, accel_z: 9.8, gyro_x: 2.5, roll: 2, pitch: -1, yaw: 8 },
  { timestamp: 210, altitude: 115, speed: 8, battery: 78, gps_sats: 9, temp: 20, accel_x: 0.6, accel_y: 0.2, accel_z: 9.8, gyro_x: 1.8, roll: 1, pitch: 0, yaw: 5 },
  { timestamp: 240, altitude: 105, speed: 5, battery: 75, gps_sats: 10, temp: 22, accel_x: 0.3, accel_y: 0.1, accel_z: 9.8, gyro_x: 1.2, roll: 0, pitch: 1, yaw: 2 },
  { timestamp: 270, altitude: 100, speed: 2, battery: 73, gps_sats: 8, temp: 24, accel_x: 0.1, accel_y: 0.0, accel_z: 9.8, gyro_x: 0.5, roll: 0, pitch: 0, yaw: 0 },
];

const availableDataFields = [
  'timestamp', 'altitude', 'speed', 'battery', 'gps_sats', 'temp', 
  'accel_x', 'accel_y', 'accel_z', 'gyro_x', 'roll', 'pitch', 'yaw'
];

// Mock saved chart templates - TODO: Connect to backend storage
const mockChartTemplates = [
  {
    id: 1,
    name: 'Flight Performance',
    description: 'Standard altitude, speed, and battery monitoring',
    dataKeys: ['altitude', 'speed', 'battery'],
    xAxisKey: 'timestamp'
  },
  {
    id: 2,
    name: 'IMU Analysis',
    description: 'Accelerometer and gyroscope data analysis',
    dataKeys: ['accel_x', 'accel_y', 'accel_z', 'gyro_x'],
    xAxisKey: 'timestamp'
  },
  {
    id: 3,
    name: 'Attitude Monitor',
    description: 'Aircraft attitude (roll, pitch, yaw) over time',
    dataKeys: ['roll', 'pitch', 'yaw'],
    xAxisKey: 'timestamp'
  },
  {
    id: 4,
    name: 'System Health',
    description: 'Battery, temperature, and GPS status',
    dataKeys: ['battery', 'temp', 'gps_sats'],
    xAxisKey: 'timestamp'
  }
];

export default function GraphBuilderTab({ sessionId, flightSummary }: GraphBuilderTabProps) {
  if (!flightSummary) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No data available for graph builder</h3>
          <p className="text-gray-600">Graph builder will be available once telemetry data is processed</p>
          <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Chart Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockChartTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="outline">{template.dataKeys.length} series</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {template.dataKeys.slice(0, 3).map((key) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}
                    </Badge>
                  ))}
                  {template.dataKeys.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.dataKeys.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Import Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Chart Builder */}
      <ChartBuilder 
        data={mockGraphData}
        availableKeys={availableDataFields}
      />

      {/* Chart Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save Chart
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Chart
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export SVG
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data (CSV)
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">Interactive Graph Builder:</span> Create custom visualizations by selecting data fields, 
              configuring chart options, and applying templates. All charts are interactive and exportable.
            </p>
            <p className="text-xs text-green-600 mt-1">
              Available Data Fields: {availableDataFields.length} | 
              Templates: {mockChartTemplates.length} | 
              Data Points: {mockGraphData.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Field Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Data Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableDataFields.map((field) => (
              <div key={field} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Badge variant="outline" className="text-xs">{field}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><span className="font-medium">Note:</span> Data fields shown are mock data. 
            Real telemetry will include all PaparazziUAV message types and custom fields.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
