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
  baseName: string
  extension: string
  paired?: boolean
  pairId?: string
}

interface FilePair {
  id: string
  baseName: string
  dataFile?: FileUploadItem
  logFile?: FileUploadItem
  status: "incomplete" | "complete" | "uploading" | "completed" | "error"
}

interface FileUploadProps {
  accept?: string
  maxFileSize?: number // in MB
  maxFiles?: number
  onFilesUploaded?: (filePairs: FilePair[]) => void
  className?: string
}

export function FileUpload({
  accept = ".log,.data",
  maxFileSize = 500,
  maxFiles = 40, // Allow more files since we need pairs
  onFilesUploaded,
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [filePairs, setFilePairs] = useState<FilePair[]>([])
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

  const getFileBaseName = (filename: string) => {
    return filename.substring(0, filename.lastIndexOf('.'))
  }

  const getFileExtension = (filename: string) => {
    return filename.substring(filename.lastIndexOf('.'))
  }

  const validateFile = useCallback((file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`
    }

    const extension = getFileExtension(file.name).toLowerCase()
    if (extension !== '.log' && extension !== '.data') {
      return `File "${file.name}" has an unsupported format. Only .log and .data files are accepted.`
    }

    return null
  }, [maxFileSize])

  const updateFilePairs = useCallback((updatedFiles: FileUploadItem[]) => {
    const pairMap = new Map<string, FilePair>()
    
    updatedFiles.forEach(fileItem => {
      const baseName = fileItem.baseName
      
      if (!pairMap.has(baseName)) {
        pairMap.set(baseName, {
          id: `pair_${baseName}`,
          baseName,
          status: "incomplete"
        })
      }
      
      const pair = pairMap.get(baseName)!
      
      if (fileItem.extension === '.data') {
        pair.dataFile = fileItem
      } else if (fileItem.extension === '.log') {
        pair.logFile = fileItem
      }
    })

    // Update pair status based on completeness
    const pairs = Array.from(pairMap.values()).map(pair => {
      const hasData = !!pair.dataFile
      const hasLog = !!pair.logFile
      
      if (hasData && hasLog) {
        const dataStatus = pair.dataFile!.status
        const logStatus = pair.logFile!.status
        
        if (dataStatus === 'error' || logStatus === 'error') {
          pair.status = 'error'
        } else if (dataStatus === 'completed' && logStatus === 'completed') {
          pair.status = 'completed'
        } else if (dataStatus === 'uploading' || logStatus === 'uploading') {
          pair.status = 'uploading'
        } else {
          pair.status = 'complete'
        }
      } else {
        pair.status = 'incomplete'
      }
      
      return pair
    })

    setFilePairs(pairs)
    
    if (onFilesUploaded) {
      const completePairs = pairs.filter(pair => pair.status === 'complete' || pair.status === 'completed')
      onFilesUploaded(completePairs)
    }
  }, [onFilesUploaded])

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

      const baseName = getFileBaseName(file.name)
      const extension = getFileExtension(file.name)

      const fileItem: FileUploadItem = {
        file,
        id: Math.random().toString(36).substring(2, 15),
        progress: 0,
        status: "pending",
        baseName,
        extension
      }

      newFiles.push(fileItem)
    })

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    updateFilePairs(updatedFiles)
    
    // Simulate upload process
    newFiles.forEach(fileItem => {
      simulateUpload(fileItem.id)
    })
  }, [files, maxFiles, validateFile, updateFilePairs])

  const simulateUpload = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.map(f => f.id === fileId ? { ...f, status: "uploading" as const } : f)
      return updated
    })
    
    const interval = setInterval(() => {
      setFiles(prev => {
        const updated = prev.map(f => {
          if (f.id !== fileId) return f
          
          const newProgress = Math.min(f.progress + Math.random() * 30, 100)
          
          if (newProgress >= 100) {
            clearInterval(interval)
            return { ...f, progress: 100, status: "completed" as const }
          }
          
          return { ...f, progress: newProgress }
        })
        updateFilePairs(updated)
        return updated
      })
    }, 500)
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    updateFilePairs(updatedFiles)
  }

  const removePair = useCallback((pairId: string) => {
    const pair = filePairs.find(p => p.id === pairId)
    if (pair) {
      const updatedFiles = files.filter(f => f.baseName !== pair.baseName)
      setFiles(updatedFiles)
      updateFilePairs(updatedFiles)
    }
  }, [filePairs, files, updateFilePairs])

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
    setFilePairs([])
    setError("")
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload PaparazziUAV Log Files</CardTitle>
          <CardDescription>
            Upload both .data and .log files with matching filenames (e.g., flight001.data + flight001.log)
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
                {isDragOver ? "Drop files here" : "Upload your log file pairs"}
              </p>
              <p className="text-sm text-muted-foreground">
                Required: .data and .log files • Max {maxFileSize}MB per file
              </p>
              <p className="text-xs text-muted-foreground">
                Example: flight001.data + flight001.log
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

      {/* File Pairs Display */}
      {filePairs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">
                File Pairs ({filePairs.length})
              </CardTitle>
              <CardDescription>
                {filePairs.filter(p => p.status === "completed").length} completed, {" "}
                {filePairs.filter(p => p.status === "complete").length} ready, {" "}
                {filePairs.filter(p => p.status === "incomplete").length} incomplete
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filePairs.map(pair => (
                <div key={pair.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{pair.baseName}</h4>
                      <Badge 
                        variant={
                          pair.status === "completed" ? "default" :
                          pair.status === "complete" ? "secondary" :
                          pair.status === "error" ? "destructive" :
                          pair.status === "uploading" ? "secondary" : "outline"
                        }
                      >
                        {pair.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {pair.status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {pair.status === "complete" ? "Ready" : 
                         pair.status === "incomplete" ? "Missing files" :
                         pair.status.charAt(0).toUpperCase() + pair.status.slice(1)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePair(pair.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Data file */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 border rounded",
                      pair.dataFile ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 border-dashed"
                    )}>
                      <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {pair.dataFile ? (
                          <>
                            <p className="text-sm font-medium truncate">
                              {pair.dataFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(pair.dataFile.file.size)}
                              {pair.dataFile.status === "uploading" && 
                                ` • ${Math.round(pair.dataFile.progress)}%`
                              }
                            </p>
                            {pair.dataFile.status === "uploading" && (
                              <Progress value={pair.dataFile.progress} className="h-1 mt-1" />
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {pair.baseName}.data (missing)
                          </p>
                        )}
                      </div>
                      {pair.dataFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(pair.dataFile!.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Log file */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 border rounded",
                      pair.logFile ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200 border-dashed"
                    )}>
                      <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {pair.logFile ? (
                          <>
                            <p className="text-sm font-medium truncate">
                              {pair.logFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(pair.logFile.file.size)}
                              {pair.logFile.status === "uploading" && 
                                ` • ${Math.round(pair.logFile.progress)}%`
                              }
                            </p>
                            {pair.logFile.status === "uploading" && (
                              <Progress value={pair.logFile.progress} className="h-1 mt-1" />
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {pair.baseName}.log (missing)
                          </p>
                        )}
                      </div>
                      {pair.logFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(pair.logFile!.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {pair.status === "incomplete" && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This file pair is incomplete. Please upload both {pair.baseName}.data and {pair.baseName}.log files.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {filePairs.length === 0 && files.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Expected File Format</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Upload both .data and .log files for each flight session</p>
                  <p>• Files must have matching names (e.g., flight001.data + flight001.log)</p>
                  <p>• Each complete pair will create one analysis session</p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Example file pair:</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">flight001.data</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">flight001.log</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}