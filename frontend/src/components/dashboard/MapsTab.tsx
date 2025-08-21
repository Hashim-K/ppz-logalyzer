'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GPSTrajectory } from '@/types/api';
import { MapPin, Navigation, Compass, Route } from 'lucide-react';

interface MapsTabProps {
  sessionId: string;
  trajectory?: GPSTrajectory | null;
}

// Mock waypoints data - TODO: Replace with real API calls
const mockWaypoints = [
  { id: 1, name: 'Takeoff', lat: 52.5200, lon: 13.4050, altitude: 100, type: 'takeoff' },
  { id: 2, name: 'WP1', lat: 52.5210, lon: 13.4060, altitude: 120, type: 'waypoint' },
  { id: 3, name: 'WP2', lat: 52.5220, lon: 13.4070, altitude: 140, type: 'waypoint' },
  { id: 4, name: 'WP3', lat: 52.5230, lon: 13.4080, altitude: 150, type: 'waypoint' },
  { id: 5, name: 'Landing', lat: 52.5260, lon: 13.4110, altitude: 100, type: 'landing' },
];

const mockGeofences = [
  {
    id: 1,
    name: 'Flight Zone',
    type: 'allowed',
    bounds: {
      north: 52.5300,
      south: 52.5150,
      east: 13.4150,
      west: 13.4000,
    },
  },
  {
    id: 2,
    name: 'Airport Restricted',
    type: 'restricted',
    bounds: {
      north: 52.5180,
      south: 52.5120,
      east: 13.4080,
      west: 13.4020,
    },
  },
];

export default function MapsTab({ sessionId, trajectory }: MapsTabProps) {
  if (!trajectory) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No GPS data available</h3>
          <p className="text-gray-600">GPS trajectory and waypoint data will appear here once processed</p>
          <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
        </CardContent>
      </Card>
    );
  }

  const startPoint = trajectory.points[0];
  const endPoint = trajectory.points[trajectory.points.length - 1];
  const maxAltitudePoint = trajectory.points.reduce((max, point) => 
    point.altitude > max.altitude ? point : max
  );

  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Flight Trajectory Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Simple trajectory visualization */}
            <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="relative h-full w-full">
                {/* Start point */}
                <div className="absolute top-4 left-4 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg">
                  <div className="absolute -top-8 -left-2 text-xs font-medium text-green-700">START</div>
                </div>
                
                {/* Trajectory line approximation */}
                <div className="absolute top-6 left-6 w-64 h-48 border-2 border-blue-400 border-dashed rounded-lg transform rotate-12">
                </div>
                
                {/* End point */}
                <div className="absolute bottom-8 right-8 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg">
                  <div className="absolute -top-8 -left-2 text-xs font-medium text-red-700">LAND</div>
                </div>
                
                {/* Max altitude marker */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-lg">
                  <div className="absolute -top-8 -left-4 text-xs font-medium text-yellow-700">MAX ALT</div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-gray-600 z-10">
              <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Interactive Map Coming Soon</p>
              <p className="text-sm">Real map integration will be implemented with the backend API</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Start: {startPoint.latitude.toFixed(4)}, {startPoint.longitude.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Max Alt: {maxAltitudePoint.altitude}m</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>End: {endPoint.latitude.toFixed(4)}, {endPoint.longitude.toFixed(4)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trajectory Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Trajectory Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-bold">{trajectory.points.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aircraft ID</p>
                <p className="text-2xl font-bold">AC-{trajectory.aircraft_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Start Position</p>
                <p className="text-sm">
                  {startPoint.latitude.toFixed(6)}<br/>
                  {startPoint.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Position</p>
                <p className="text-sm">
                  {endPoint.latitude.toFixed(6)}<br/>
                  {endPoint.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              Altitude Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Min Altitude</p>
                  <p className="text-xl font-bold text-green-600">
                    {Math.min(...trajectory.points.map(p => p.altitude))}m
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Max Altitude</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Math.max(...trajectory.points.map(p => p.altitude))}m
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Altitude</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.round(trajectory.points.reduce((sum, p) => sum + p.altitude, 0) / trajectory.points.length)}m
                  </p>
                </div>
              </div>
              
              {/* Simple altitude profile visualization */}
              <div className="h-24 bg-gray-100 rounded-lg p-2">
                <div className="h-full flex items-end justify-between">
                  {trajectory.points.map((point, index) => {
                    const maxAlt = Math.max(...trajectory.points.map(p => p.altitude));
                    const minAlt = Math.min(...trajectory.points.map(p => p.altitude));
                    const normalizedHeight = ((point.altitude - minAlt) / (maxAlt - minAlt)) * 100;
                    
                    return (
                      <div
                        key={index}
                        className="bg-blue-500 w-1 rounded-t"
                        style={{ height: `${Math.max(5, normalizedHeight)}%` }}
                        title={`${point.altitude}m at ${new Date(point.timestamp).toLocaleTimeString()}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waypoints and Geofences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Flight Waypoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockWaypoints.map((waypoint) => (
                <div key={waypoint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={waypoint.type === 'takeoff' ? 'default' : 
                              waypoint.type === 'landing' ? 'destructive' : 'secondary'}
                    >
                      {waypoint.name}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {waypoint.lat.toFixed(4)}, {waypoint.lon.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-600">Alt: {waypoint.altitude}m</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Waypoints are currently mocked. Real waypoint data will be extracted from flight plans.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geofences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockGeofences.map((geofence) => (
                <div key={geofence.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{geofence.name}</h4>
                    <Badge 
                      variant={geofence.type === 'allowed' ? 'default' : 'destructive'}
                    >
                      {geofence.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>N: {geofence.bounds.north.toFixed(4)} | S: {geofence.bounds.south.toFixed(4)}</p>
                    <p>E: {geofence.bounds.east.toFixed(4)} | W: {geofence.bounds.west.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Geofences are currently mocked. Real geofence data will be loaded from flight configurations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
