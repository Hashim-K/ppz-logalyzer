"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"

interface ChartProps {
  data: Record<string, unknown>[]
  className?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
}

interface LineChartProps extends ChartProps {
  xDataKey: string
  lines: Array<{
    dataKey: string
    stroke: string
    name?: string
    strokeWidth?: number
    dot?: boolean
  }>
}

export function CustomLineChart({
  data,
  xDataKey,
  lines,
  className,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: LineChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xDataKey} />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              name={line.name}
              strokeWidth={line.strokeWidth || 2}
              dot={line.dot !== false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface AreaChartProps extends ChartProps {
  xDataKey: string
  areas: Array<{
    dataKey: string
    fill: string
    stroke?: string
    name?: string
    stackId?: string
  }>
}

export function CustomAreaChart({
  data,
  xDataKey,
  areas,
  className,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: AreaChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xDataKey} />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {areas.map((area, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={area.dataKey}
              stackId={area.stackId}
              stroke={area.stroke || area.fill}
              fill={area.fill}
              name={area.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface BarChartProps extends ChartProps {
  xDataKey: string
  bars: Array<{
    dataKey: string
    fill: string
    name?: string
    stackId?: string
  }>
}

export function CustomBarChart({
  data,
  xDataKey,
  bars,
  className,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: BarChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xDataKey} />
          <YAxis />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              stackId={bar.stackId}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface ScatterChartProps extends ChartProps {
  xDataKey: string
  yDataKey: string
  scatters: Array<{
    fill: string
    name?: string
  }>
}

export function CustomScatterChart({
  data,
  xDataKey,
  yDataKey,
  scatters,
  className,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: ScatterChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {showGrid && <CartesianGrid />}
          <XAxis type="number" dataKey={xDataKey} />
          <YAxis type="number" dataKey={yDataKey} />
          {showTooltip && <Tooltip cursor={{ strokeDasharray: "3 3" }} />}
          {showLegend && <Legend />}
          {scatters.map((scatter, index) => (
            <Scatter
              key={index}
              name={scatter.name}
              fill={scatter.fill}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// Chart theme colors
export const chartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  cyan: "#06b6d4",
  orange: "#f97316",
  emerald: "#10b981",
}
