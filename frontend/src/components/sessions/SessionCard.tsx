'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Play, Calendar, FileText, Clock, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AnalysisSessionResponse, LogFileInfo, TimeFormat } from '@/types/api'
import { formatDateTime, extractTimestampFromFilename } from '@/lib/dateUtils'

interface SessionCardProps {
  session: AnalysisSessionResponse
  onDelete: (sessionId: string) => void
}

interface SessionStats {
  aircraftIds: number[]
  messages: string
  duration: string
  types: number
  fileSize: number
  flightDate: Date | null
  isLoading: boolean
}

// TODO: This will be moved to settings context later  
// For demo purposes, you can change this to see different formats
const DEFAULT_TIME_FORMAT = TimeFormat.TWENTY_FOUR_HOUR // Try changing to TWELVE_HOUR

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

const formatDuration = (minutes: number): string => {
  const mins = Math.floor(minutes)
  const secs = Math.floor((minutes % 1) * 60)
  return `${mins}m ${secs}s`
}

// Extract aircraft IDs from filenames - this is a smart guess until we have real telemetry parsing
const extractAircraftIds = (files: LogFileInfo[]): number[] => {
  const aircraftIds: Set<number> = new Set()
  
  files.forEach((file, index) => {
    // Look for common patterns in PaparazziUAV filenames that might indicate aircraft ID
    const filename = file.original_filename.toLowerCase()
    
    // Pattern 1: Look for "ac" followed by digits (e.g., "ac1", "ac_2", "aircraft3")
    const acMatch = filename.match(/ac[_\s]*(\d+)/i)
    if (acMatch) {
      aircraftIds.add(parseInt(acMatch[1]))
      return
    }
    
    // Pattern 2: Look for digits after common prefixes
    const prefixMatch = filename.match(/(aircraft|plane|uav)[_\s]*(\d+)/i)
    if (prefixMatch) {
      aircraftIds.add(parseInt(prefixMatch[2]))
      return
    }
    
    // Pattern 3: If no clear pattern, generate sequential IDs starting from 1
    // This assumes files are paired and each pair represents one aircraft
    const estimatedId = Math.floor(index / 2) + 1
    aircraftIds.add(estimatedId)
  })
  
  // Return sorted array, ensure we have at least one aircraft
  const result = Array.from(aircraftIds).sort((a, b) => a - b)
  return result.length > 0 ? result : [1]
}

// Format aircraft IDs for display
const formatAircraftIds = (aircraftIds: number[]): string => {
  if (aircraftIds.length === 0) return 'None'
  if (aircraftIds.length === 1) return `AC ${aircraftIds[0]}`
  if (aircraftIds.length === 2) return `AC ${aircraftIds[0]}, ${aircraftIds[1]}`
  if (aircraftIds.length <= 3) return aircraftIds.map(id => `AC ${id}`).join(', ')
  
  // For many aircraft, show first two and count
  return `AC ${aircraftIds[0]}, ${aircraftIds[1]} +${aircraftIds.length - 2}`
}

export default function SessionCard({ session, onDelete }: SessionCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState<SessionStats>({
    aircraftIds: [],
    messages: '0',
    duration: '0m 0s',
    types: 0,
    fileSize: 0,
    flightDate: null,
    isLoading: true
  })

  const fetchSessionStats = useCallback(async () => {
    try {
      // Get file info from the session's file_ids
      const fileIds = session.session_config?.file_ids || (session.file_id ? [session.file_id] : [])
      
      if (fileIds.length === 0) {
        setStats(prev => ({ ...prev, flightDate: null, isLoading: false }))
        return
      }

      // Fetch file information for each file
      const filePromises = fileIds.map(async (fileId) => {
        const response = await fetch(`/api/files/${fileId}`)
        if (!response.ok) throw new Error(`Failed to fetch file ${fileId}`)
        const data = await response.json()
        return data.data as LogFileInfo
      })

      const files = await Promise.all(filePromises)
      
      // Extract flight date from the first file's filename
      let flightDate: Date | null = null
      if (files.length > 0) {
        flightDate = extractTimestampFromFilename(files[0].original_filename)
      }
      
      // Extract aircraft IDs from filenames or estimate them
      const aircraftIds = extractAircraftIds(files)
      
      // Calculate stats from file information
      const totalSize = files.reduce((sum, file) => sum + file.file_size, 0)
      const messageCount = Math.floor(totalSize / 100) // Rough estimate: 100 bytes per message
      const durationMinutes = Math.max(1, Math.floor(messageCount / 1000)) // Estimate duration
      
      setStats({
        aircraftIds: aircraftIds,
        messages: formatCount(messageCount),
        duration: formatDuration(durationMinutes),
        types: Math.min(45, Math.max(20, Math.floor(messageCount / 100))), // Estimate message types
        fileSize: totalSize,
        flightDate: flightDate,
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching session stats:', error)
      // Fallback to basic stats
      setStats({
        aircraftIds: [1],
        messages: '1.0K',
        duration: '2m 30s',
        types: 25,
        fileSize: 0,
        flightDate: null,
        isLoading: false
      })
    }
  }, [session.file_id, session.session_config?.file_ids])

  useEffect(() => {
    fetchSessionStats()
  }, [fetchSessionStats])

  // Extract filename from session config
  const getFilename = () => {
    if (session.session_config?.base_filename) {
      return `${session.session_config.base_filename}.log`
    }
    return session.session_name || 'Untitled Session'
  }

  const handleAnalyze = () => {
    router.push(`/dashboard?session=${session.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(session.id)
    setIsDeleting(false)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm truncate">{getFilename()}</h3>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this session? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {stats.isLoading ? 'Loading...' : formatDateTime(stats.flightDate || session.created_at, DEFAULT_TIME_FORMAT)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Aircraft</span>
            <span className="font-medium ml-auto">{formatAircraftIds(stats.aircraftIds)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Messages</span>
              <span className="font-medium ml-auto">{stats.messages}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium ml-auto">{stats.duration}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Message Types</span>
            <span className="font-medium ml-auto">{stats.types}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleAnalyze}
          className="w-full"
          size="sm"
        >
          <Play className="h-3 w-3 mr-2" />
          Analyze
        </Button>
      </CardContent>
    </Card>
  )
}
