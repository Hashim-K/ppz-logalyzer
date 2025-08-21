'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { 
  FileX, 
  Database, 
  Search, 
  AlertCircle, 
  Upload,
  BarChart3,
  Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'no-sessions' | 'no-alerts' | 'no-uploads' | 'no-analysis' | 'error' | 'custom'
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const emptyStateConfigs = {
  'no-data': {
    icon: Database,
    title: 'No data available',
    description: 'There is currently no data to display. Try uploading some files or check back later.',
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'We couldn\'t find any results matching your search criteria. Try adjusting your filters or search terms.',
  },
  'no-sessions': {
    icon: FileX,
    title: 'No sessions found',
    description: 'No flight sessions have been uploaded yet. Upload your first flight log to get started.',
    defaultAction: {
      label: 'Upload Files',
      variant: 'default' as const
    }
  },
  'no-alerts': {
    icon: Bell,
    title: 'No alerts configured',
    description: 'Create your first alert rule to monitor your flight data and get notified of important events.',
    defaultAction: {
      label: 'Create Alert',
      variant: 'default' as const
    }
  },
  'no-uploads': {
    icon: Upload,
    title: 'No files uploaded',
    description: 'Upload your flight logs to start analyzing your drone data and generate insights.',
    defaultAction: {
      label: 'Upload Files',
      variant: 'default' as const
    }
  },
  'no-analysis': {
    icon: BarChart3,
    title: 'No analysis data',
    description: 'Analysis data will appear here once you upload and process your flight logs.',
  },
  'error': {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'We encountered an error while loading your data. Please try refreshing the page.',
    defaultAction: {
      label: 'Retry',
      variant: 'outline' as const
    }
  }
}

export function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = 'md'
}: EmptyStateProps) {
  const config = emptyStateConfigs[type] || emptyStateConfigs['no-data']
  const Icon = icon ? () => icon : config.icon
  
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalAction = action || (config.defaultAction ? {
    ...config.defaultAction,
    onClick: () => console.log(`Default ${type} action clicked`)
  } : undefined)

  const sizeClasses = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-12'
  }

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className={cn('text-center', sizeClasses[size])}>
        <div className={cn('mx-auto w-fit p-4 bg-muted rounded-full mb-4', size === 'lg' && 'p-6')}>
          <Icon className={cn('text-muted-foreground', iconSizes[size])} />
        </div>
        
        <CardTitle className={cn('mb-2', titleSizes[size])}>
          {finalTitle}
        </CardTitle>
        
        <CardDescription className={cn('mb-6 max-w-md mx-auto', size === 'lg' && 'text-base')}>
          {finalDescription}
        </CardDescription>
        
        {(finalAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {finalAction && (
              <Button
                onClick={finalAction.onClick}
                variant={finalAction.variant || 'default'}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {finalAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'outline'}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized empty state components for common use cases
export function NoSessionsFound({ onUpload, onRefresh, className }: { 
  onUpload?: () => void
  onRefresh?: () => void
  className?: string 
}) {
  return (
    <EmptyState
      type="no-sessions"
      action={onUpload ? { label: 'Upload Files', onClick: onUpload } : undefined}
      secondaryAction={onRefresh ? { label: 'Refresh', onClick: onRefresh, variant: 'outline' } : undefined}
      className={className}
    />
  )
}

export function NoSearchResults({ query, onClear, className }: { 
  query?: string
  onClear?: () => void
  className?: string 
}) {
  return (
    <EmptyState
      type="no-results"
      title="No results found"
      description={query ? `No results found for "${query}". Try a different search term.` : undefined}
      action={onClear ? { label: 'Clear Search', onClick: onClear, variant: 'outline' } : undefined}
      className={className}
      size="sm"
    />
  )
}

export function NoAlertsConfigured({ onCreate, className }: { 
  onCreate?: () => void
  className?: string 
}) {
  return (
    <EmptyState
      type="no-alerts"
      action={onCreate ? { label: 'Create First Alert', onClick: onCreate } : undefined}
      className={className}
    />
  )
}

export function ErrorState({ onRetry, message, className }: { 
  onRetry?: () => void
  message?: string
  className?: string 
}) {
  return (
    <EmptyState
      type="error"
      description={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry, variant: 'outline' } : undefined}
      className={className}
    />
  )
}
