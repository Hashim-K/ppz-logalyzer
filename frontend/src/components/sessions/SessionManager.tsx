'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Trash2, 
  Play, 
  Calendar,
  Settings,
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSessionStore, AnalysisSession, CreateTemplateRequest } from '@/lib/sessions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function SessionManager() {
  const { token } = useAuth()
  const {
    sessions,
    templates,
    currentSession,
    isLoading,
    error,
    loadSessions,
    loadTemplates,
    createTemplate,
    deleteSession,
    setCurrentSession,
    clearError
  } = useSessionStore()

  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('sessions')

  // Form states
  const [templateForm, setTemplateForm] = useState<CreateTemplateRequest>({
    name: '',
    description: '',
    template_config: {},
    is_public: false
  })

  // Load data on mount
  useEffect(() => {
    if (token) {
      loadSessions(token)
      loadTemplates(token)
    }
  }, [token, loadSessions, loadTemplates])

  // Clear error on tab change
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [activeTab, clearError, error])

  const handleCreateTemplate = async () => {
    if (!token) return

    if (!templateForm.name.trim()) {
      toast.error('Template name is required')
      return
    }

    const template = await createTemplate(token, {
      ...templateForm,
      template_config: templateForm.template_config || {}
    })

    if (template) {
      toast.success('Template created successfully')
      setIsCreateTemplateOpen(false)
      setTemplateForm({ name: '', description: '', template_config: {}, is_public: false })
    } else {
      toast.error('Failed to create template')
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!token) return

    const success = await deleteSession(token, sessionId)
    if (success) {
      toast.success('Session deleted successfully')
    } else {
      toast.error('Failed to delete session')
    }
  }

  const handleLoadSession = (session: AnalysisSession) => {
    setCurrentSession(session)
    toast.success(`Loaded session: ${session.session_name || 'Untitled Session'}`)
  }

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please log in to manage sessions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Session Display */}
      {currentSession && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-primary" />
                  Current Session
                </CardTitle>
                <CardDescription>
                  Active analysis session
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentSession(null)}
              >
                Close Session
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-semibold">{currentSession.session_name || 'Untitled Session'}</h4>
              <div className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(currentSession.created_at))} ago
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions and Templates Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Sessions</CardTitle>
          <CardDescription>
            Sessions are automatically created when you upload log and data file pairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sessions">My Sessions</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Analysis Sessions</h3>
                <div className="text-sm text-muted-foreground">
                  Sessions are created automatically when you upload file pairs
                </div>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No sessions found. Create your first session to get started.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold">{session.session_name || 'Untitled Session'}</h4>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(session.created_at))} ago
                              </span>
                              {session.file_id && (
                                <span>File ID: {session.file_id.substring(0, 8)}...</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadSession(session)}
                              disabled={currentSession?.id === session.id}
                            >
                              {currentSession?.id === session.id ? (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Load
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Analysis Templates</h3>
                <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Template</DialogTitle>
                      <DialogDescription>
                        Create a reusable analysis template
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter template name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-description">Description (optional)</Label>
                        <Textarea
                          id="template-description"
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter template description"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTemplate} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No templates found. Create templates to reuse configurations.</p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            {template.description && (
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(new Date(template.created_at))} ago
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Template
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
