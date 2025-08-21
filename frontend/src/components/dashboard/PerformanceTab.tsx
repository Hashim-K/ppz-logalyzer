'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PerformanceMetric } from '@/types/api';
import { TrendingUp, Zap, Gauge, Activity } from 'lucide-react';

interface PerformanceTabProps {
  sessionId: string;
  metrics: PerformanceMetric[];
}

// Mock performance data - TODO: Replace with real API calls
const mockChartData = {
  speed: [
    { time: '09:15', value: 0 },
    { time: '09:20', value: 8 },
    { time: '09:25', value: 12 },
    { time: '09:30', value: 15 },
    { time: '09:35', value: 14 },
    { time: '09:40', value: 10 },
    { time: '09:45', value: 0 },
  ],
  altitude: [
    { time: '09:15', value: 100 },
    { time: '09:20', value: 120 },
    { time: '09:25', value: 140 },
    { time: '09:30', value: 150 },
    { time: '09:35', value: 130 },
    { time: '09:40', value: 110 },
    { time: '09:45', value: 100 },
  ],
  battery: [
    { time: '09:15', value: 100 },
    { time: '09:20', value: 92 },
    { time: '09:25', value: 78 },
    { time: '09:30', value: 65 },
    { time: '09:35', value: 58 },
    { time: '09:40', value: 52 },
    { time: '09:45', value: 55 },
  ],
};

const mockSystemHealth = [
  { component: 'GPS', status: 'good', value: 95, details: '8 satellites, 3D fix' },
  { component: 'IMU', status: 'good', value: 98, details: 'All sensors operational' },
  { component: 'Radio Link', status: 'warning', value: 72, details: 'Signal strength variable' },
  { component: 'Battery', status: 'good', value: 85, details: 'Normal discharge rate' },
  { component: 'Autopilot', status: 'good', value: 100, details: 'All systems nominal' },
];

export default function PerformanceTab({ metrics }: PerformanceTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <Badge variant={getStatusBadge(metric.status)}>
                {metric.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <Progress 
                value={metric.status === 'good' ? 85 : metric.status === 'warning' ? 60 : 30} 
                className="mt-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Speed Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {mockChartData.speed.map((point, index) => {
                const maxSpeed = Math.max(...mockChartData.speed.map(p => p.value));
                const height = (point.value / maxSpeed) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-blue-500 w-8 rounded-t"
                      style={{ height: `${Math.max(4, height * 1.6)}px` }}
                      title={`${point.value} m/s at ${point.time}`}
                    />
                    <span className="text-xs text-gray-600 rotate-45">{point.time}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Max Speed: <span className="font-bold">15 m/s</span> | 
                Avg Speed: <span className="font-bold">9.9 m/s</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Altitude Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {mockChartData.altitude.map((point, index) => {
                const maxAlt = Math.max(...mockChartData.altitude.map(p => p.value));
                const minAlt = Math.min(...mockChartData.altitude.map(p => p.value));
                const height = ((point.value - minAlt) / (maxAlt - minAlt)) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-green-500 w-8 rounded-t"
                      style={{ height: `${Math.max(8, height * 1.6)}px` }}
                      title={`${point.value}m at ${point.time}`}
                    />
                    <span className="text-xs text-gray-600 rotate-45">{point.time}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Max Altitude: <span className="font-bold">150m</span> | 
                Avg Altitude: <span className="font-bold">124m</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battery Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Battery Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 flex items-end justify-between gap-2">
              {mockChartData.battery.map((point, index) => {
                const height = point.value;
                const color = point.value > 70 ? 'bg-green-500' : 
                             point.value > 30 ? 'bg-yellow-500' : 'bg-red-500';
                
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className={`${color} w-8 rounded-t`}
                      style={{ height: `${height * 1.2}px` }}
                      title={`${point.value}% at ${point.time}`}
                    />
                    <span className="text-xs text-gray-600 rotate-45">{point.time}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Start Level</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">End Level</p>
                <p className="text-2xl font-bold text-yellow-600">55%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Usage Rate</p>
                <p className="text-2xl font-bold text-blue-600">1.5%/min</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Est. Remaining</p>
                <p className="text-2xl font-bold text-purple-600">37min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSystemHealth.map((system, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="min-w-0">
                    <h4 className="font-medium">{system.component}</h4>
                    <p className="text-sm text-gray-600">{system.details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getStatusColor(system.status)}`}>
                      {system.value}%
                    </div>
                    <Badge variant={getStatusBadge(system.status)}>
                      {system.status}
                    </Badge>
                  </div>
                  <div className="w-16">
                    <Progress value={system.value} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Overall System Health:</span> 90% - All critical systems operational
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Note: Performance data is currently mocked. Real telemetry analysis will provide accurate metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
