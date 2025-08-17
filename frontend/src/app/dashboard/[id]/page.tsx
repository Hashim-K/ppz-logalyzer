import { notFound } from "next/navigation"
import Link from "next/link"
import { LineChart } from "@/components/charts/line-chart"
import { ChartBuilder } from "@/components/charts/chart-builder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import { mockLogs, formatFileSize, formatDuration } from "@/lib/mock-data"

// Demo telemetry data for specific logs
const getLogData = (logId: string) => {
  const baseData = [
    { time: 0, altitude: 0, speed: 0, battery: 100, temperature: 25 },
    { time: 10, altitude: 15, speed: 5, battery: 98, temperature: 24 },
    { time: 20, altitude: 35, speed: 12, battery: 95, temperature: 22 },
    { time: 30, altitude: 60, speed: 18, battery: 92, temperature: 20 },
    { time: 40, altitude: 85, speed: 22, battery: 88, temperature: 18 },
    { time: 50, altitude: 110, speed: 25, battery: 85, temperature: 16 },
    { time: 60, altitude: 125, speed: 28, battery: 82, temperature: 15 },
    { time: 70, altitude: 140, speed: 30, battery: 78, temperature: 13 },
    { time: 80, altitude: 135, speed: 28, battery: 75, temperature: 14 },
    { time: 90, altitude: 120, speed: 25, battery: 72, temperature: 16 },
    { time: 100, altitude: 95, speed: 20, battery: 68, temperature: 18 },
    { time: 110, altitude: 65, speed: 15, battery: 65, temperature: 20 },
    { time: 120, altitude: 30, speed: 8, battery: 62, temperature: 22 },
    { time: 130, altitude: 10, speed: 3, battery: 60, temperature: 24 },
    { time: 140, altitude: 0, speed: 0, battery: 58, temperature: 25 },
  ]
  
  // Modify data slightly based on log ID for variety
  if (logId === 'log_002') {
    return baseData.slice(0, 9).map(d => ({ 
      ...d, 
      altitude: d.altitude * 0.2, 
      speed: d.speed * 0.3,
      time: d.time * 0.63
    }))
  }
  
  return baseData
}

interface DashboardPageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params
  
  // Find the log by ID
  const log = mockLogs.find(l => l.id === id)
  
  if (!log) {
    notFound()
  }
  
  if (log.status !== 'completed') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Logs
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">{log.filename}</p>
              <Badge variant={log.status === 'processing' ? 'secondary' : 'destructive'}>
                {log.status === 'processing' ? 'Processing...' : 'Processing Failed'}
              </Badge>
              {log.error && (
                <p className="text-sm text-muted-foreground mt-2">{log.error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = getLogData(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Logs
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{log.filename}</h1>
            <p className="text-muted-foreground">
              Uploaded {log.uploadDate.toLocaleDateString()} • {formatFileSize(log.fileSize)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Flight Data</TabsTrigger>
          <TabsTrigger value="builder">Chart Builder</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Altitude</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{log.maxAltitude}m</div>
                <p className="text-xs text-muted-foreground">
                  Flight peak altitude
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{log.maxSpeed} m/s</div>
                <p className="text-xs text-muted-foreground">
                  Maximum recorded speed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flight Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(log.flightDuration!)}</div>
                <p className="text-xs text-muted-foreground">
                  Total flight duration
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{log.recordCount?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Total measurements
                </p>
              </CardContent>
            </Card>
          </div>
          
          <LineChart
            title="Flight Overview"
            description="Altitude and speed during flight"
            data={data}
            dataKeys={["altitude", "speed"]}
            xAxisKey="time"
            height={400}
          />
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <LineChart
              title="Altitude Profile"
              description="UAV altitude over time"
              data={data}
              dataKeys={["altitude"]}
              xAxisKey="time"
              height={300}
            />
            
            <LineChart
              title="Battery & Temperature"
              description="System monitoring data"
              data={data}
              dataKeys={["battery", "temperature"]}
              xAxisKey="time"
              height={300}
            />
          </div>
          
          <LineChart
            title="Complete Telemetry"
            description="All flight parameters"
            data={data}
            dataKeys={["altitude", "speed", "battery", "temperature"]}
            xAxisKey="time"
            height={400}
          />
        </TabsContent>
        
        <TabsContent value="builder" className="space-y-4">
          <ChartBuilder
            data={data}
            availableKeys={["altitude", "speed", "battery", "temperature", "time"]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
