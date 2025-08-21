'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, MapPin, BarChart3 } from 'lucide-react';
import { AnalysisSessionResponse, FlightSummary, FlightAlert, GPSTrajectory } from '@/types/api';
import FlightDataTab from '@/components/dashboard/FlightDataTab';
import ChartsTab from '@/components/dashboard/ChartsTab';
import GraphBuilderTab from '@/components/dashboard/GraphBuilderTab';
import MapsTab from '@/components/dashboard/MapsTab';
import AlertsTab from '@/components/dashboard/AlertsTab';

// Mock data until backend is ready - TODO: Replace with real API calls
const mockSessions: AnalysisSessionResponse[] = [
  {
    id: '1',
    session_name: 'Morning Flight Test - AC1',
    session_config: {
      file_ids: ['file1', 'file2'],
      base_filename: '25_08_21__09_15_30',
      auto_created: true,
    },
    created_at: '2025-08-21T09:15:30Z',
    updated_at: '2025-08-21T09:45:30Z',
    last_accessed: '2025-08-21T10:00:00Z',
  },
  {
    id: '2',
    session_name: 'Afternoon Survey Mission',
    session_config: {
      file_ids: ['file3', 'file4'],
      base_filename: '25_08_21__14_30_15',
      auto_created: true,
    },
    created_at: '2025-08-21T14:30:15Z',
    updated_at: '2025-08-21T15:15:20Z',
    last_accessed: '2025-08-21T15:30:00Z',
  },
];

const mockFlightSummary: FlightSummary[] = [
  {
    session_id: '1',
    aircraft_id: 1,
    duration: 1800, // 30 minutes
    start_time: '2025-08-21T09:15:30Z',
    end_time: '2025-08-21T09:45:30Z',
    max_altitude: 150,
    max_speed: 15.2,
    total_distance: 2340,
    battery_usage: 45,
    message_count: 1250,
  },
];

const mockAlerts: FlightAlert[] = [
  {
    id: '1',
    timestamp: Date.now() - 600000, // 10 minutes ago
    aircraft_id: 1,
    severity: 'warning',
    message: 'Low battery warning',
    details: 'Battery level dropped below 30%',
  },
  {
    id: '2',
    timestamp: Date.now() - 1200000, // 20 minutes ago
    aircraft_id: 1,
    severity: 'info',
    message: 'GPS fix acquired',
    details: '3D GPS fix with 8 satellites',
  },
];

const mockTrajectory: GPSTrajectory = {
  aircraft_id: 1,
  points: [
    { timestamp: Date.now() - 1800000, latitude: 52.5200, longitude: 13.4050, altitude: 100, speed: 0 },
    { timestamp: Date.now() - 1500000, latitude: 52.5210, longitude: 13.4060, altitude: 120, speed: 12 },
    { timestamp: Date.now() - 1200000, latitude: 52.5220, longitude: 13.4070, altitude: 140, speed: 15 },
    { timestamp: Date.now() - 900000, latitude: 52.5230, longitude: 13.4080, altitude: 150, speed: 14 },
    { timestamp: Date.now() - 600000, latitude: 52.5240, longitude: 13.4090, altitude: 130, speed: 13 },
    { timestamp: Date.now() - 300000, latitude: 52.5250, longitude: 13.4100, altitude: 110, speed: 10 },
    { timestamp: Date.now(), latitude: 52.5260, longitude: 13.4110, altitude: 100, speed: 0 },
  ],
};

export default function DashboardPage() {
  const [sessions, setSessions] = useState<AnalysisSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [flightSummary, setFlightSummary] = useState<FlightSummary[]>([]);
  const [alerts, setAlerts] = useState<FlightAlert[]>([]);
  const [trajectory, setTrajectory] = useState<GPSTrajectory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API calls when backend is ready
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSessions(mockSessions);
        if (mockSessions.length > 0) {
          setSelectedSession(mockSessions[0].id);
        }
        
        setFlightSummary(mockFlightSummary);
        setAlerts(mockAlerts);
        setTrajectory(mockTrajectory);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const selectedSessionData = sessions.find(s => s.id === selectedSession);
  const selectedFlightSummary = flightSummary.find(f => f.session_id === selectedSession);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flight Analysis Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time telemetry and performance monitoring</p>
        </div>
        
        {/* Session Selector */}
        <div className="min-w-[300px]">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="Select analysis session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{session.session_name || 'Unnamed Session'}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedSession && (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No session selected</h3>
            <p className="text-gray-600">Select an analysis session to view flight data and telemetry</p>
          </CardContent>
        </Card>
      )}

      {selectedSession && selectedSessionData && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flight Duration</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedFlightSummary ? `${Math.floor(selectedFlightSummary.duration / 60)}m ${selectedFlightSummary.duration % 60}s` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total flight time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Altitude</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedFlightSummary ? `${selectedFlightSummary.max_altitude}m` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Above ground level
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distance Traveled</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedFlightSummary ? `${(selectedFlightSummary.total_distance / 1000).toFixed(1)}km` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total distance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.filter(a => a.severity !== 'info').length}</div>
                <div className="flex gap-1 mt-2">
                  {alerts.filter(a => a.severity === 'critical').length > 0 && (
                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                  )}
                  {alerts.filter(a => a.severity === 'warning').length > 0 && (
                    <Badge variant="secondary" className="text-xs">Warning</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="flight-data" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="flight-data">Flight Data</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="graph-builder">Graph Builder</TabsTrigger>
              <TabsTrigger value="maps">Maps</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="flight-data">
              <FlightDataTab
                sessionId={selectedSession}
                flightSummary={selectedFlightSummary}
                // TODO: Add more flight data props when backend is ready
              />
            </TabsContent>

            <TabsContent value="charts">
              <ChartsTab
                sessionId={selectedSession}
                flightSummary={selectedFlightSummary}
                // TODO: Add telemetry data when backend is ready
              />
            </TabsContent>

            <TabsContent value="graph-builder">
              <GraphBuilderTab
                sessionId={selectedSession}
                flightSummary={selectedFlightSummary}
                // TODO: Add real telemetry data for graph builder
              />
            </TabsContent>

            <TabsContent value="maps">
              <MapsTab
                sessionId={selectedSession}
                trajectory={trajectory}
                // TODO: Add waypoints, geofences when backend is ready
              />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsTab
                sessionId={selectedSession}
                alerts={alerts}
                // TODO: Add alert management when backend is ready
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
