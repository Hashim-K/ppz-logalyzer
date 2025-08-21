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
    {
      id: '3',
      name: 'High Altitude Alert',
      field: 'altitude',
      operator: 'gt',
      value: 150,
      severity: 'warning',
      message: 'High altitude detected',
      description: 'Triggers when altitude exceeds 150m',
      enabled: false,
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Overview
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alert Builder
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Alert History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Alert Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAlertStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All time
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

          {/* Active Alert Rules Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.filter(rule => rule.enabled).map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-gray-600">{rule.message}</p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
                {alertRules.filter(rule => rule.enabled).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p>No active alert rules configured</p>
                    <p className="text-sm mt-1">Use the Alert Builder tab to create monitoring rules</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <AlertBuilder
            existingRules={alertRules}
            onSaveRule={handleSaveRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
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
                        {alert.details && (
                          <p className="text-xs text-gray-500 mt-1">{alert.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {alerts.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No alert history available</p>
                  <p>Alert history will appear here once rules are triggered</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Statistics Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{mockAlertStats.info}</div>
                  <p className="text-sm text-blue-600">Info</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{mockAlertStats.warning}</div>
                  <p className="text-sm text-yellow-600">Warning</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{mockAlertStats.error}</div>
                  <p className="text-sm text-red-500">Error</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{mockAlertStats.critical}</div>
                  <p className="text-sm text-red-600">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
