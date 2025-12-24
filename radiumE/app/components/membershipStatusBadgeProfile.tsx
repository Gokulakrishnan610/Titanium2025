"use client"

import { useMembershipStatus } from "@/lib/hooks/useMembership"
import { Crown, Star } from "lucide-react"

export default function MembershipStatusBadgeProfile() {
    const { data: membershipStatus, isLoading } = useMembershipStatus()

    if (isLoading || !membershipStatus?.has_devs_membership) {
        return null
    }

    const membership = membershipStatus.devs_membership

    if (membership?.is_premium) {
        return (
            <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                <Crown className="h-3 w-3" />
                Premium DEVS
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            <Star className="h-3 w-3" />
            DEVS Member
        </span>
    )
}