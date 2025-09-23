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
  let heartbeat: NodeJS.Timeout | undefined

  useEffect(() => {
    let mounted = true

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
          // Se houver erro na sessão, limpar tudo
          if (mounted) {
            setSession(null)
            setUser(null)
            setLoading(false)
          }
          return
        }
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Gerenciar heartbeat e verificações de usuário
        if (event === 'SIGNED_IN' && session?.user?.id) {
          const uid = session.user.id
          
          try {
            // Verificar se usuário não está suspenso
            const { data: profile } = await supabase
              .from('profiles')
              .select('suspended')
              .eq('user_id', uid)
              .single()

            if (profile?.suspended) {
              console.log('User is suspended, forcing logout')
              await supabase.auth.signOut()
              return
            }

            // Atualizar last_seen_at
            await updateLastSeen(uid)
            
            // Configurar heartbeat
            if (heartbeat) clearInterval(heartbeat)
            heartbeat = setInterval(() => updateLastSeen(uid), 300_000)
          } catch (error) {
            console.error('Error in auth state change:', error)
          }
        }
        
        if (event === 'SIGNED_OUT') {
          if (heartbeat) clearInterval(heartbeat)
          heartbeat = undefined
          setUser(null)
          setSession(null)
        }
      }
    )

    initializeAuth()

    return () => {
      mounted = false
      if (heartbeat) clearInterval(heartbeat)
      heartbeat = undefined
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
    try {
      // Limpar estado local primeiro para evitar loops
      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeat = undefined
      }
      
      // Tentar fazer logout do Supabase com timeout
      const logoutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      )
      
      try {
        await Promise.race([logoutPromise, timeoutPromise])
      } catch (error) {
        console.warn('Logout warning (proceeding anyway):', error)
      }
      
      // Limpar estado sempre
      setUser(null)
      setSession(null)
      
      // Redirecionar para auth sempre
      window.location.href = '/auth'
    } catch (error) {
      console.error('Error during logout:', error)
      // Mesmo com erro, limpar estado e redirecionar
      setUser(null)
      setSession(null)
      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeat = undefined
      }
      window.location.href = '/auth'
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