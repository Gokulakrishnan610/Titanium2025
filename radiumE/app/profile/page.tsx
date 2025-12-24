"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfile, useUpdateProfile, useChangePassword, useRequestPasswordReset } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Edit3, Key, Shield, Briefcase, Save, X, GraduationCap } from "lucide-react"
import MembershipStatusBadgeProfile from "../components/membershipStatusBadgeProfile"
import { useYearChoices, useDepartmentChoices } from "@/lib/api/choices"

export default function ProfilePage() {
  const router = useRouter()
  const { data: user, isLoading } = useProfile()
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()
  const requestPasswordResetMutation = useRequestPasswordReset()
  
  // Fetch dynamic choices
  const { years, loading: yearsLoading } = useYearChoices()
  const { departments, loading: deptsLoading } = useDepartmentChoices()

  const [isEditing, setIsEditing] = useState(false)

  const [profileData, setProfileData] = useState({
    display_name: '',
    gender: '',
    degree: '',
    year: '',
    department: '',
    rollno: '',
    phone_number: '',
    college_name: '',
    date_of_birth: '',
    bio: ''
  })

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password1: '',
    new_password2: ''
  })

  const [resetEmail, setResetEmail] = useState('')

  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [resetError, setResetError] = useState('')

  // Initialize form data when user data loads
  React.useEffect(() => {
    if (user) {
      setProfileData({
        display_name: user.display_name || '',
        gender: user.gender || '',
        degree: user.degree || '',
        year: user.year || '',
        department: user.department || '',
        rollno: user.rollno || '',
        phone_number: user.phone_number || '',
        college_name: user.college_name || '',
        date_of_birth: user.date_of_birth || '',
        bio: user.bio || ''
      })
      setResetEmail(user.email || '')
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    try {
      await updateProfileMutation.mutateAsync(profileData)
      setIsEditing(false)
      console.log("Profile updated successfully!")
    } catch (error: any) {
      console.error("Failed to update profile", error)
      setProfileError(error?.response?.data?.message || error?.message || "Failed to update profile")
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (passwordData.new_password1 !== passwordData.new_password2) {
      setPasswordError("New passwords don't match")
      return
    }
    try {
      await changePasswordMutation.mutateAsync({
        old_password: passwordData.old_password,
        new_password1: passwordData.new_password1,
        new_password2: passwordData.new_password2
      })
      setPasswordData({ old_password: '', new_password1: '', new_password2: '' })
      console.log("Password changed successfully!")
    } catch (error: unknown) {
      console.error("Failed to change password", error)
      const err = error as any
      setPasswordError(err?.response?.data?.message || err?.message || "Failed to change password")
    }
  }

  const handlePasswordResetRequest = async () => {
    setResetError('')
    try {
      await requestPasswordResetMutation.mutateAsync({ email: resetEmail })
      console.log("Password reset email sent!")
    } catch (error: unknown) {
      console.error("Failed to send password reset email", error)
      const err = error as any
      setResetError(err?.response?.data?.message || err?.message || "Failed to send password reset email")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen profile-page-background py-8 px-2 md:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white hover:bg-gray-700 border-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-300">Manage your account settings and preferences</p>
        </div>

        {/* Profile Content */}
  <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="p-6 profile-grey-card border-0 shadow-sm overflow-hidden h-full flex flex-col justify-center">
              <div className="flex flex-col items-center text-center break-words">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-1 break-words">{user.display_name || user.username}</h2>
                <p className="text-gray-300 mb-1 break-all">{user.email}</p>
                {user.year_display && (
                  <p className="text-sm text-blue-300 mb-2">{user.year_display}</p>
                )}
                <p className="text-sm text-gray-400">Member since {new Date(user.created_at).toLocaleDateString()}</p>

                {/* Status Badges */}
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  {user.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Shield className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  {user.is_eventStaff && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <Briefcase className="h-3 w-3" />
                      Staff
                    </span>
                  )}
                  {user.is_superuser && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                  {user.year_display && (
                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      <GraduationCap className="h-3 w-3" />
                      {user.year_display}
                    </span>
                  )}
                  <MembershipStatusBadgeProfile />
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Details & Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Details Card */}
            <Card className="p-6 profile-grey-card border-0 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="min-w-[180px]">
                  <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                  <p className="text-sm text-gray-400">Update your personal details</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="whitespace-nowrap border-0 text-white hover:bg-gray-700"
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              {profileError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
                  <p className="text-red-400 text-sm">{profileError}</p>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="display_name" className="text-white">Display Name</Label>
                      <Input
                        id="display_name"
                        value={profileData.display_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="Your display name"
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={profileData.gender}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-white"
                        aria-label="Select gender"
                      >
                        <option value="" className="bg-gray-800 text-white">Select gender</option>
                        <option value="male" className="bg-gray-800 text-white">Male</option>
                        <option value="female" className="bg-gray-800 text-white">Female</option>
                        <option value="other" className="bg-gray-800 text-white">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-white">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profileData.phone_number}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="Your phone number"
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-white">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={profileData.date_of_birth}
                        onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="degree" className="text-white">Degree</Label>
                      <Input
                        id="degree"
                        value={profileData.degree}
                        onChange={(e) => setProfileData(prev => ({ ...prev, degree: e.target.value }))}
                        placeholder="e.g., B.Tech, M.Tech"
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-white">Year</Label>
                      <select
                        id="year"
                        value={profileData.year}
                        onChange={(e) => setProfileData(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-white"
                        disabled={yearsLoading}
                      >
                        <option value="" className="bg-gray-800 text-white">
                          {yearsLoading ? 'Loading...' : 'Select year'}
                        </option>
                        {years.map((year) => (
                          <option key={year.code} value={year.code} className="bg-gray-800 text-white">
                            {year.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-white">Department</Label>
                      <select
                        id="department"
                        value={profileData.department}
                        onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-white"
                        disabled={deptsLoading}
                      >
                        <option value="" className="bg-gray-800 text-white">
                          {deptsLoading ? 'Loading...' : 'Select department'}
                        </option>
                        {departments.map((dept) => (
                          <option key={dept.code} value={dept.code} className="bg-gray-800 text-white">
                            {dept.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollno" className="text-white">Roll Number</Label>
                      <Input
                        id="rollno"
                        value={profileData.rollno}
                        onChange={(e) => setProfileData(prev => ({ ...prev, rollno: e.target.value }))}
                        placeholder="Your roll number"
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="college_name" className="text-white">College Name</Label>
                      <Input
                        id="college_name"
                        value={profileData.college_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, college_name: e.target.value }))}
                        placeholder="Your college name"
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2 border border-input rounded-md bg-transparent min-h-[80px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                      {updateProfileMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 break-words">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-400">Username</span>
                    <p className="font-medium text-white break-all">{user.username}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-400">Email</span>
                    <p className="font-medium text-white break-all">{user.email}</p>
                  </div>
                  {user.display_name && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-400">Display Name</span>
                      <p className="font-medium text-white break-all">{user.display_name}</p>
                    </div>
                  )}
                  {user.phone_number && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-400">Phone</span>
                      <p className="font-medium text-white break-all">{user.phone_number}</p>
                    </div>
                  )}
                  {user.college_name && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-400">College</span>
                      <p className="font-medium text-white break-all">{user.college_name}</p>
                    </div>
                  )}
                  {user.degree && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-400">Degree</span>
                      <p className="font-medium text-white break-all">{user.degree}</p>
                    </div>
                  )}
                  {user.department_display && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-400">Department</span>
                      <p className="font-medium text-white break-all">{user.department_display}</p>
                    </div>
                  )}
                  {user.date_of_birth && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-400">Date of Birth</span>
                      <p className="font-medium text-white">{new Date(user.date_of_birth).toLocaleDateString()}</p>
                    </div>
                  )}
                  {user.bio && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-sm text-gray-400">Bio</span>
                      <p className="text-white leading-relaxed break-words">{user.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Security Card */}
            <Card className="p-6 profile-grey-card border-0 shadow-sm overflow-hidden">
              <h3 className="text-lg font-semibold text-white mb-6">Security</h3>

              {/* Change Password */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-white">Change Password</h4>
                {passwordError && (
                  <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
                    <p className="text-red-400 text-sm">{passwordError}</p>
                  </div>
                )}
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="old_password" className="text-white">Current Password</Label>
                      <Input
                        id="old_password"
                        type="password"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                        required
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-white">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password1}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password1: e.target.value }))}
                        required
                        className="bg-transparent"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirm_password" className="text-white">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.new_password2}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password2: e.target.value }))}
                        required
                        className="bg-transparent"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={changePasswordMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                    {changePasswordMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Password Reset */}
              <div className="space-y-4">
                <h4 className="font-medium text-white">Forgot Password?</h4>
                {resetError && (
                  <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
                    <p className="text-red-400 text-sm">{resetError}</p>
                  </div>
                )}
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handlePasswordResetRequest(); }}>
                  <div className="space-y-2">
                    <Label htmlFor="reset_email" className="text-white">Email Address</Label>
                    <Input
                      id="reset_email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="bg-transparent"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={requestPasswordResetMutation.isPending}
                    className="bg-gray-600 hover:bg-gray-700 text-white border-0"
                  >
                    {requestPasswordResetMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

}