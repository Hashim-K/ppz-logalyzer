"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/ui/file-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Clock, X } from "lucide-react"
import { mockLogs, ProcessedLog, formatFileSize } from "@/lib/mock-data"
import Navigation from "@/components/Navigation"

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export default function UploadPage() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const router = useRouter()

  const generateLogId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 4)
    return `log_${timestamp}_${random}`
  }

  const simulateFileProcessing = (uploadingFile: UploadingFile) => {
    const { id, file } = uploadingFile
    
    // Simulate upload progress
    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15 + 5 // Random progress between 5-20%
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === id ? { ...f, progress: Math.min(progress, 100) } : f
        )
      )
      
      if (progress >= 100) {
        clearInterval(uploadInterval)
        
        // Move to processing phase
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === id ? { ...f, status: 'processing', progress: 0 } : f
          )
        )
        
        // Simulate processing with chance of failure
        const processingTime = Math.random() * 3000 + 2000 // 2-5 seconds
        const shouldFail = Math.random() < 0.15 // 15% chance of failure
        
        setTimeout(() => {
          if (shouldFail) {
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === id ? { 
                  ...f, 
                  status: 'error',
                  error: 'Failed to parse log format. Please ensure the file is a valid PaparazziUAV log file.'
                } : f
              )
            )
          } else {
            // Successfully processed - add to mock data and mark complete
            const logId = generateLogId()
            const newLog: ProcessedLog = {
              id: logId,
              filename: file.name,
              uploadDate: new Date(),
              fileSize: file.size,
              status: 'completed',
              maxAltitude: Math.floor(Math.random() * 200) + 50, // 50-250m
              maxSpeed: Math.floor(Math.random() * 40) + 10, // 10-50 m/s
              flightDuration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
              recordCount: Math.floor(Math.random() * 50000) + 10000, // 10k-60k records
            }
            
            // Add to mock logs (in real app, this would be API call)
            mockLogs.unshift(newLog)
            
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === id ? { ...f, status: 'completed' } : f
              )
            )
          }
        }, processingTime)
      }
    }, 200) // Update every 200ms
  }

  const handleFilesUploaded = (files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const
    }))
    
    setUploadingFiles(prev => [...prev, ...newUploadingFiles])
    
    // Start processing each file
    newUploadingFiles.forEach(uploadingFile => {
      setTimeout(() => simulateFileProcessing(uploadingFile), 100)
    })
  }

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
            accept=".log,.csv,.txt,.xml"
            maxFileSize={500} // 500MB for large log files
            maxFiles={20}
          />

      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadingFiles.map(uploadingFile => (
              <div key={uploadingFile.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(uploadingFile.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(uploadingFile.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{formatFileSize(uploadingFile.file.size)}</span>
                    <span>•</span>
                    <span>{uploadingFile.file.type || 'Unknown type'}</span>
                  </div>
                  
                  {(uploadingFile.status === 'uploading' || uploadingFile.status === 'processing') && (
                    <div className="space-y-1">
                      <Progress value={uploadingFile.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {uploadingFile.status === 'uploading' ? 'Uploading...' : 'Processing log data...'}
                        {uploadingFile.status === 'uploading' && ` ${Math.round(uploadingFile.progress)}%`}
                      </p>
                    </div>
                  )}
                  
                  {uploadingFile.status === 'completed' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Find the corresponding log in mockLogs and navigate to it
                          const matchingLog = mockLogs.find(log => 
                            log.filename === uploadingFile.file.name &&
                            log.status === 'completed'
                          )
                          if (matchingLog) {
                            router.push(`/dashboard/${matchingLog.id}`)
                          }
                        }}
                      >
                        View Analysis
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/')}
                      >
                        Back to Logs
                      </Button>
                    </div>
                  )}
                  
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <p className="text-xs text-red-500 mt-2">{uploadingFile.error}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  )
}
