'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertTriangle, Info, AlertCircle, XCircle, Settings } from 'lucide-react';

// Available telemetry data fields for alert conditions
const telemetryFields = [
  { key: 'altitude', label: 'Altitude', unit: 'm', type: 'number', range: { min: 0, max: 1000 } },
  { key: 'speed', label: 'Speed', unit: 'm/s', type: 'number', range: { min: 0, max: 50 } },
  { key: 'battery_voltage', label: 'Battery Voltage', unit: 'V', type: 'number', range: { min: 0, max: 25 } },
  { key: 'battery_percentage', label: 'Battery Percentage', unit: '%', type: 'number', range: { min: 0, max: 100 } },
  { key: 'gps_satellites', label: 'GPS Satellites', unit: 'count', type: 'number', range: { min: 0, max: 20 } },
  { key: 'gps_hdop', label: 'GPS HDOP', unit: '', type: 'number', range: { min: 0, max: 10 } },
  { key: 'roll', label: 'Roll Angle', unit: '°', type: 'number', range: { min: -180, max: 180 } },
  { key: 'pitch', label: 'Pitch Angle', unit: '°', type: 'number', range: { min: -90, max: 90 } },
  { key: 'yaw', label: 'Yaw Angle', unit: '°', type: 'number', range: { min: -180, max: 180 } },
  { key: 'temperature', label: 'Temperature', unit: '°C', type: 'number', range: { min: -40, max: 85 } },
  { key: 'rssi', label: 'Signal Strength (RSSI)', unit: 'dBm', type: 'number', range: { min: -100, max: 0 } },
  { key: 'current', label: 'Current Draw', unit: 'A', type: 'number', range: { min: 0, max: 50 } },
  { key: 'pressure', label: 'Barometric Pressure', unit: 'hPa', type: 'number', range: { min: 800, max: 1200 } },
];

// Alert severity levels
const alertSeverities = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { value: 'error', label: 'Error', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'critical', label: 'Critical', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
];

// Comparison operators
const operators = [
  { value: 'gt', label: 'Greater than (>)', symbol: '>' },
  { value: 'gte', label: 'Greater than or equal (≥)', symbol: '≥' },
  { value: 'lt', label: 'Less than (<)', symbol: '<' },
  { value: 'lte', label: 'Less than or equal (≤)', symbol: '≤' },
  { value: 'eq', label: 'Equal to (=)', symbol: '=' },
  { value: 'neq', label: 'Not equal to (≠)', symbol: '≠' },
];

// Pre-configured alert templates
const alertTemplates = [
  {
    name: 'Low Battery Warning',
    field: 'battery_percentage',
    operator: 'lt',
    value: 20,
    severity: 'warning',
    message: 'Low battery detected',
    description: 'Triggers when battery drops below 20%'
  },
  {
    name: 'Critical Battery Alert',
    field: 'battery_percentage',
    operator: 'lt',
    value: 10,
    severity: 'critical',
    message: 'Critical battery level - RTL recommended',
    description: 'Triggers when battery drops below 10%'
  },
  {
    name: 'High Altitude Warning',
    field: 'altitude',
    operator: 'gt',
    value: 150,
    severity: 'warning',
    message: 'High altitude detected',
    description: 'Triggers when altitude exceeds 150m'
  },
  {
    name: 'GPS Signal Loss',
    field: 'gps_satellites',
    operator: 'lt',
    value: 4,
    severity: 'error',
    message: 'GPS signal degraded',
    description: 'Triggers when GPS satellites below 4'
  },
  {
    name: 'High Speed Alert',
    field: 'speed',
    operator: 'gt',
    value: 25,
    severity: 'warning',
    message: 'High speed detected',
    description: 'Triggers when speed exceeds 25 m/s'
  },
  {
    name: 'Temperature Warning',
    field: 'temperature',
    operator: 'gt',
    value: 60,
    severity: 'warning',
    message: 'High temperature detected',
    description: 'Triggers when temperature exceeds 60°C'
  }
];

export interface AlertRule {
  id: string;
  name: string;
  field: string;
  operator: string;
  value: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  description?: string;
  enabled: boolean;
  created_at: string;
}

interface AlertBuilderProps {
  existingRules?: AlertRule[];
  onSaveRule?: (rule: AlertRule) => void;
  onDeleteRule?: (ruleId: string) => void;
  onToggleRule?: (ruleId: string, enabled: boolean) => void;
}

export default function AlertBuilder({ 
  existingRules = [], 
  onSaveRule, 
  onDeleteRule, 
  onToggleRule 
}: AlertBuilderProps) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Form state for new alert rule
  const [formData, setFormData] = useState<{
    name: string;
    field: string;
    operator: string;
    value: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    description: string;
  }>({
    name: '',
    field: '',
    operator: '',
    value: '',
    severity: 'warning',
    message: '',
    description: '',
  });

  const handleTemplateSelect = (templateName: string) => {
    const template = alertTemplates.find(t => t.name === templateName);
    if (template) {
      setFormData({
        name: template.name,
        field: template.field,
        operator: template.operator,
        value: template.value.toString(),
        severity: template.severity as 'info' | 'warning' | 'error' | 'critical',
        message: template.message,
        description: template.description,
      });
      setSelectedTemplate(templateName);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      field: '',
      operator: '',
      value: '',
      severity: 'warning',
      message: '',
      description: '',
    });
    setSelectedTemplate('');
    setIsBuilding(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.field || !formData.operator || !formData.value || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: formData.name,
      field: formData.field,
      operator: formData.operator,
      value: parseFloat(formData.value),
      severity: formData.severity,
      message: formData.message,
      description: formData.description,
      enabled: true,
      created_at: new Date().toISOString(),
    };

    onSaveRule?.(newRule);
    resetForm();
  };

  const getFieldInfo = (fieldKey: string) => {
    return telemetryFields.find(f => f.key === fieldKey);
  };

  const getSeverityInfo = (severity: string) => {
    return alertSeverities.find(s => s.value === severity);
  };

  const formatRuleCondition = (rule: AlertRule) => {
    const field = getFieldInfo(rule.field);
    const operator = operators.find(op => op.value === rule.operator);
    
    return `${field?.label || rule.field} ${operator?.symbol || rule.operator} ${rule.value}${field?.unit ? ' ' + field.unit : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Alert Builder Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Alert Builder</h3>
        </div>
        <Button 
          onClick={() => setIsBuilding(!isBuilding)}
          variant={isBuilding ? "outline" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isBuilding ? 'Cancel' : 'Create Alert Rule'}
        </Button>
      </div>

      {/* Alert Rule Builder Form */}
      {isBuilding && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div>
              <Label>Quick Start Templates</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template or create custom rule" />
                </SelectTrigger>
                <SelectContent>
                  {alertTemplates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-sm text-gray-600 mt-1">
                  {alertTemplates.find(t => t.name === selectedTemplate)?.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Rule Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ruleName">Rule Name *</Label>
                <Input
                  id="ruleName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Low Battery Alert"
                />
              </div>

              <div>
                <Label htmlFor="severity">Alert Severity *</Label>
                <Select value={formData.severity} onValueChange={(value: 'info' | 'warning' | 'error' | 'critical') => setFormData({ ...formData, severity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {alertSeverities.map((severity) => {
                      const Icon = severity.icon;
                      return (
                        <SelectItem key={severity.value} value={severity.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {severity.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Condition Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dataField">Data Field *</Label>
                <Select value={formData.field} onValueChange={(value) => setFormData({ ...formData, field: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data field" />
                  </SelectTrigger>
                  <SelectContent>
                    {telemetryFields.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label} ({field.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operator">Condition *</Label>
                <Select value={formData.operator} onValueChange={(value) => setFormData({ ...formData, operator: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="threshold">Threshold Value *</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0"
                />
                {formData.field && (
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {getFieldInfo(formData.field)?.range.min} - {getFieldInfo(formData.field)?.range.max} {getFieldInfo(formData.field)?.unit}
                  </p>
                )}
              </div>
            </div>

            {/* Message Configuration */}
            <div>
              <Label htmlFor="alertMessage">Alert Message *</Label>
              <Input
                id="alertMessage"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="e.g., Battery level is critically low"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this alert rule..."
                rows={2}
              />
            </div>

            {/* Rule Preview */}
            {formData.field && formData.operator && formData.value && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Rule Preview:</p>
                <div className="flex items-center gap-2">
                  {getSeverityInfo(formData.severity) && (() => {
                    const severityInfo = getSeverityInfo(formData.severity)!;
                    const Icon = severityInfo.icon;
                    return <Icon className={`h-4 w-4 ${severityInfo.color}`} />;
                  })()}
                  <span className="text-sm">
                    When <strong>{getFieldInfo(formData.field)?.label}</strong> is{' '}
                    <strong>{operators.find(op => op.value === formData.operator)?.symbol} {formData.value}{getFieldInfo(formData.field)?.unit}</strong>,{' '}
                    trigger <strong>{formData.severity}</strong> alert: &quot;{formData.message}&quot;
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Alert Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alert Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {existingRules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alert rules configured</h3>
              <p className="text-gray-600 mb-4">Create your first alert rule to start monitoring telemetry data</p>
              <Button onClick={() => setIsBuilding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {existingRules.map((rule) => {
                const severityInfo = getSeverityInfo(rule.severity);
                const Icon = severityInfo?.icon || Info;
                
                return (
                  <div
                    key={rule.id}
                    className={`flex items-start justify-between p-4 rounded-lg border-2 ${
                      rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`mt-1 ${severityInfo?.color || 'text-gray-600'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                            {rule.name}
                          </h4>
                          <Badge variant={severityInfo?.value === 'critical' ? 'destructive' : 'default'}>
                            {rule.severity}
                          </Badge>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm mb-2 ${rule.enabled ? 'text-gray-700' : 'text-gray-500'}`}>
                          <strong>Condition:</strong> {formatRuleCondition(rule)}
                        </p>
                        
                        <p className={`text-sm mb-1 ${rule.enabled ? 'text-gray-700' : 'text-gray-500'}`}>
                          <strong>Message:</strong> {rule.message}
                        </p>
                        
                        {rule.description && (
                          <p className={`text-xs ${rule.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => onToggleRule?.(rule.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRule?.(rule.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Library */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rule Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertTemplates.map((template) => {
              const severityInfo = getSeverityInfo(template.severity);
              const Icon = severityInfo?.icon || Info;
              
              return (
                <div
                  key={template.name}
                  className="p-4 border rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => handleTemplateSelect(template.name)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${severityInfo?.color}`} />
                    <h4 className="font-medium">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    {getFieldInfo(template.field)?.label} {operators.find(op => op.value === template.operator)?.symbol} {template.value}{getFieldInfo(template.field)?.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
