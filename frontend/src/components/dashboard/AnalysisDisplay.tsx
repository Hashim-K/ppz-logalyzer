'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, FileText, Clock, BarChart3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnalysisSession } from '@/lib/sessions'
import { formatDistanceToNow } from 'date-fns'

interface AnalysisDisplayProps {
  session: AnalysisSession
  className?: string
}

export default function AnalysisDisplay({ session, className }: AnalysisDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 100

  // Mock data - TODO: Replace with real API calls
  const mockMessages = [
    { time: '62.327s', type: 'PAYLOAD_FLOAT', aircraft: '38', fields: 'values' },
    { time: '62.334s', type: 'EFF_MAT_STAB', aircraft: '38', fields: 'G1_roll, G1_pitch, G1_yaw...' },
    { time: '62.334s', type: 'EFF_MAT_GUID', aircraft: '38', fields: 'G1_aN, G1_aE, G1_aD' },
    { time: '62.334s', type: 'AHRS_REF_QUAT', aircraft: '38', fields: 'ref_qi, ref_qx, ref_qy...' },
    { time: '62.336s', type: 'INS_EKF2', aircraft: '38', fields: 'control_mode, filter_fault_status, gps_check_status...' },
    { time: '62.340s', type: 'ACTUATORS', aircraft: '38', fields: 'actuator_values' },
    { time: '62.345s', type: 'GPS_LLH_REFA', aircraft: '38', fields: 'lat, lon, hmsl, course' },
  ]

  const mockMessageTypes = [
    { name: 'ACTUATORS', count: 65676 },
    { name: 'EFF_MAT_STAB', count: 65662 },
    { name: 'EFF_MAT_GUID', count: 65653 },
    { name: 'GPS_LLH_REFA', count: 65643 },
    { name: 'AHRS_REF_QUAT', count: 65643 },
  ]

  const totalMessages = 549241 // This would come from the session data
  const totalPages = Math.ceil(totalMessages / messagesPerPage)

  const filteredMessages = mockMessages.filter(message =>
    message.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.aircraft.includes(searchQuery) ||
    message.fields.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Session Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Session Name</div>
              <div className="font-medium">{session.session_name || 'Untitled Session'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">
                {session.created_at ? formatDistanceToNow(new Date(session.created_at), { addSuffix: true }) : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Messages</div>
              <div className="font-medium">{totalMessages.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Aircraft Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🛩️ Aircraft Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Aircraft 38</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Messages: 549,241 | Last: 2min ago
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              📊 Message Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockMessageTypes.slice(0, 5).map((type) => (
                <div key={type.name} className="flex justify-between items-center text-sm">
                  <span>{type.name}</span>
                  <Badge variant="outline">{type.count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-medium">15min 43s</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg Messages/sec</div>
              <div className="font-medium">584.2</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">File Size</div>
              <div className="font-medium">47.2 MB</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Messages
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Message Types</SelectItem>
                {mockMessageTypes.map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.name} ({type.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>Time</div>
              <div>Message Type</div>
              <div>Aircraft</div>
              <div>Fields</div>
            </div>
            
            {filteredMessages.map((message, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-muted/30">
                <div className="font-mono">{message.time}</div>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {message.type}
                  </Badge>
                </div>
                <div>{message.aircraft}</div>
                <div className="text-muted-foreground truncate">{message.fields}</div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * messagesPerPage) + 1} to {Math.min(currentPage * messagesPerPage, totalMessages)} of {totalMessages.toLocaleString()} messages
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
