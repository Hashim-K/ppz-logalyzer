'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, TrendingUp, FileText } from 'lucide-react'

interface EmptyAnalysisStateProps {
  className?: string
}

export default function EmptyAnalysisState({ className }: EmptyAnalysisStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex space-x-2 mb-6 opacity-50">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <TrendingUp className="h-12 w-12 text-muted-foreground" />
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">No Session Selected</h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          Select a session from the dropdown above to begin analyzing your UAV log data. 
          You&apos;ll see detailed aircraft information, message timeline, and interactive data visualization.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <span>Session Overview</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span>Aircraft Analytics</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span>Message Timeline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
