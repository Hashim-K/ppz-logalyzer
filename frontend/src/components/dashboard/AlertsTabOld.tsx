'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlightAlert } from '@/types/api';
import { AlertTriangle, Info, AlertCircle, XCircle, Clock, Settings, Bell, History } from 'lucide-react';
import AlertBuilder, { AlertRule } from './AlertBuilder';

interface AlertsTabProps {
  sessionId: string;
  alerts: FlightAlert[];
}

// Mock alert categories and stats - TODO: Replace with real API calls
const mockAlertStats = {
  total: 12,
  critical: 1,
  error: 2,
  warning: 4,
  info: 5,
  resolved: 8,
  active: 4,
};

const mockAlertRules = [
  { name: 'Low Battery', threshold: '< 20%', enabled: true },
  { name: 'High Altitude', threshold: '> 200m', enabled: true },
  { name: 'GPS Signal Loss', threshold: '< 4 satellites', enabled: true },
  { name: 'High Speed', threshold: '> 20 m/s', enabled: false },
  { name: 'Geofence Violation', threshold: 'Outside bounds', enabled: true },
];

export default function AlertsTab({ sessionId, alerts }: AlertsTabProps) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'Low Battery Warning',
      field: 'battery_percentage',
      operator: 'lt',
      value: 20,
      severity: 'warning',
      message: 'Low battery detected',
      description: 'Triggers when battery drops below 20%',
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'GPS Signal Loss',
      field: 'gps_satellites',
      operator: 'lt',
      value: 4,
      severity: 'error',
      message: 'GPS signal degraded',
      description: 'Triggers when GPS satellites below 4',
      enabled: true,
      created_at: new Date().toISOString(),
    },
  ]);

  const handleSaveRule = (rule: AlertRule) => {
    setAlertRules(prev => [...prev, rule]);
  };

  const handleDeleteRule = (ruleId: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ));
  };
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'error': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlertStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {mockAlertStats.active} active, {mockAlertStats.resolved} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockAlertStats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mockAlertStats.warning}</div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mockAlertStats.info}</div>
            <p className="text-xs text-muted-foreground">
              System notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts for this session</h3>
              <p className="text-gray-600">Flight appears to have completed without issues</p>
              <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{alert.message}</h4>
                      <Badge variant={getSeverityBadge(alert.severity) as "default" | "destructive" | "outline" | "secondary"}>
                        {alert.severity}
                      </Badge>
                    </div>
                    {alert.details && (
                      <p className="text-sm text-gray-600 mb-2">{alert.details}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>AC-{alert.aircraft_id}</span>
                      <span>{formatTimeAgo(alert.timestamp)}</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Rules Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAlertRules.map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-gray-600">Trigger: {rule.threshold}</p>
                  </div>
                </div>
                <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Configuration Note:</span> Alert rules are currently static. 
              Dynamic rule configuration will be implemented with user settings.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Real alert detection will be implemented when telemetry processing is available in the backend.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alert Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-200"></div>
            
            <div className="space-y-6">
              {alerts.map((alert) => (
                <div key={alert.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-3 h-3 rounded-full border-2 border-white shadow-lg ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'error' ? 'bg-red-400' :
                    alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{alert.message}</p>
                      <Badge variant={getSeverityBadge(alert.severity) as "default" | "destructive" | "outline" | "secondary"} className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {alerts.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>No alerts to display in timeline</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
