'use client'

import { useRouter } from 'next/navigation'
import { Upload, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function SessionsEmptyState() {
  const router = useRouter()

  const handleGoToUpload = () => {
    router.push('/upload')
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">🛩️ No Sessions Found</h3>
          
          <p className="text-muted-foreground mb-6 max-w-sm">
            Upload log files to get started with analyzing your PaparazziUAV telemetry data
          </p>
          
          <Button 
            onClick={handleGoToUpload}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Go to Upload
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
