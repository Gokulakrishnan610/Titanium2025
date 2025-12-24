"use client"

import { Badge } from "@/components/ui/badge"
import { useMembershipStatus } from "@/lib/hooks/useMembership"
import { Crown, Star } from "lucide-react"

export default function MembershipStatusBadge() {
  const { data: membershipStatus, isLoading } = useMembershipStatus()

  if (isLoading || !membershipStatus?.has_devs_membership) {
    return null
  }

  const membership = membershipStatus.devs_membership

  if (membership?.is_premium) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
        <Crown className="h-3 w-3 mr-1" />
        Premium DEVS
      </Badge>
    )
  }

  return (
    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
      <Star className="h-3 w-3 mr-1" />
      DEVS Member
    </Badge>
  )
}