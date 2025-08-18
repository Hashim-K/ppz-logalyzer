'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useAuth } from '@/lib/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const { login, isLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  // Handle form validation errors
  const onInvalid = (errors: FieldErrors<LoginFormData>) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof LoginFormData
    const firstError = errors[firstErrorKey]
    if (firstError?.message) {
      const message = firstError.message
      if (message.includes('Username is required')) {
        toast.error('Username required', {
          description: 'Please enter your username.',
          duration: 3000,
        })
      } else if (message.includes('Password is required')) {
        toast.error('Password required', {
          description: 'Please enter your password.',
          duration: 3000,
        })
      } else {
        toast.error('Form validation error', {
          description: message,
          duration: 3000,
        })
      }
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.username, data.password)
    
    if (result.success) {
      toast.success('Login successful!', {
        description: 'Welcome back. Redirecting to home...',
        duration: 3000,
      })
      // Small delay to show the toast before redirect
      setTimeout(() => {
        router.push('/')
      }, 500)
    } else {
      // More specific error toast based on the error type
      const errorMessage = result.error || 'Please check your credentials and try again.'
      
      if (errorMessage.toLowerCase().includes('invalid username or password')) {
        toast.error('Invalid credentials', {
          description: 'The username or password you entered is incorrect. Please try again.',
          duration: 4000,
        })
      } else if (errorMessage.toLowerCase().includes('account is locked')) {
        toast.error('Account locked', {
          description: 'Your account has been locked due to too many failed attempts. Please try again later.',
          duration: 5000,
        })
      } else if (errorMessage.toLowerCase().includes('not active')) {
        toast.error('Account inactive', {
          description: 'Your account is not active. Please contact the administrator.',
          duration: 5000,
        })
      } else if (errorMessage.toLowerCase().includes('too many')) {
        toast.error('Too many attempts', {
          description: 'You have made too many login attempts. Please wait before trying again.',
          duration: 5000,
        })
      } else if (errorMessage.toLowerCase().includes('network')) {
        toast.error('Connection error', {
          description: errorMessage,
          duration: 4000,
        })
      } else if (errorMessage.toLowerCase().includes('server error')) {
        toast.error('Server unavailable', {
          description: 'Our servers are experiencing issues. Please try again in a few minutes.',
          duration: 5000,
        })
      } else {
        toast.error('Login failed', {
          description: errorMessage,
          duration: 4000,
        })
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              {...register('username')}
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          
          <div className="flex flex-col items-center space-y-2 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground">Don&apos;t have an account?</span>
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary/80 underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
