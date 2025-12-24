"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMembershipStatus, useMembershipBenefits } from "@/lib/hooks/useMembership"
import { ArrowLeft, Crown, Star, Users, CheckCircle, HelpCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import MembershipCard from "../components/membershipCard"

export default function MembershipPage() {
  const { data: membershipStatus, isLoading: statusLoading } = useMembershipStatus()
  const { data: benefits, isLoading: benefitsLoading } = useMembershipBenefits()

  if (statusLoading || benefitsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <div className="text-xl">Loading membership information...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  size="sm"
                  className="bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)] border-0 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
              </Link>
              {/* <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-purple-400" />
                <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">DEVS Membership</h1>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Membership Card */}
          <div className="lg:col-span-2">
            <MembershipCard className="mb-8" />

            {/* Detailed Benefits */}
            {benefits && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Membership Benefits</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic DEVS */}
                  <Card className="bg-gray-800/90 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-blue-400" />
                          <CardTitle className="text-blue-300">{benefits.basic_devs.title}</CardTitle>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                          {benefits.basic_devs.cost}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-300">
                        {benefits.basic_devs.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-blue-300 mb-2">Benefits:</h4>
                        <ul className="space-y-1">
                          {benefits.basic_devs.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-blue-500/20">
                        <p className="text-xs text-blue-300">
                          <strong>Eligibility:</strong> {benefits.basic_devs.eligibility}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Premium DEVS */}
                  <Card className="bg-purple-900/40 border border-purple-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1),0_8px_32px_rgba(147,51,234,0.2)] backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-5 w-5 text-purple-400" />
                          <CardTitle className="text-purple-300">{benefits.premium_devs.title}</CardTitle>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                          {benefits.premium_devs.cost}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-300">
                        {benefits.premium_devs.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-purple-300 mb-2">Benefits:</h4>
                        <ul className="space-y-1">
                          {benefits.premium_devs.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-purple-500/20">
                        <p className="text-xs text-purple-300">
                          <strong>Eligibility:</strong> {benefits.premium_devs.eligibility}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-gray-800/90 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Members</span>
                  <Badge className="bg-blue-500/20 text-blue-300 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    500+
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Premium Members</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    50+
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Active Projects</span>
                  <Badge className="bg-green-500/20 text-green-300 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    25+
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="bg-gray-800/90 border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Need Help?</CardTitle>
                <CardDescription className="text-gray-300">
                  Have questions about membership?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] border-0 transition-all duration-200">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button className="w-full justify-start bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)] border-0 transition-all duration-200">
                  <Users className="h-4 w-4 mr-2" />
                  Join Discord
                </Button>
              </CardContent>
            </Card>

            {/* Current Status Summary */}
            {membershipStatus && (
              <Card className="bg-purple-900/40 border border-purple-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1),0_8px_32px_rgba(147,51,234,0.2)] backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Your Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {membershipStatus.has_devs_membership ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-300">DEVS Member</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {membershipStatus.devs_membership?.is_premium ? (
                          <>
                            <Crown className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-300">Premium Access</span>
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-300">Basic Access</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      {membershipStatus.can_claim_devs ? "Eligible to join" : "Not eligible yet"}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}