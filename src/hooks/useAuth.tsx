import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  useEffect(() => {
    let mounted = true
    let heartbeat: number | undefined

    const updateLastSeen = async (uid: string) => {
      try {
        // Só atualiza se passou mais de 1 minuto desde a última atualização
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_seen_at')
          .eq('user_id', uid)
          .single()

        if (profile) {
          const lastSeen = new Date(profile.last_seen_at)
          const now = new Date()
          const timeDiff = now.getTime() - lastSeen.getTime()
          
          // Só atualiza se passou mais de 60 segundos (1 minuto)
          if (timeDiff > 60000) {
            await supabase
              .from('profiles')
              .update({ last_seen_at: now.toISOString() })
              .eq('user_id', uid)
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar last_seen_at', e)
      }
    }

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting initial session:', error)
        }
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          // Não atualiza last_seen_at na inicialização, apenas quando há login ativo
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
        // controlar heartbeat sem bloquear o callback
        if (event === 'SIGNED_IN') {
          const uid = session?.user?.id
          if (uid) {
            // Só atualiza no login real, não no refresh de token
            setTimeout(() => {
              updateLastSeen(uid)
            }, 0)
            if (heartbeat) window.clearInterval(heartbeat)
            // Atualiza a cada 5 minutos em vez de 1 minuto para ser mais preciso
            heartbeat = window.setInterval(() => updateLastSeen(uid), 300_000)
          }
        }
        if (event === 'SIGNED_OUT') {
          if (heartbeat) window.clearInterval(heartbeat)
        }
      }
    )

    initializeAuth()

    return () => {
      mounted = false
      if (heartbeat) window.clearInterval(heartbeat)
      subscription.unsubscribe()
    }
  }, [])

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

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setSession(null)
      // The auth state change will handle redirect automatically
    }
  }

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