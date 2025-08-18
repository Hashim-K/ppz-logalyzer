'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

interface UploadedFile {
  file_id: string;
  original_filename: string;
  file_size: number;
  upload_timestamp: string;
  content_type: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: UploadedFile[];
}

export default function FileUpload() {
  const { token } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) {
      toast.error('Please log in to upload files')
      return
    }

    const formData = new FormData(event.currentTarget)
    const files = formData.getAll('files') as File[]
    
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const uploadData = new FormData()
      files.forEach(file => {
        uploadData.append('files', file)
      })

      const response = await fetch('http://localhost:8080/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      setUploadResult(result)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Upload failed: ${errorMessage}`)
      setUploadResult({ success: false, message: errorMessage })
    } finally {
      setIsUploading(false)
    }
  }

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please log in to upload files.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Log Files
        </CardTitle>
        <CardDescription>
          Upload your log and data files. Analysis sessions will be created automatically for file pairs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <Label htmlFor="files">Select Files</Label>
            <Input
              id="files"
              name="files"
              type="file"
              multiple
              accept=".log,.data,.txt,.csv"
              disabled={isUploading}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Select log files (.log, .data, .txt, .csv). Files with the same base name will be paired automatically.
            </p>
          </div>
          
          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </form>

        {uploadResult && (
          <div className={`p-4 rounded-lg border ${
            uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                </p>
                <p className={`text-sm ${
                  uploadResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadResult.message}
                </p>
                
                {uploadResult.success && uploadResult.data && (
                  <div className="mt-2">
                    <p className="text-sm text-green-700 font-medium">
                      Uploaded {uploadResult.data.length} file(s):
                    </p>
                    <ul className="text-sm text-green-600 mt-1 space-y-1">
                      {uploadResult.data.map((file: UploadedFile) => (
                        <li key={file.file_id} className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {file.original_filename} ({(file.file_size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
