import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export type UserRole = 'seller' | 'executive'

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

  useEffect(() => {
    let mounted = true
    
    if (!user) {
      setRoles([])
      setIsExecutive(false)
      setIsSuperAdmin(false)
      setLoading(false)
      return
    }

    const fetchRoles = async () => {
      if (mounted) {
        await fetchUserRoles()
      }
    }
    
    fetchRoles()
    return () => { mounted = false }
  }, [user?.id]) // Usar apenas user.id para evitar loops

  const fetchUserRoles = async () => {
    if (!user) return

    try {
      // Verificar se é o super admin (email específico)
      const isSuperAdminUser = user.email === 'fecass1507@icloud.com'
      setIsSuperAdmin(isSuperAdminUser)

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching user roles:', error)
        return
      }

      const userRoles = (data?.map(r => r.role) || ['seller']) as UserRole[]
      setRoles(userRoles)
      
      // Ser executive requer ter o role E ser autorizado pelo super admin (ou ser o próprio super admin)
      const hasExecutiveRole = userRoles.includes('executive' as UserRole)
      setIsExecutive(isSuperAdminUser || hasExecutiveRole)
    } catch (error) {
      console.error('Error in fetchUserRoles:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (role: UserRole) => roles.includes(role)

  return {
    roles,
    isExecutive,
    isSuperAdmin,
    hasRole,
    loading,
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
        .select('user_id, role')

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        return
      }

      console.log('Profiles data:', profilesData)
      console.log('Roles data:', rolesData)

      // Criar mapa de roles por user_id
      const rolesMap = new Map<string, string[]>()
      rolesData?.forEach(roleEntry => {
        const existingRoles = rolesMap.get(roleEntry.user_id) || []
        existingRoles.push(roleEntry.role)
        rolesMap.set(roleEntry.user_id, existingRoles)
      })

      // Combinar perfis com roles
      const mappedUsers = (profilesData || []).map((profile: any) => {
        const userRoles = (rolesMap.get(profile.user_id) || ['seller']) as string[]
        
        return {
          ...profile,
          roles: userRoles,
          role: userRoles[0]
        }
      })

      console.log('Final mapped users:', mappedUsers)
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