"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMembershipStatus } from "@/lib/hooks/useMembership"
import { useProfile } from "@/lib/hooks/useAuth"
import { Users, Crown, Star } from "lucide-react"
import Link from "next/link"

interface MembershipButtonProps {
  variant?: "desktop" | "mobile"
  onClick?: () => void
}

export default function MembershipButton({ variant = "desktop", onClick }: MembershipButtonProps) {
  const { data: membershipStatus, isLoading: membershipLoading } = useMembershipStatus()
  const { data: user, isLoading: userLoading } = useProfile()
  
  // Debug logging (remove in production)
  console.log('MembershipButton Debug:', { 
    membershipStatus, 
    user,
    userYear: user?.year,
    membershipLoading,
    userLoading,
    has_devs_membership: membershipStatus?.has_devs_membership,
    can_claim_devs: membershipStatus?.can_claim_devs 
  })

  // Don't show anything while loading
  if (membershipLoading || userLoading) {
    return null
  }

  // Always show for first-year students (graduating 2029), regardless of membership status
  const isFirstYear = user?.year === '2029'
  
  if (!isFirstYear) {
    // For non-first-year students, don't show if they already have membership
    if (membershipStatus?.has_devs_membership) {
      return null
    }
  }

  // Determine button content based on membership status and user year
  const getButtonContent = () => {
    // For first-year students who already have membership
    if (isFirstYear && membershipStatus?.has_devs_membership) {
      if (membershipStatus.devs_membership?.is_premium) {
        return {
          icon: <Crown className={variant === "desktop" ? "h-4 w-4 mr-2" : "h-4 w-4 mr-3"} />,
          text: "Premium DEVS",
          badge: <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">Premium</Badge>
        }
      } else {
        return {
          icon: <Star className={variant === "desktop" ? "h-4 w-4 mr-2" : "h-4 w-4 mr-3"} />,
          text: "DEVS Member",
          badge: <Badge className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">Member</Badge>
        }
      }
    }

    // For first-year students who can claim membership
    if (isFirstYear && membershipStatus?.can_claim_devs) {
      return {
        icon: <Users className={variant === "desktop" ? "h-4 w-4 mr-2" : "h-4 w-4 mr-3"} />,
        text: "Claim Membership",
        badge: <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30 text-xs">Free</Badge>
      }
    }

    // Default for first-year students or others
    if (isFirstYear) {
      return {
        icon: <Users className={variant === "desktop" ? "h-4 w-4 mr-2" : "h-4 w-4 mr-3"} />,
        text: "Join DEVS",
        badge: null
      }
    }

    // For non-first-year students without membership
    if (!membershipStatus) {
      return {
        icon: <Users className={variant === "desktop" ? "h-4 w-4 mr-2" : "h-4 w-4 mr-3"} />,
        text: "Membership",
        badge: null
      }
    }

    return {
      icon: <Users className={variant === "desktop" ? "h-4 w-4 mr-2" : "h-4 w-4 mr-3"} />,
      text: "Membership",
      badge: null
    }
  }

  const { icon, text, badge } = getButtonContent()

  if (variant === "desktop") {
    return (
      <Link href="/membership">
        <Button
          size="sm"
          variant="outline"
          className="bg-purple-600/20 backdrop-blur-sm border-purple-400/30 text-purple-200 hover:bg-purple-500/30 hover:text-white shadow-lg"
        >
          {icon}
          {text}
          {badge}
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/membership" onClick={onClick}>
      <Button
        variant="ghost"
        className="w-full justify-start h-12 text-purple-300 hover:text-purple-200 hover:bg-purple-900/20"
      >
        {icon}
        <span className="flex-1 text-left">{text}</span>
        {badge}
      </Button>
    </Link>
  )
}