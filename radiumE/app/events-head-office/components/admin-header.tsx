"use client"
import { Button } from "@/components/ui/button"
import { LogOut, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminHeaderProps {
  user: {
    display_name?: string
    username?: string
    email: string
    is_eventStaff?: boolean
    is_superuser?: boolean
  } | null
  onLogout: () => void
}

export default function AdminHeader({ user, onLogout }: AdminHeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">Event Management</h1>
            <span className="text-sm text-muted-foreground">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground">
                Welcome, {user.display_name || user.username || user.email}
                {(user.is_eventStaff || user.is_superuser) && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">
                    {user.is_superuser ? 'Super Admin' : 'Admin'}
                  </span>
                )}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}