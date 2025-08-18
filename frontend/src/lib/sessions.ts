import { create } from "zustand";
import { persist } from "zustand/middleware";

// Configuration object for analysis sessions and templates
export interface AnalysisConfiguration {
  filters?: Record<string, unknown>;
  chartTypes?: string[];
  parameters?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface AnalysisSession {
  id: string;
  file_id?: string;
  template_id?: string;
  session_name?: string;
  session_config: AnalysisConfiguration;
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface CreateSessionRequest {
  file_id?: string;
  template_id?: string;
  session_name?: string;
  session_config: AnalysisConfiguration;
}

export interface UpdateSessionRequest {
  session_name?: string;
  session_config?: AnalysisConfiguration;
}

export interface AnalysisTemplate {
  id: string;
  name: string;
  description?: string;
  template_config: AnalysisConfiguration;
  is_public: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  template_config: AnalysisConfiguration;
  is_public?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface SessionState {
  sessions: AnalysisSession[];
  templates: AnalysisTemplate[];
  currentSession: AnalysisSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Session CRUD operations
  loadSessions: (token: string) => Promise<boolean>;
  createSession: (token: string, session: CreateSessionRequest) => Promise<AnalysisSession | null>;
  updateSession: (token: string, sessionId: string, updates: UpdateSessionRequest) => Promise<AnalysisSession | null>;
  deleteSession: (token: string, sessionId: string) => Promise<boolean>;
  getSession: (token: string, sessionId: string) => Promise<AnalysisSession | null>;
  
  // Template operations
  loadTemplates: (token: string) => Promise<boolean>;
  createTemplate: (token: string, template: CreateTemplateRequest) => Promise<AnalysisTemplate | null>;
  
  // Local state management
  setCurrentSession: (session: AnalysisSession | null) => void;
  clearError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const createAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
});

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      templates: [],
      currentSession: null,
      isLoading: false,
      error: null,

      loadSessions: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/sessions`, {
            headers: createAuthHeaders(token),
          });

          if (!response.ok) {
            throw new Error(`Failed to load sessions: ${response.statusText}`);
          }

          const result: ApiResponse<AnalysisSession[]> = await response.json();
          
          if (result.success && result.data) {
            set({ sessions: result.data, isLoading: false });
            return true;
          } else {
            throw new Error(result.message || "Failed to load sessions");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      createSession: async (token: string, sessionData: CreateSessionRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/sessions`, {
            method: "POST",
            headers: createAuthHeaders(token),
            body: JSON.stringify(sessionData),
          });

          if (!response.ok) {
            throw new Error(`Failed to create session: ${response.statusText}`);
          }

          const result: ApiResponse<AnalysisSession> = await response.json();
          
          if (result.success && result.data) {
            const newSession = result.data;
            set(state => ({ 
              sessions: [...state.sessions, newSession],
              currentSession: newSession,
              isLoading: false 
            }));
            return newSession;
          } else {
            throw new Error(result.message || "Failed to create session");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      updateSession: async (token: string, sessionId: string, updates: UpdateSessionRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/sessions/${sessionId}`, {
            method: "PUT",
            headers: createAuthHeaders(token),
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error(`Failed to update session: ${response.statusText}`);
          }

          const result: ApiResponse<AnalysisSession> = await response.json();
          
          if (result.success && result.data) {
            const updatedSession = result.data;
            set(state => ({
              sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
              currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession,
              isLoading: false
            }));
            return updatedSession;
          } else {
            throw new Error(result.message || "Failed to update session");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      deleteSession: async (token: string, sessionId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/sessions/${sessionId}`, {
            method: "DELETE",
            headers: createAuthHeaders(token),
          });

          if (!response.ok) {
            throw new Error(`Failed to delete session: ${response.statusText}`);
          }

          const result: ApiResponse<null> = await response.json();
          
          if (result.success) {
            set(state => ({
              sessions: state.sessions.filter(s => s.id !== sessionId),
              currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
              isLoading: false
            }));
            return true;
          } else {
            throw new Error(result.message || "Failed to delete session");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      getSession: async (token: string, sessionId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/sessions/${sessionId}`, {
            headers: createAuthHeaders(token),
          });

          if (!response.ok) {
            throw new Error(`Failed to get session: ${response.statusText}`);
          }

          const result: ApiResponse<AnalysisSession> = await response.json();
          
          if (result.success && result.data) {
            set({ currentSession: result.data, isLoading: false });
            return result.data;
          } else {
            throw new Error(result.message || "Failed to get session");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      loadTemplates: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/templates`, {
            headers: createAuthHeaders(token),
          });

          if (!response.ok) {
            throw new Error(`Failed to load templates: ${response.statusText}`);
          }

          const result: ApiResponse<AnalysisTemplate[]> = await response.json();
          
          if (result.success && result.data) {
            set({ templates: result.data, isLoading: false });
            return true;
          } else {
            throw new Error(result.message || "Failed to load templates");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      createTemplate: async (token: string, templateData: CreateTemplateRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/analysis/templates`, {
            method: "POST",
            headers: createAuthHeaders(token),
            body: JSON.stringify(templateData),
          });

          if (!response.ok) {
            throw new Error(`Failed to create template: ${response.statusText}`);
          }

          const result: ApiResponse<AnalysisTemplate> = await response.json();
          
          if (result.success && result.data) {
            const newTemplate = result.data;
            set(state => ({ 
              templates: [...state.templates, newTemplate],
              isLoading: false 
            }));
            return newTemplate;
          } else {
            throw new Error(result.message || "Failed to create template");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      setCurrentSession: (session: AnalysisSession | null) => {
        set({ currentSession: session });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        currentSession: state.currentSession,
      }),
    }
  )
);
