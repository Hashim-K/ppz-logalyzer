'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useSessionStore, AnalysisSession } from '@/lib/sessions'
import { useAuth } from '@/lib/auth'

interface SessionSelectorProps {
  onSessionSelect: (session: AnalysisSession | null) => void
  selectedSessionId?: string
  className?: string
}

export default function SessionSelector({ 
  onSessionSelect, 
  selectedSessionId, 
  className 
}: SessionSelectorProps) {
  const { token } = useAuth()
  const { sessions, isLoading, loadSessions } = useSessionStore()
  const [selectedValue, setSelectedValue] = useState<string>(selectedSessionId || '')

  useEffect(() => {
    if (token) {
      loadSessions(token)
    }
  }, [token, loadSessions])

  useEffect(() => {
    setSelectedValue(selectedSessionId || '')
  }, [selectedSessionId])

  const handleValueChange = (value: string) => {
    setSelectedValue(value)
    if (value === 'none') {
      onSessionSelect(null)
    } else {
      const session = sessions.find(s => s.id === value)
      onSessionSelect(session || null)
    }
  }

  if (!token) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Please log in to view sessions" />
        </SelectTrigger>
      </Select>
    )
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading sessions...</span>
          </div>
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a session to analyze" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No session selected</SelectItem>
        {sessions.map((session) => (
          <SelectItem key={session.id} value={session.id}>
            <div className="flex flex-col items-start">
              <span>{session.session_name || 'Untitled Session'}</span>
              {session.created_at && (
                <span className="text-xs text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
