import { useUser } from './useAuth'
import { User } from '../api/auth'

// Helper hook to check if current user is admin
export const useIsAdmin = () => {
  const { data: user, isLoading, error } = useUser()
  
  const isAdmin = user && (user.is_eventStaff || user.is_superuser)
  const isSuperAdmin = user && user.is_superuser
  
  return {
    isAdmin: !!isAdmin,
    isSuperAdmin: !!isSuperAdmin,
    user,
    isLoading,
    error,
    adminLevel: isSuperAdmin ? 'super' : isAdmin ? 'admin' : 'user'
  }
}

// Helper function to check admin permissions
export const checkAdminAccess = (user: User | null | undefined): { isAdmin: boolean; isSuperAdmin: boolean } => {
  return {
    isAdmin: !!(user?.is_eventStaff || user?.is_superuser),
    isSuperAdmin: !!user?.is_superuser
  }
}