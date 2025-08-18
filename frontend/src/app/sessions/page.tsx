'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Navigation from '@/components/Navigation'
import SessionManager from '@/components/sessions/SessionManager'

export default function SessionsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Sessions</h1>
            <p className="text-muted-foreground">
              Manage your analysis sessions, create new ones, and load existing sessions for detailed analysis.
            </p>
          </div>

          {/* Session Manager */}
          <SessionManager />
        </div>
      </main>
    </div>
  )
}
