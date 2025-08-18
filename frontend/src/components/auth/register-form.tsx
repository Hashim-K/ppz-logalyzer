'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
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

import { useAuth, checkUsernameAvailability, checkEmailAvailability } from '@/lib/auth'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [usernameAvailability, setUsernameAvailability] = useState<{ available: boolean | null; message: string; checking: boolean }>({
    available: null,
    message: '',
    checking: false,
  })
  const [emailAvailability, setEmailAvailability] = useState<{ available: boolean | null; message: string; checking: boolean }>({
    available: null,
    message: '',
    checking: false,
  })
  
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const watchedUsername = watch('username')
  const watchedEmail = watch('email')

  // Debounced availability checking
  useEffect(() => {
    const checkUsernameDebounced = async () => {
      if (watchedUsername && watchedUsername.length >= 3) {
        setUsernameAvailability(prev => ({ ...prev, checking: true }))
        const result = await checkUsernameAvailability(watchedUsername)
        setUsernameAvailability({
          available: result.available,
          message: result.message,
          checking: false,
        })
      } else {
        setUsernameAvailability({ available: null, message: '', checking: false })
      }
    }

    const timeoutId = setTimeout(checkUsernameDebounced, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedUsername])

  useEffect(() => {
    const checkEmailDebounced = async () => {
      if (watchedEmail && watchedEmail.includes('@')) {
        setEmailAvailability(prev => ({ ...prev, checking: true }))
        const result = await checkEmailAvailability(watchedEmail)
        setEmailAvailability({
          available: result.available,
          message: result.message,
          checking: false,
        })
      } else {
        setEmailAvailability({ available: null, message: '', checking: false })
      }
    }

    const timeoutId = setTimeout(checkEmailDebounced, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedEmail])

  // Handle form validation errors
  const onInvalid = (errors: FieldErrors<RegisterFormData>) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof RegisterFormData
    const firstError = errors[firstErrorKey]
    if (firstError?.message) {
      const message = firstError.message
      if (message.includes("don't match")) {
        toast.error('Passwords do not match', {
          description: 'Please make sure both password fields are identical.',
          duration: 4000,
        })
      } else if (message.includes('valid email')) {
        toast.error('Invalid email format', {
          description: 'Please enter a valid email address (e.g., user@example.com)',
          duration: 4000,
        })
      } else if (message.includes('Username must be at least')) {
        toast.error('Username too short', {
          description: 'Username must be at least 3 characters long.',
          duration: 4000,
        })
      } else if (message.includes('Password must be at least')) {
        toast.error('Password too weak', {
          description: 'Password must be at least 8 characters long.',
          duration: 4000,
        })
      } else if (message.includes('contain at least one')) {
        toast.error('Password requirements not met', {
          description: 'Password must contain uppercase, lowercase letters, and numbers.',
          duration: 5000,
        })
      } else if (message.includes('only contain')) {
        toast.error('Invalid username format', {
          description: 'Username can only contain letters, numbers, underscores, and hyphens.',
          duration: 4000,
        })
      } else {
        toast.error('Form validation error', {
          description: message,
          duration: 4000,
        })
      }
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    console.log('Form data received:', data);
    console.log('Calling registerUser with:', {
      username: data.username,
      email: data.email,
      password: data.password
    });
    
    const result = await registerUser(data.username, data.email, data.password)
    
    if (result.success) {
      toast.success('Account created successfully!', {
        description: 'Welcome to PPZ Logalyzer. Redirecting to dashboard...',
        duration: 3000,
      })
      // Small delay to show the toast before redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } else {
      // More specific error toast based on the error type
      const errorMessage = result.error || 'Please check your information and try again.'
      
      if (errorMessage.toLowerCase().includes('username already exists')) {
        toast.error('Username taken', {
          description: 'This username is already taken. Please choose a different one.',
          duration: 4000,
        })
      } else if (errorMessage.toLowerCase().includes('email already exists')) {
        toast.error('Email already registered', {
          description: 'This email is already registered. Try logging in instead.',
          duration: 4000,
        })
      } else if (errorMessage.toLowerCase().includes('password must be')) {
        toast.error('Weak password', {
          description: errorMessage,
          duration: 5000,
        })
      } else if (errorMessage.toLowerCase().includes('valid email')) {
        toast.error('Invalid email format', {
          description: 'Please enter a valid email address (e.g., user@example.com)',
          duration: 4000,
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
        toast.error('Registration failed', {
          description: errorMessage,
          duration: 4000,
        })
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      
            <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register('username')}
                disabled={isLoading}
                className={
                  usernameAvailability.available === false
                    ? "border-destructive"
                    : usernameAvailability.available === true
                    ? "border-green-500"
                    : ""
                }
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {usernameAvailability.checking && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!usernameAvailability.checking && usernameAvailability.available === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {!usernameAvailability.checking && usernameAvailability.available === false && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
            {!errors.username && usernameAvailability.message && (
              <p className={`text-sm ${
                usernameAvailability.available === true 
                  ? "text-green-600" 
                  : usernameAvailability.available === false 
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}>
                {usernameAvailability.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                disabled={isLoading}
                className={
                  emailAvailability.available === false
                    ? "border-destructive"
                    : emailAvailability.available === true
                    ? "border-green-500"
                    : ""
                }
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {emailAvailability.checking && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!emailAvailability.checking && emailAvailability.available === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {!emailAvailability.checking && emailAvailability.available === false && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            {!errors.email && emailAvailability.message && (
              <p className={`text-sm ${
                emailAvailability.available === true 
                  ? "text-green-600" 
                  : emailAvailability.available === false 
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}>
                {emailAvailability.message}
              </p>
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
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              isLoading || 
              usernameAvailability.checking || 
              emailAvailability.checking ||
              usernameAvailability.available === false || 
              emailAvailability.available === false
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          
          <div className="flex items-center justify-center space-x-1 text-sm">
            <span className="text-muted-foreground">Already have an account?</span>
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
