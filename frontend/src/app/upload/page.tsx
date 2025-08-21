"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/ui/file-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Clock, X, FileText, Database } from "lucide-react"
import { toast } from "sonner"

interface FilePair {
  id: string
  baseName: string
  dataFile?: { file: File }
  logFile?: { file: File }
  status: "incomplete" | "complete" | "uploading" | "completed" | "error"
}

interface ProcessingPair {
  id: string
  baseName: string
  progress: number
  status: 'processing' | 'completed' | 'error'
  error?: string
}

export default function UploadPage() {
  const [processingPairs, setProcessingPairs] = useState<ProcessingPair[]>([])
  const router = useRouter()

  const generateSessionId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 4)
    return `session_${timestamp}_${random}`
  }

  const handleFilesUploaded = (filePairs: FilePair[]) => {
    // Only process complete pairs
    const completePairs = filePairs.filter(pair => 
      pair.status === 'complete' || pair.status === 'completed'
    )
    
    if (completePairs.length === 0) return

    toast.success(`Starting processing for ${completePairs.length} file pair(s)`)

    const newProcessingPairs: ProcessingPair[] = completePairs.map(pair => ({
      id: generateSessionId(),
      baseName: pair.baseName,
      progress: 0,
      status: 'processing'
    }))

    setProcessingPairs(prev => [...prev, ...newProcessingPairs])

    // Simulate processing for each pair
    newProcessingPairs.forEach(pair => {
      simulatePairProcessing(pair.id)
    })
  }

  const simulatePairProcessing = (pairId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5 // Random progress between 5-20%
      
      setProcessingPairs(prev => 
        prev.map(p => 
          p.id === pairId ? { ...p, progress: Math.min(progress, 100) } : p
        )
      )
      
      if (progress >= 100) {
        clearInterval(interval)
        
        // Mark as completed
        setProcessingPairs(prev => 
          prev.map(p => 
            p.id === pairId ? { ...p, progress: 100, status: 'completed' } : p
          )
        )

        const pair = processingPairs.find(p => p.id === pairId)
        if (pair) {
          toast.success(`Processing completed for ${pair.baseName}`)
        }
      }
    }, 800)
  }

  const removePair = (pairId: string) => {
    setProcessingPairs(prev => prev.filter(p => p.id !== pairId))
  }

  const getStatusIcon = (status: ProcessingPair['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ProcessingPair['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Log Files</h1>
          <p className="text-muted-foreground">
            Upload your PaparazziUAV log files for analysis and visualization
          </p>
        </div>

        <FileUpload
          onFilesUploaded={handleFilesUploaded}
          accept=".log,.data"
          maxFileSize={500} // 500MB for large log files
          maxFiles={40} // Allow more files since we need pairs
        />

        {processingPairs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processingPairs.map(pair => (
                <div key={pair.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(pair.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{pair.baseName}</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(pair.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePair(pair.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {pair.status === 'processing' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Processing telemetry data...</span>
                          <span>{Math.round(pair.progress)}%</span>
                        </div>
                      )}
                      
                      {pair.status === 'completed' && (
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-green-600">
                            <Database className="h-3 w-3" />
                            <span>Data processed</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <FileText className="h-3 w-3" />
                            <span>Log parsed</span>
                          </div>
                        </div>
                      )}
                      
                      {(pair.status === 'processing') && (
                        <Progress value={pair.progress} className="h-2" />
                      )}
                      
                      {pair.error && (
                        <p className="text-xs text-destructive">{pair.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {processingPairs.filter(p => p.status === 'completed').length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Complete!</h3>
                <p className="text-muted-foreground mb-4">
                  Your log files have been processed and are ready for analysis.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push('/sessions')}>
                    View Sessions
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions when no files are being processed */}
        {processingPairs.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Ready to Upload</h3>
                <p className="text-muted-foreground">
                  Select your PaparazziUAV log file pairs above to begin the upload and processing workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
