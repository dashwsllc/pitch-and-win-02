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
    if (!user) {
      setRoles([])
      setIsExecutive(false)
      setIsSuperAdmin(false)
      setLoading(false)
      return
    }

    fetchUserRoles()
  }, [user])

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

      const userRoles = data?.map(r => r.role) || ['seller']
      setRoles(userRoles)
      
      // Ser executive requer ter o role E ser autorizado pelo super admin (ou ser o próprio super admin)
      const hasExecutiveRole = userRoles.includes('executive')
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
      // Buscar dados diretos com JOIN para garantir todos os usuários
      const { data: allUsersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!left (
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching all users:', usersError)
        return
      }

      console.log('Raw users data:', allUsersData)

      // Mapear os dados para o formato esperado
      const mappedUsers = (allUsersData || []).map((user: any) => {
        const userRoles = user.user_roles || []
        const roles = userRoles.map((ur: any) => ur.role).filter(Boolean)
        
        return {
          ...user,
          roles: roles.length > 0 ? roles : ['seller'],
          role: roles.length > 0 ? roles[0] : 'seller'
        }
      })

      console.log('Mapped users:', mappedUsers)
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