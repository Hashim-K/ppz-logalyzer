const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Types based on backend API
export interface LogFile {
  id: string
  filename: string
  original_filename: string
  file_size: number
  upload_timestamp: string
  content_type: string
  user_id: string
  file_hash: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  file_pair_id?: string
  base_filename?: string
  extracted_timestamp?: string
  file_extension: string
  message_count?: number
  file_duration?: number
  max_altitude?: number
  max_speed?: number
}

export interface FileUploadResponse {
  file_id: string
  original_filename: string
  file_size: number
  upload_timestamp: string
  content_type: string
  processing_status: string
  file_pair_id?: string
  base_filename?: string
  extracted_timestamp?: string
  file_extension: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
}

class FileAPI {
  private async getAuthToken(): Promise<string | null> {
    // Get token from localStorage - matching auth.ts pattern
    const authData = localStorage.getItem('auth-storage')
    if (!authData) return null
    
    try {
      const parsed = JSON.parse(authData)
      return parsed.state?.token || null
    } catch {
      return null
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async uploadFiles(files: FileList): Promise<FileUploadResponse[]> {
    const token = await this.getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }
  }

  async listFiles(): Promise<LogFile[]> {
    const result = await this.request<LogFile[]>('/api/files')
    return result.data || []
  }

  async getFile(id: string): Promise<LogFile> {
    const result = await this.request<LogFile>(`/api/files/${id}`)
    if (!result.data) {
      throw new Error('File not found')
    }
    return result.data
  }

  async deleteFile(id: string): Promise<void> {
    await this.request(`/api/files/${id}`, {
      method: 'DELETE',
    })
  }

  async downloadFile(id: string): Promise<Blob> {
    const token = await this.getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/files/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    return response.blob()
  }
}

export const fileAPI = new FileAPI()

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export const getFileTypeIcon = (extension: string): string => {
  switch (extension.toLowerCase()) {
    case 'log':
      return '📄'
    case 'data':
      return '📊'
    default:
      return '📁'
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'processing':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
