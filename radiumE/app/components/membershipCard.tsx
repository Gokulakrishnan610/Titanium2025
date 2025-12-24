"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useMembershipStatus, useClaimDevMembership, useMembershipBenefits, useApplyForPremiumSlot } from "@/lib/hooks/useMembership"
import { Crown, Star, Users, Gift, Loader2, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
// Simple toast replacement - you can install sonner later for better toasts
const toast = {
    success: (message: string) => alert(`✅ ${message}`),
    error: (message: string) => alert(`❌ ${message}`)
}

interface MembershipCardProps {
    className?: string
}

export default function MembershipCard({ className = "" }: MembershipCardProps) {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
    const [applicationReason, setApplicationReason] = useState("")
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    const { data: membershipStatus, isLoading: statusLoading, error: statusError } = useMembershipStatus()
    const { data: benefits } = useMembershipBenefits()

    const claimMembership = useClaimDevMembership()
    const applyForPremium = useApplyForPremiumSlot()

    const handleClaimMembership = async () => {
        try {
            await claimMembership.mutateAsync()
            toast.success("DEVS membership claimed successfully! 🎉")
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to claim membership")
        }
    }

    const handleApplyForPremium = async () => {
        if (!selectedSlot || !applicationReason.trim()) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            await applyForPremium.mutateAsync({
                slotId: selectedSlot,
                applicationReason: applicationReason.trim()
            })
            toast.success("Premium membership application submitted! 🚀")
            setIsApplyDialogOpen(false)
            setApplicationReason("")
            setSelectedSlot(null)
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to submit application")
        }
    }

    if (statusLoading) {
        return (
            <Card className={`bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 ${className}`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                        <span className="text-purple-300">Loading membership status...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (statusError) {
        return (
            <Card className={`bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30 ${className}`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <span className="text-red-300">Failed to load membership status</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!membershipStatus) {
        return null
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-400" />
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-400" />
            case 'waitlist':
                return <Clock className="h-4 w-4 text-yellow-400" />
            default:
                return <AlertCircle className="h-4 w-4 text-blue-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500/20 text-green-300 border-green-500/30'
            case 'rejected':
                return 'bg-red-500/20 text-red-300 border-red-500/30'
            case 'waitlist':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            default:
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        }
    }

    return (
        <Card className={`bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-white">DEVS Membership</CardTitle>
                    </div>
                    {membershipStatus.has_devs_membership && (
                        <Badge className={`${membershipStatus.devs_membership?.is_premium ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                            {membershipStatus.devs_membership?.is_premium ? (
                                <>
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium
                                </>
                            ) : (
                                <>
                                    <Star className="h-3 w-3 mr-1" />
                                    Basic
                                </>
                            )}
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-gray-300">
                    {membershipStatus.has_devs_membership
                        ? "Manage your DEVS membership and explore premium benefits"
                        : "Join the DEVS community and unlock exclusive opportunities"
                    }
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Current Membership Status */}
                {membershipStatus.has_devs_membership ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-green-300 font-medium">Active DEVS Member</span>
                            </div>
                            <Badge variant="outline" className="text-green-300 border-green-500/30">
                                {membershipStatus.devs_membership?.membership_type_display}
                            </Badge>
                        </div>

                        {/* Premium Applications */}
                        {membershipStatus.premium_applications.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-300">Premium Applications</h4>
                                {membershipStatus.premium_applications.map((application) => (
                                    <div key={application.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(application.status)}
                                            <span className="text-sm text-gray-300">{application.slot_name}</span>
                                        </div>
                                        <Badge className={getStatusColor(application.status)}>
                                            {application.status_display}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Available Premium Slots */}
                        {!membershipStatus.devs_membership?.is_premium && membershipStatus.available_premium_slots.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-300">Available Premium Slots</h4>
                                {membershipStatus.available_premium_slots.slice(0, 2).map((slot) => (
                                    <div key={slot.id} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium text-yellow-300">{slot.name}</h5>
                                            <Badge variant="outline" className="text-yellow-300 border-yellow-500/30">
                                                {slot.available_slots} slots left
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-300 mb-2">{slot.description}</p>
                                        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-yellow-100"
                                                    onClick={() => setSelectedSlot(slot.id)}
                                                >
                                                    <Crown className="h-3 w-3 mr-1" />
                                                    Apply for Premium
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-gray-900 border-gray-700">
                                                <DialogHeader>
                                                    <DialogTitle className="text-white">Apply for Premium Membership</DialogTitle>
                                                    <DialogDescription className="text-gray-300">
                                                        Tell us why you want to upgrade to premium membership
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="reason" className="text-gray-300">Application Reason</Label>
                                                        <Textarea
                                                            id="reason"
                                                            placeholder="Explain why you want premium membership and how you plan to contribute to the DEVS community..."
                                                            value={applicationReason}
                                                            onChange={(e) => setApplicationReason(e.target.value)}
                                                            className="bg-gray-800 border-gray-600 text-white"
                                                            rows={4}
                                                        />
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            onClick={handleApplyForPremium}
                                                            disabled={applyForPremium.isPending || !applicationReason.trim()}
                                                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-yellow-100"
                                                        >
                                                            {applyForPremium.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            ) : (
                                                                <Crown className="h-4 w-4 mr-2" />
                                                            )}
                                                            Submit Application
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setIsApplyDialogOpen(false)
                                                                setApplicationReason("")
                                                                setSelectedSlot(null)
                                                            }}
                                                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Claim Membership Section */
                    <div className="space-y-3">
                        {membershipStatus.can_claim_devs ? (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Gift className="h-4 w-4 text-blue-400" />
                                    <span className="font-medium text-blue-300">Eligible for DEVS Membership!</span>
                                </div>
                                <p className="text-sm text-gray-300 mb-3">
                                    As a first-year student, you can claim your free DEVS membership and join our developer community.
                                </p>
                                <Button
                                    onClick={handleClaimMembership}
                                    disabled={claimMembership.isPending}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-blue-100"
                                >
                                    {claimMembership.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Star className="h-4 w-4 mr-2" />
                                    )}
                                    Claim Free Membership
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-800/50 border border-gray-600/30 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-300">Membership Status</span>
                                </div>
                                <p className="text-sm text-gray-400">{membershipStatus.devs_eligibility_message}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Benefits Overview */}
                {benefits && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-300">Membership Benefits</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs text-gray-400 hover:text-gray-200 h-6 px-2"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        More
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        {!isExpanded ? (
                            /* Compact View */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Star className="h-3 w-3 text-blue-400" />
                                        <span className="text-xs font-medium text-blue-300">Basic DEVS - Free</span>
                                    </div>
                                    <p className="text-xs text-gray-300">Community access, workshops, networking</p>
                                </div>
                                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Crown className="h-3 w-3 text-yellow-400" />
                                        <span className="text-xs font-medium text-yellow-300">Premium DEVS - Apply</span>
                                    </div>
                                    <p className="text-xs text-gray-300">Priority access, mentorship, exclusive projects</p>
                                </div>
                            </div>
                        ) : (
                            /* Expanded View */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Basic DEVS Benefits */}
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <Star className="h-4 w-4 text-blue-400" />
                                            <span className="font-medium text-blue-300">{benefits.basic_devs.title}</span>
                                        </div>
                                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                            {benefits.basic_devs.cost}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-300 mb-3">{benefits.basic_devs.description}</p>
                                    <ul className="text-xs text-gray-300 space-y-1">
                                        {benefits.basic_devs.benefits.map((benefit, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                                <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-3 pt-2 border-t border-blue-500/20">
                                        <p className="text-xs text-blue-300">
                                            <strong>Eligibility:</strong> {benefits.basic_devs.eligibility}
                                        </p>
                                    </div>
                                </div>

                                {/* Premium DEVS Benefits */}
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <Crown className="h-4 w-4 text-yellow-400" />
                                            <span className="font-medium text-yellow-300">{benefits.premium_devs.title}</span>
                                        </div>
                                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                            {benefits.premium_devs.cost}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-300 mb-3">{benefits.premium_devs.description}</p>
                                    <ul className="text-xs text-gray-300 space-y-1">
                                        {benefits.premium_devs.benefits.map((benefit, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                                <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-3 pt-2 border-t border-yellow-500/20">
                                        <p className="text-xs text-yellow-300">
                                            <strong>Eligibility:</strong> {benefits.premium_devs.eligibility}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Community Stats - Only show when expanded */}
                        {isExpanded && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                    <div className="text-lg font-semibold text-blue-300">500+</div>
                                    <div className="text-xs text-gray-400">Total Members</div>
                                </div>
                                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                    <div className="text-lg font-semibold text-yellow-300">50+</div>
                                    <div className="text-xs text-gray-400">Premium Members</div>
                                </div>
                                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                    <div className="text-lg font-semibold text-green-300">25+</div>
                                    <div className="text-xs text-gray-400">Active Projects</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}