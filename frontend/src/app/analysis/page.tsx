'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { useSessionStore, AnalysisSession } from '@/lib/sessions'

function AnalysisContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token } = useAuth()
  const { sessions, loadSessions, isLoading } = useSessionStore()
  
  const sessionId = searchParams?.get('session_id')
  const [currentSession, setCurrentSession] = useState<AnalysisSession | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 100

  // Mock data - in a real app, this would come from the API
  const [mockMessages] = useState([
    { time: '62.327s', type: 'PAYLOAD_FLOAT', aircraft: '38', fields: 'values' },
    { time: '62.334s', type: 'EFF_MAT_STAB', aircraft: '38', fields: 'G1_roll, G1_pitch, G1_yaw...' },
    { time: '62.334s', type: 'EFF_MAT_GUID', aircraft: '38', fields: 'G1_aN, G1_aE, G1_aD' },
    { time: '62.334s', type: 'AHRS_REF_QUAT', aircraft: '38', fields: 'ref_qi, ref_qx, ref_qy...' },
    { time: '62.336s', type: 'INS_EKF2', aircraft: '38', fields: 'control_mode, filter_fault_status, gps_check_status...' },
  ])

  const [mockMessageTypes] = useState([
    { name: 'ACTUATORS', count: 65676 },
    { name: 'EFF_MAT_STAB', count: 65662 },
    { name: 'EFF_MAT_GUID', count: 65653 },
    { name: 'GPS_LLH_REFA', count: 65643 },
    { name: 'AHRS_REF_QUAT', count: 65643 },
  ])

  useEffect(() => {
    if (token && sessions.length === 0) {
      loadSessions(token)
    }
  }, [token, sessions.length, loadSessions])

  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId)
      if (session) {
        setCurrentSession(session)
      }
    }
  }, [sessionId, sessions])

  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view analysis.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading session...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Session not found.</p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="mt-4"
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalMessages = 549241 // This would come from the session data
  const totalPages = Math.ceil(totalMessages / messagesPerPage)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Analyze your Paparazzi UAV log data</p>
      </div>

        {/* Session Selection */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📊 Session Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={currentSession.id} onValueChange={(value) => router.push(`/analysis?session_id=${value}`)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a session">
                {currentSession.session_name || 'Untitled Session'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.session_name || 'Untitled Session'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">File:</div>
              <div className="font-medium">{currentSession.session_name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Size:</div>
              <div className="font-medium">56.6 MB</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Duration:</div>
              <div className="font-medium">21:56</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Messages:</div>
              <div className="font-medium">{totalMessages.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Aircraft */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              ✈️ Aircraft (62)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Quick Access:</div>
              <Badge variant="secondary" className="mt-1">RW3_AG (549241)</Badge>
            </div>
            <Select defaultValue="all-aircraft">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-aircraft">All Aircraft</SelectItem>
                <SelectItem value="rw3-ag">RW3_AG</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Message Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              # Message Types (52)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Badge>All Types</Badge>
                <Badge variant="outline" className="ml-2">All message types</Badge>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {mockMessageTypes.map((type, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{type.name}</span>
                    <span className="text-muted-foreground">{type.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            # Messages ({totalMessages.toLocaleString()})
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing 1-100 of {totalMessages.toLocaleString()} messages
            </div>
            
            <div className="border rounded-lg">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b font-medium">
                <div>Time</div>
                <div>Type</div>
                <div>Aircraft</div>
                <div>Fields Preview</div>
              </div>
              
              {/* Table Rows */}
              {mockMessages.map((message, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b hover:bg-muted/50">
                  <div className="font-mono text-sm">{message.time}</div>
                  <div>{message.type}</div>
                  <div>{message.aircraft}</div>
                  <div className="text-muted-foreground text-sm truncate">{message.fields}</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-1" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Page</span>
                <Input 
                  className="w-16 h-8 text-center" 
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                />
                <span className="text-sm">of {totalPages.toLocaleString()}</span>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalysisContent />
    </Suspense>
  )
}
