"use client"
import React from "react"
import Link from "next/link"
import { useProfile } from "@/lib/hooks/useAuth"
import { Shield, AlertCircle } from "lucide-react"

interface AdminProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminProtectedRoute({ children, fallback }: AdminProtectedRouteProps) {
  const { data: user, isLoading, error } = useProfile()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    )
  }

  if (error || !user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You need to be logged in as an administrator to access this page.
          </p>
          <Link 
            href="/login" 
            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Check if user is admin based on backend flags
  // Support both API format (is_eventStaff, is_superuser) and legacy isAdmin field
  const isAdmin = user.is_eventStaff || user.is_superuser || user.isAdmin

  if (!isAdmin) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
          <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Admin Access Required</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This area is restricted to administrators only. Your account ({user.email}) does not have the necessary permissions.
          </p>
          <Link 
            href="/" 
            className="inline-block mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}