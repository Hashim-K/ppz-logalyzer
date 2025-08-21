'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SessionCard from '@/components/sessions/SessionCard'
import SessionsEmptyState from '@/components/sessions/SessionsEmptyState'
import { AnalysisSessionResponse } from '@/types/api'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AnalysisSessionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/analysis/sessions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      
      const data = await response.json()
      setSessions(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/analysis/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete session')
      }
      
      // Remove the session from the list
      setSessions(prev => prev.filter(session => session.id !== sessionId))
    } catch (err) {
      console.error('Error deleting session:', err)
      // TODO: Add toast notification for error
    }
  }

  const handleRefresh = () => {
    fetchSessions()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">📊 Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Manage your processed log sessions
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `Found ${sessions.length} sessions`}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && sessions.length === 0 ? (
        <SessionsEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
