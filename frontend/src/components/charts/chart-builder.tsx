"use client"

import { useState } from "react"
import { LineChart } from "./line-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ChartBuilderProps {
  data: Array<Record<string, number | string>>
  availableKeys: string[]
}

export function ChartBuilder({ data, availableKeys }: ChartBuilderProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [chartTitle, setChartTitle] = useState("Custom Chart")
  const [xAxisKey, setXAxisKey] = useState(availableKeys[0] || "time")

  const handleKeyToggle = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedKeys(prev => [...prev, key])
    } else {
      setSelectedKeys(prev => prev.filter(k => k !== key))
    }
  }

  return (
    <div className="space-y-6">
      {/* Chart Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Configuration</CardTitle>
          <CardDescription>
            Customize your chart by selecting data fields and options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart Title */}
          <div className="space-y-2">
            <Label htmlFor="chart-title">Chart Title</Label>
            <Input
              id="chart-title"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Enter chart title"
            />
          </div>

          {/* X-Axis Selection */}
          <div className="space-y-2">
            <Label>X-Axis Field</Label>
            <Select value={xAxisKey} onValueChange={setXAxisKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select X-axis field" />
              </SelectTrigger>
              <SelectContent>
                {availableKeys.map(key => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Y-Axis Fields Selection */}
          <div className="space-y-2">
            <Label>Y-Axis Fields</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableKeys.filter(key => key !== xAxisKey).map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selectedKeys.includes(key)}
                    onCheckedChange={(checked) => handleKeyToggle(key, checked as boolean)}
                  />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {key}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={() => setSelectedKeys([])}>
              Clear All
            </Button>
            <Button 
              onClick={() => setSelectedKeys(availableKeys.filter(k => k !== xAxisKey))}
              variant="outline"
            >
              Select All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart Preview */}
      {selectedKeys.length > 0 && data.length > 0 && (
        <LineChart
          title={chartTitle}
          description={`Showing ${selectedKeys.length} data series`}
          data={data}
          dataKeys={selectedKeys}
          xAxisKey={xAxisKey}
          height={400}
        />
      )}

      {selectedKeys.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">
              Select data fields to generate your chart
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
