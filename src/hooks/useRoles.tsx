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
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      // Buscar todos os roles existentes
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        return
      }

      const rolesByUser = new Map<string, string[]>()
      ;(roles || []).forEach(r => {
        const list = rolesByUser.get(r.user_id) || []
        list.push(r.role)
        rolesByUser.set(r.user_id, list)
      })

      const merged = (profiles || []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.user_id) || [],
        role: (rolesByUser.get(p.user_id) || ['seller'])[0]
      }))

      setUsers(merged)
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