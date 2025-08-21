'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  Zap,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  organization?: string;
  role?: string;
  created_at: string;
}

interface AppSettings {
  // General
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Dashboard
  defaultTab: string;
  refreshInterval: number;
  showQuickStats: boolean;
  compactMode: boolean;
  
  // Charts
  defaultChartType: string;
  chartAnimations: boolean;
  showDataPoints: boolean;
  gridLines: boolean;
  
  // Alerts
  enableNotifications: boolean;
  soundAlerts: boolean;
  emailNotifications: boolean;
  alertRetention: number;
  
  // Maps
  mapProvider: string;
  showTrajectory: boolean;
  showWaypoints: boolean;
  mapTheme: string;
  
  // Data
  autoSave: boolean;
  dataRetention: number;
  exportFormat: string;
  compressionLevel: number;
}

const defaultSettings: AppSettings = {
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  defaultTab: 'flight-data',
  refreshInterval: 30,
  showQuickStats: true,
  compactMode: false,
  defaultChartType: 'line',
  chartAnimations: true,
  showDataPoints: true,
  gridLines: true,
  enableNotifications: true,
  soundAlerts: false,
  emailNotifications: true,
  alertRetention: 90,
  mapProvider: 'openstreetmap',
  showTrajectory: true,
  showWaypoints: true,
  mapTheme: 'standard',
  autoSave: true,
  dataRetention: 180,
  exportFormat: 'csv',
  compressionLevel: 6,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    organization: 'Paparazzi UAV Team',
    role: 'Flight Analyst',
    created_at: '2025-01-15T10:30:00Z',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: keyof AppSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in real app, would save to backend)
      localStorage.setItem('app-settings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const handleExportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ppz-logalyzer-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...defaultSettings, ...importedSettings });
          setHasChanges(true);
        } catch (error) {
          console.error('Error importing settings:', error);
          alert('Error importing settings file. Please check the format.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Settings saved
            </div>
          )}
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={handleSaveSettings} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Localization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">2025-08-21</SelectItem>
                      <SelectItem value="MM/DD/YYYY">08/21/2025</SelectItem>
                      <SelectItem value="DD/MM/YYYY">21/08/2025</SelectItem>
                      <SelectItem value="DD.MM.YYYY">21.08.2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={settings.timeFormat} onValueChange={(value) => handleSettingChange('timeFormat', value as '12h' | '24h')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24-hour (14:30)</SelectItem>
                      <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultTab">Default Tab</Label>
                  <Select value={settings.defaultTab} onValueChange={(value) => handleSettingChange('defaultTab', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flight-data">Flight Data</SelectItem>
                      <SelectItem value="charts">Charts</SelectItem>
                      <SelectItem value="graph-builder">Graph Builder</SelectItem>
                      <SelectItem value="maps">Maps</SelectItem>
                      <SelectItem value="alerts">Alerts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="refreshInterval">Auto-refresh Interval (seconds)</Label>
                  <Select value={settings.refreshInterval.toString()} onValueChange={(value) => handleSettingChange('refreshInterval', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Disabled</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showQuickStats">Show Quick Statistics</Label>
                  <p className="text-sm text-muted-foreground">Display summary cards at the top of the dashboard</p>
                </div>
                <Switch 
                  id="showQuickStats"
                  checked={settings.showQuickStats} 
                  onCheckedChange={(checked) => handleSettingChange('showQuickStats', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compactMode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing and padding for more content</p>
                </div>
                <Switch 
                  id="compactMode"
                  checked={settings.compactMode} 
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={profile.organization || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="Your organization"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Your role"
                  />
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Member since: {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">
                Change Password
              </Button>
              
              <Button variant="outline">
                Enable Two-Factor Authentication
              </Button>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                </div>
                <Button variant="outline" size="sm">
                  View Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <div className="w-8 h-5 bg-white border border-gray-300 rounded"></div>
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <div className="w-8 h-5 bg-gray-800 border border-gray-600 rounded"></div>
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <div className="w-8 h-5 bg-gradient-to-r from-white to-gray-800 border border-gray-400 rounded"></div>
                    System
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Charts</Label>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chartAnimations">Chart Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                    </div>
                    <Switch 
                      id="chartAnimations"
                      checked={settings.chartAnimations} 
                      onCheckedChange={(checked) => handleSettingChange('chartAnimations', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showDataPoints">Show Data Points</Label>
                      <p className="text-sm text-muted-foreground">Display individual data points on line charts</p>
                    </div>
                    <Switch 
                      id="showDataPoints"
                      checked={settings.showDataPoints} 
                      onCheckedChange={(checked) => handleSettingChange('showDataPoints', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="gridLines">Grid Lines</Label>
                      <p className="text-sm text-muted-foreground">Show grid lines on charts</p>
                    </div>
                    <Switch 
                      id="gridLines"
                      checked={settings.gridLines} 
                      onCheckedChange={(checked) => handleSettingChange('gridLines', checked)} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableNotifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive browser notifications for alerts</p>
                </div>
                <Switch 
                  id="enableNotifications"
                  checked={settings.enableNotifications} 
                  onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="soundAlerts">Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">Play sound for critical alerts</p>
                </div>
                <Switch 
                  id="soundAlerts"
                  checked={settings.soundAlerts} 
                  onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email alerts for critical issues</p>
                </div>
                <Switch 
                  id="emailNotifications"
                  checked={settings.emailNotifications} 
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)} 
                />
              </div>

              <div>
                <Label htmlFor="alertRetention">Alert Retention (days)</Label>
                <Select value={settings.alertRetention.toString()} onValueChange={(value) => handleSettingChange('alertRetention', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch 
                  id="autoSave"
                  checked={settings.autoSave} 
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)} 
                />
              </div>

              <div>
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <Select value={settings.dataRetention.toString()} onValueChange={(value) => handleSettingChange('dataRetention', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="-1">Never delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exportFormat">Default Export Format</Label>
                <Select value={settings.exportFormat} onValueChange={(value) => handleSettingChange('exportFormat', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExportSettings} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    style={{ display: 'none' }}
                    id="import-settings"
                  />
                  <Button
                    onClick={() => document.getElementById('import-settings')?.click()}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                </div>
                
                <Button onClick={handleResetSettings} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will permanently delete all your sessions, uploaded files, and settings. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Version:</strong> 1.0.0-beta
                </div>
                <div>
                  <strong>Build:</strong> 2025.08.21
                </div>
                <div>
                  <strong>Environment:</strong> Development
                </div>
                <div>
                  <strong>API Status:</strong> Connected
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
