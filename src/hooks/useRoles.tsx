import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export type UserRole = 'seller' | 'executive' | 'super_admin' | 'closer' | 'sdr' | 'bdr' | 'traffic_manager'

interface UserRoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

export function useRoles() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [isExecutive, setIsExecutive] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const mountedRef = useRef(true)
  const lastUserIdRef = useRef<string | null>(null)

  const fetchUserRoles = useCallback(async () => {
    if (!user || !mountedRef.current) {
      setRoles([])
      setIsExecutive(false)
      setIsSuperAdmin(false)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching user roles:', error)
        return
      }

      if (!mountedRef.current) return

      const userRoles = (data?.map(r => r.role) || ['seller']) as UserRole[]
      setRoles(userRoles)
      setIsExecutive(userRoles.includes('executive') || userRoles.includes('super_admin'))
      setIsSuperAdmin(userRoles.includes('super_admin'))
    } catch (error) {
      console.error('Error in fetchUserRoles:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [user?.id])

  useEffect(() => {
    // Evitar refetching desnecessário
    if (lastUserIdRef.current !== user?.id) {
      lastUserIdRef.current = user?.id || null
      fetchUserRoles()
    }
    
    return () => {
      mountedRef.current = false
    }
  }, [user?.id, fetchUserRoles])

  const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles])

  return {
    roles,
    isExecutive,
    isSuperAdmin,
    loading,
    hasRole,
    refetch: fetchUserRoles
  }
}

export function useAllUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllUsers = async () => {
    try {
      // Buscar todos os perfis de usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      // Buscar todos os roles de usuários
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, can_view_sales')

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        return
      }

      // Criar mapa de roles por user_id
      const rolesMap = new Map<string, string[]>()
      rolesData?.forEach(roleEntry => {
        const existingRoles = rolesMap.get(roleEntry.user_id) || []
        existingRoles.push(roleEntry.role)
        rolesMap.set(roleEntry.user_id, existingRoles)
      })

      // Buscar emails dos usuários via profiles (display_name) + last_seen_at
      // Combinar perfis com roles
      const mappedUsers = (profilesData || []).map((profile: any) => {
        const userRoles = (rolesMap.get(profile.user_id) || ['seller']) as string[]
        const roleEntry = rolesData?.find(r => r.user_id === profile.user_id)

        return {
          ...profile,
          roles: userRoles,
          role: userRoles[0],
          can_view_sales: (roleEntry as any)?.can_view_sales ?? false,
          email: profile.email || null,
        }
      })

      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error in fetchAllUsers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllUsers()
  }, [])

  return {
    users,
    loading,
    refetch: fetchAllUsers
  }
}