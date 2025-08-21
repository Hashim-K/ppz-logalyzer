'use client'

import React, { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string | number | boolean) => string | null
  message?: string
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  description?: string
  validation?: ValidationRule
  options?: { value: string; label: string }[]
  rows?: number
  disabled?: boolean
}

export interface FormError {
  field: string
  message: string
}

type FormValue = string | number | boolean

interface ValidatedFormProps {
  title?: string
  description?: string
  fields: FormField[]
  values: Record<string, FormValue>
  errors: FormError[]
  isSubmitting: boolean
  submitLabel?: string
  onSubmit: (values: Record<string, FormValue>) => void
  onChange: (name: string, value: FormValue) => void
  onValidate?: (name: string, value: FormValue) => string | null
  className?: string
  children?: ReactNode
}

export function ValidatedForm({
  title,
  description,
  fields,
  values,
  errors,
  isSubmitting,
  submitLabel = 'Submit',
  onSubmit,
  onChange,
  onValidate,
  className,
  children
}: ValidatedFormProps) {
  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message
  }

  const validateField = (field: FormField, value: FormValue): string | null => {
    const { validation } = field
    if (!validation) return null

    // Required validation
    if (validation.required && (!value || value.toString().trim() === '')) {
      return validation.message || `${field.label} is required`
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') return null

    // Min length validation
    if (validation.minLength && value.toString().length < validation.minLength) {
      return validation.message || `${field.label} must be at least ${validation.minLength} characters`
    }

    // Max length validation
    if (validation.maxLength && value.toString().length > validation.maxLength) {
      return validation.message || `${field.label} must be no more than ${validation.maxLength} characters`
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.test(value.toString())) {
      return validation.message || `${field.label} format is invalid`
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value)
    }

    return null
  }

  const handleFieldChange = (field: FormField, value: FormValue) => {
    onChange(field.name, value)
    
    // Validate on change if validation function provided
    if (onValidate) {
      const error = validateField(field, value)
      if (error) {
        onValidate(field.name, value)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields before submission
    const validationErrors: FormError[] = []
    
    fields.forEach(field => {
      const error = validateField(field, values[field.name])
      if (error) {
        validationErrors.push({ field: field.name, message: error })
      }
    })

    if (validationErrors.length === 0) {
      onSubmit(values)
    }
  }

  const renderField = (field: FormField) => {
    const fieldError = getFieldError(field.name)
    const value = values[field.name] || ''
    const hasError = !!fieldError

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={value.toString()}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            disabled={field.disabled || isSubmitting}
            className={cn(hasError && 'border-red-500 focus:border-red-500')}
          />
        )

      case 'select':
        return (
          <Select
            value={value.toString()}
            onValueChange={(val) => handleFieldChange(field, val)}
            disabled={field.disabled || isSubmitting}
          >
            <SelectTrigger className={cn(hasError && 'border-red-500 focus:border-red-500')}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
              disabled={field.disabled || isSubmitting}
              className={cn(hasError && 'border-red-500')}
            />
            <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {field.label}
            </Label>
          </div>
        )

      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={value.toString()}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled || isSubmitting}
            className={cn(hasError && 'border-red-500 focus:border-red-500')}
          />
        )
    }
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => {
            const fieldError = getFieldError(field.name)
            
            if (field.type === 'checkbox') {
              return (
                <div key={field.name} className="space-y-2">
                  {renderField(field)}
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                  {fieldError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {fieldError}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                  {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {field.description && !fieldError && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
                {fieldError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {fieldError}
                  </div>
                )}
              </div>
            )
          })}
          
          {children && (
            <div className="space-y-4">
              {children}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Utility function for common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  noSpaces: /^\S+$/,
}

// Common validation rules
export const commonValidation = {
  required: { required: true },
  email: { required: true, pattern: validationPatterns.email, message: 'Please enter a valid email address' },
  password: { required: true, minLength: 6, message: 'Password must be at least 6 characters' },
  name: { required: true, minLength: 2, maxLength: 50 },
  url: { pattern: validationPatterns.url, message: 'Please enter a valid URL' },
}
