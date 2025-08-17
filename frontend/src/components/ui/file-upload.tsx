"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Upload, File, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadItem {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  error?: string
}

interface FileUploadProps {
  accept?: string
  maxFileSize?: number // in MB
  maxFiles?: number
  onFilesUploaded?: (files: File[]) => void
  className?: string
}

export function FileUpload({
  accept = ".log,.csv,.txt,.xml",
  maxFileSize = 500,
  maxFiles = 20,
  onFilesUploaded,
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateFile = useCallback((file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`
    }

    if (accept && !accept.includes("*")) {
      const extensions = accept.split(",").map(ext => ext.trim().toLowerCase())
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
      
      if (!extensions.includes(fileExtension)) {
        return `File "${file.name}" has an unsupported format. Accepted formats: ${accept}`
      }
    }

    return null
  }, [maxFileSize, accept])

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: FileUploadItem[] = []
    const fileArray = Array.from(fileList)

    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. Current: ${files.length}, Adding: ${fileArray.length}`)
      return
    }

    setError("")

    fileArray.forEach(file => {
      const validationError = validateFile(file)
      
      if (validationError) {
        setError(validationError)
        return
      }

      const fileItem: FileUploadItem = {
        file,
        id: Math.random().toString(36).substring(2, 15),
        progress: 0,
        status: "pending"
      }

      newFiles.push(fileItem)
    })

    setFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload process
    newFiles.forEach(fileItem => {
      simulateUpload(fileItem.id)
    })

    if (onFilesUploaded && newFiles.length > 0) {
      onFilesUploaded(newFiles.map(item => item.file))
    }
  }, [files.length, maxFiles, onFilesUploaded, validateFile])

  const simulateUpload = (fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "uploading" } : f))
    
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id !== fileId) return f
        
        const newProgress = Math.min(f.progress + Math.random() * 30, 100)
        
        if (newProgress >= 100) {
          clearInterval(interval)
          return { ...f, progress: 100, status: "completed" }
        }
        
        return { ...f, progress: newProgress }
      }))
    }, 500)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    processFiles(droppedFiles)
  }, [processFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearAll = () => {
    setFiles([])
    setError("")
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Log Files</CardTitle>
          <CardDescription>
            Drag and drop your PaparazziUAV log files here, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragOver ? "Drop files here" : "Upload your log files"}
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: {accept} • Max {maxFileSize}MB per file • Up to {maxFiles} files
              </p>
              <Button onClick={openFileDialog} className="mt-4">
                Choose Files
              </Button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">
                Uploaded Files ({files.length}/{maxFiles})
              </CardTitle>
              <CardDescription>
                {files.filter(f => f.status === "completed").length} completed, {files.filter(f => f.status === "uploading").length} uploading
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map(fileItem => (
                <div key={fileItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      <Badge 
                        variant={
                          fileItem.status === "completed" ? "default" :
                          fileItem.status === "error" ? "destructive" :
                          fileItem.status === "uploading" ? "secondary" : "outline"
                        }
                      >
                        {fileItem.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {fileItem.status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {fileItem.status.charAt(0).toUpperCase() + fileItem.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(fileItem.file.size)}</span>
                      {fileItem.status === "uploading" && (
                        <span>{Math.round(fileItem.progress)}%</span>
                      )}
                    </div>
                    
                    {(fileItem.status === "uploading" || fileItem.status === "pending") && (
                      <Progress value={fileItem.progress} className="h-1" />
                    )}
                    
                    {fileItem.error && (
                      <p className="text-xs text-destructive mt-1">{fileItem.error}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileItem.id)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}