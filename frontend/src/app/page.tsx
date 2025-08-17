import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Upload, FileText, Eye, Search, Clock, AlertCircle } from "lucide-react"
import { mockLogs, formatFileSize, formatDuration } from "@/lib/mock-data"

export default function HomePage() {
  const completedLogs = mockLogs.filter(log => log.status === "completed")
  const processingLogs = mockLogs.filter(log => log.status === "processing")
  const errorLogs = mockLogs.filter(log => log.status === "error")
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Files</h1>
          <p className="text-muted-foreground">
            Manage and analyze your PaparazziUAV flight logs
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Log
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search log files..."
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
          <CardDescription>Your most recently processed flight logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockLogs.slice(0, 8).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{log.filename}</h4>
                    <Badge 
                      variant={
                        log.status === "completed" ? "default" :
                        log.status === "error" ? "destructive" : "secondary"
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(log.fileSize)} • {log.uploadDate.toLocaleDateString()}
                    {log.flightDuration && ` • ${formatDuration(log.flightDuration)}`}
                  </p>
                </div>
                {log.status === "completed" ? (
                  <Link href={`/dashboard/${log.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                ) : log.status === "error" ? (
                  <Button size="sm" variant="outline" disabled>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Error
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Processing
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {mockLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No log files yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first PaparazziUAV log file to get started
              </p>
              <Link href="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Log
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
