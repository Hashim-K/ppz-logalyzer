'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import SessionSelector from '@/components/ui/SessionSelector'
import EmptyAnalysisState from '@/components/dashboard/EmptyAnalysisState'
import AnalysisLoadingState from '@/components/dashboard/AnalysisLoadingState'
import AnalysisDisplay from '@/components/dashboard/AnalysisDisplay'
import { AnalysisSession } from '@/lib/sessions'
import { BarChart3 } from 'lucide-react'

function DashboardContent() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null)
  const [isLoadingSessionData, setIsLoadingSessionData] = useState(false)
  
  // Get session_id from URL if present (for backward compatibility)
  const urlSessionId = searchParams?.get('session_id')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  // Handle session selection
  const handleSessionSelect = async (session: AnalysisSession | null) => {
    setSelectedSession(session)
    
    if (session) {
      // Update URL to reflect selected session
      const url = new URL(window.location.href)
      url.searchParams.set('session_id', session.id)
      router.push(url.pathname + url.search)
      
      // Simulate loading session data
      setIsLoadingSessionData(true)
      // TODO: Replace with actual API call to load session data
      setTimeout(() => {
        setIsLoadingSessionData(false)
      }, 1000)
    } else {
      // Remove session_id from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('session_id')
      router.push(url.pathname + url.search)
    }
  }

  // Show loading or return null while redirecting
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Analysis</h1>
              <p className="text-muted-foreground">Analyze your Paparazzi UAV log data</p>
            </div>
          </div>

          {/* Session Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Session Analysis</CardTitle>
              <CardDescription>
                Select a session to view detailed analysis, aircraft information, and message timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionSelector
                onSessionSelect={handleSessionSelect}
                selectedSessionId={urlSessionId || undefined}
                className="w-full max-w-md"
              />
            </CardContent>
          </Card>

          {/* Content Area */}
          {isLoadingSessionData ? (
            <AnalysisLoadingState />
          ) : selectedSession ? (
            <AnalysisDisplay session={selectedSession} />
          ) : (
            <EmptyAnalysisState />
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
