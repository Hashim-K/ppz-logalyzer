'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/register-form'
import { useAuth } from '@/lib/auth'

export default function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // Don't render the form if already authenticated (prevents flash)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  )
}
