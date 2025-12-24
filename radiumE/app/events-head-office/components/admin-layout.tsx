"use client"
import { useState, useEffect } from "react"
import { useProfile, useLogout } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Calendar, Plus, QrCode, BarChart3, User, Download, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar, SidebarBody, SidebarLink } from "./sidebar"
import Image from "next/image"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [open, setOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  // API hooks
  const { data: user, isLoading: userLoading } = useProfile()
  const logoutMutation = useLogout()
  const router = useRouter()

  // PWA Install logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired')

      // In development, don't prevent default to allow browser's native behavior
      if (process.env.NODE_ENV !== 'development') {
        e.preventDefault()
      }

      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA: appinstalled event fired')
      setDeferredPrompt(null)
      setIsInstallable(false)
    }

    // For development testing or mobile devices, show button anyway
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
    if (process.env.NODE_ENV === 'development' || isMobile) {
      console.log('PWA: Development mode or mobile device - showing install button for testing')
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log('PWA: User choice:', outcome)
        if (outcome === 'accepted') {
          setDeferredPrompt(null)
          setIsInstallable(false)
        }
      } catch (error) {
        console.error('PWA: Error during installation:', error)
      }
    } else {
      // Fallback for development or when prompt is not available
      console.log('PWA: No deferred prompt available')
      if (process.env.NODE_ENV === 'development') {
        alert('PWA installation prompt not available in development. On production (radium.devsrec.com), this will show the native install prompt.')
      }
    }
  }

  // Admin protection: redirect if not admin
  if (!userLoading && user && !user.is_eventStaff && !user.is_superuser) {
    router.push('/')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  // Loading state while checking authentication
  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      // Navigation is handled by the hook's onSettled callback
    } catch {
      // Ignore logout errors - user will be logged out anyway
      router.push('/')
    }
  }

  const links = [
    {
      label: "Create Event",
      href: "/events-head-office",
      icon: (
        <Plus className="h-6 w-6 shrink-0" />
      ),
    },
    {
      label: "Manage Events",
      href: "/events-head-office/manage-events",
      icon: (
        <Calendar className="h-6 w-6 shrink-0" />
      ),
    },
    {
      label: "Analysis",
      href: "/events-head-office/analysis",
      icon: (
        <BarChart3 className="h-6 w-6 shrink-0" />
      ),
    },
    // Only show QR Attendance for QR scanner role or superuser
    ...(user && (user.is_qr_scanner || user.is_superuser) ? [{
      label: "QR Attendance",
      href: "/events-head-office/qr-attendance",
      icon: (
        <QrCode className="h-6 w-6 shrink-0" />
      ),
    }] : []),
    // Only show User Management for superuser
    ...(user && user.is_superuser ? [{
      label: "User Management",
      href: "/events-head-office/user-management",
      icon: (
        <User className="h-6 w-6 shrink-0" />
      ),
    }] : []),
  ]

  return (
    <div className="h-screen bg-background flex admin-layout">
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex items-center gap-2 py-2 mb-8">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <Image 
                  src="/radiumLogo.png" 
                  alt="Radium Logo" 
                  width={24}
                  height={24}
                  className="h-6 w-auto"
                />
              </div>
              <span className="font-semibold text-sidebar-foreground">Event Admin</span>
            </div>
            <div className="flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: user.display_name || user.username || user.email,
                href: "#",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-foreground">
                      {(user.display_name || user.username || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                ),
              }}
            />
            <SidebarLink
              link={{
                label: "Home",
                href: "#",
                icon: <Home className="h-5 w-5 shrink-0" />,
              }}
              onClick={() => router.push('/')}
            />
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: <LogOut className="h-5 w-5 shrink-0" />,
              }}
              onClick={handleLogout}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden p-2"
                  onClick={() => setOpen(!open)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Image 
                  src="/radiumLogo.png" 
                  alt="Radium Logo" 
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                <span className="text-sm text-muted-foreground hidden sm:inline">Admin Panel</span>
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    Welcome, {user.display_name || user.username || user.email}
                    {(user.is_eventStaff || user.is_superuser) && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">
                        {user.is_superuser ? 'Super Admin' : 'Admin'}
                      </span>
                    )}
                  </span>
                )}
                {isInstallable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInstallPWA}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </Button>
                )}
                {/* Debug: Show PWA status */}
                {/* <div className="text-xs text-muted-foreground hidden md:block">
                  PWA: {isInstallable ? 'Ready' : 'Not ready'} |
                  Event: {deferredPrompt ? 'Captured' : 'None'} |
                  Mode: {process.env.NODE_ENV}
                </div> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="gap-2 hidden md:flex"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hidden md:flex"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 py-6 sm:py-8 md:py-10 overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}