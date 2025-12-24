"use client"
import EventsBentoGrid from "./components/eventsBentoGrid"
import MembershipButton from "./components/membershipButton"
import MembershipStatusBadge from "./components/membershipStatusBadge"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/lib/hooks/useAuth"
import { useProfile } from "@/lib/hooks/useAuth"
import { LogOut, User, Calendar, Menu, X, Building, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function EventsPage() {
  const { data: user } = useProfile()
  const logoutMutation = useLogout()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // Ignore logout errors - user will be logged out anyway
      console.log('Logged out successfully (client-side)')
    }
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="relative">
      {/* Logo */}
      <div className="fixed top-2 left-2 z-50">
        <Image 
          src="/radiumLogo.png" 
          alt="Radium Logo" 
          width={40}
          height={40}
          className="h-10 w-auto"
        />
      </div>

      <div className="hidden md:flex fixed top-4 right-4 z-50 items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>

            <Link href="/my-events">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Events
              </Button>
            </Link>

            <MembershipButton variant="desktop" />

            {user.is_eventStaff && (
              <Link href="/events-head-office">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Head Office
                </Button>
              </Link>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button className="bg-primary/90 backdrop-blur-sm hover:bg-primary text-primary-foreground shadow-lg">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      <div className="md:hidden fixed top-4 right-4 z-50">
        {user ? (
          <Button
            size="sm"
            variant="outline"
            onClick={toggleMenu}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>
        ) : (
          <Link href="/login">
            <Button className="bg-primary/90 backdrop-blur-sm hover:bg-primary text-primary-foreground shadow-lg">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      {user && (
        <>
          {/* Overlay only when menu is open */}
          <div
            className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ease-in-out ${isMenuOpen ? '' : 'pointer-events-none opacity-0'}`}
          >
            <div
              className="absolute inset-0 bg-black"
              onClick={closeMenu}
              style={{ pointerEvents: isMenuOpen ? 'auto' : 'none' }}
            />

            <div
              className={`absolute bottom-0 left-0 right-0 border-t border-border rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out ${
                isMenuOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ background: '#000' }}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Menu</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={closeMenu}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.display_name || user.username || user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.is_verified && (
                        <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                      <MembershipStatusBadge />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href="/profile" onClick={closeMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Profile
                    </Button>
                  </Link>

                  <Link href="/my-events" onClick={closeMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                    >
                      <Calendar className="h-4 w-4 mr-3" />
                      My Events
                    </Button>
                  </Link>

                  <MembershipButton variant="mobile" onClick={closeMenu} />

                  {user.is_eventStaff && (
                    <Link href="/events-head-office" onClick={closeMenu}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                      >
                        <Building className="h-4 w-4 mr-3" />
                        Head Office
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="pt-16">
        <EventsBentoGrid />
      </div>
    </div>
  )
}