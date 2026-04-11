import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useRoles } from '@/hooks/useRoles'
import type { AppRole } from '@/components/layout/BottomNav'

interface RoleProtectedRouteProps {
  children: ReactNode
  allowedRoles: AppRole[]
  fallback?: string
}

export function RoleProtectedRoute({ children, allowedRoles, fallback = '/home' }: RoleProtectedRouteProps) {
  const { roles, loading } = useRoles()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const hasAccess = roles.some(r => allowedRoles.includes(r as AppRole))

  if (!hasAccess) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
