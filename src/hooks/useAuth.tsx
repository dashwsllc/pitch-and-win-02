import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const lastUserIdRef = useRef<string | null>(null)

  // Função para limpar heartbeat de forma segura
  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  // Função otimizada para atualizar last_seen
  const updateLastSeen = useCallback(async (uid: string) => {
    try {
      if (!mountedRef.current) return
      
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', uid)
    } catch (e) {
      console.error('Erro ao atualizar last_seen_at', e)
    }
  }, [])

  // Função para configurar heartbeat
  const setupHeartbeat = useCallback((uid: string) => {
    clearHeartbeat()
    if (mountedRef.current) {
      heartbeatRef.current = setInterval(() => {
        if (mountedRef.current) {
          updateLastSeen(uid)
        }
      }, 300_000) // 5 minutos
    }
  }, [clearHeartbeat, updateLastSeen])

  useEffect(() => {
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // Configurar listener primeiro
        authSubscription = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mountedRef.current) return

            console.log('Auth event:', event)
            
            const newUser = session?.user ?? null
            const userId = newUser?.id

            // Evitar atualizações desnecessárias
            if (lastUserIdRef.current !== userId) {
              setSession(session)
              setUser(newUser)
              lastUserIdRef.current = userId
              
              if (event === 'SIGNED_IN' && userId) {
                // Configurar heartbeat apenas para novos logins
                setTimeout(() => {
                  if (mountedRef.current) {
                    updateLastSeen(userId)
                    setupHeartbeat(userId)
                  }
                }, 100)
              } else if (event === 'SIGNED_OUT') {
                clearHeartbeat()
                lastUserIdRef.current = null
              }
            }
            
            setLoading(false)
          }
        )

        // Buscar sessão inicial
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mountedRef.current) {
          const userId = session?.user?.id
          setSession(session)
          setUser(session?.user ?? null)
          lastUserIdRef.current = userId ?? null
          
          if (userId) {
            updateLastSeen(userId)
            setupHeartbeat(userId)
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mountedRef.current = false
      clearHeartbeat()
      if (authSubscription) {
        authSubscription.data?.subscription?.unsubscribe()
      }
    }
  }, [clearHeartbeat, setupHeartbeat, updateLastSeen])

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signOut = useCallback(async () => {
    try {
      clearHeartbeat()
      
      // Fazer logout de forma simples
      await supabase.auth.signOut()
      
      // Limpar estado local
      setUser(null)
      setSession(null)
      lastUserIdRef.current = null
      
      // Redirecionar
      window.location.href = '/auth'
    } catch (error) {
      console.error('Error during logout:', error)
      // Limpar estado mesmo com erro
      clearHeartbeat()
      setUser(null)
      setSession(null)
      lastUserIdRef.current = null
      window.location.href = '/auth'
    }
  }, [clearHeartbeat])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signUp,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}