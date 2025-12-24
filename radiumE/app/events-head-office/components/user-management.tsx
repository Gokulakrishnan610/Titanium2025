"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, Users, Shield, QrCode } from "lucide-react"
import { useUsers, useUpdateUserRole } from "@/lib/hooks/useUsers"

interface User {
  id: number
  username: string
  email: string
  display_name: string
  is_eventStaff: boolean
  is_superuser: boolean
  is_qr_scanner: boolean
  is_verified: boolean
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  const { data: users, isLoading, refetch } = useUsers()
  const updateUserRoleMutation = useUpdateUserRole()

  // Filter users based on search term
  useEffect(() => {
    if (users) {
      const filtered = users.filter((user: User) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  const handleRoleToggle = async (userId: number, role: 'is_qr_scanner', currentValue: boolean) => {
    try {
      await updateUserRoleMutation.mutateAsync({
        userId,
        role,
        value: !currentValue
      })
      refetch() // Refresh the user list
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} users
          </span>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username, email, or display name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{user.display_name || user.username}</h3>
                    <div className="flex gap-1">
                      {user.is_superuser && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Superuser
                        </Badge>
                      )}
                      {user.is_eventStaff && (
                        <Badge variant="secondary" className="text-xs">
                          Event Staff
                        </Badge>
                      )}
                      {user.is_qr_scanner && (
                        <Badge variant="outline" className="text-xs text-white">
                          <QrCode className="h-3 w-3 mr-1" />
                          QR Scanner
                        </Badge>
                      )}
                      {user.is_verified && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>

                <div className="flex items-center gap-6">
                  {/* QR Scanner Role Toggle */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`qr-scanner-${user.id}`} className="text-sm text-white">
                      QR Scanner
                    </Label>
                    <Switch
                      id={`qr-scanner-${user.id}`}
                      checked={user.is_qr_scanner}
                      onCheckedChange={() => handleRoleToggle(user.id, 'is_qr_scanner', user.is_qr_scanner)}
                      disabled={updateUserRoleMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms" : "No users available"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}