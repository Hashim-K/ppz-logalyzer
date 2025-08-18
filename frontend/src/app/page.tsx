'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn, UserPlus, BarChart3, FileText, Shield } from "lucide-react"
import { useAuth } from '@/lib/auth'

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, don't render the landing page (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">PPZ Logalyzer</h1>
          </div>
          <div className="space-x-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Register
              </Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Analyze UAV Logs with 
            <span className="text-blue-600 dark:text-blue-400"> Intelligence</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Advanced telemetry analysis for Paparazzi UAV flights. Upload, process, and visualize 
            your flight data with powerful analytics and real-time insights.
          </p>
          <div className="space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started Free
                <UserPlus className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign In
                <LogIn className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Powerful Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Log Processing</CardTitle>
              <CardDescription>
                Automatically parse and process Paparazzi UAV log files with intelligent 
                format detection and error handling.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Real-time Analytics</CardTitle>
              <CardDescription>
                Visualize flight telemetry data with interactive charts, graphs, and 
                real-time monitoring capabilities.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Enterprise-grade security with encrypted data storage, user authentication, 
                and reliable cloud infrastructure.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 py-16 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Start Analyzing?
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join researchers and engineers who trust PPZ Logalyzer for their UAV data analysis needs.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Create Your Account
              <UserPlus className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-900 border-t">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 PPZ Logalyzer. Built for the UAV research community.</p>
        </div>
      </footer>
    </div>
  )
}
