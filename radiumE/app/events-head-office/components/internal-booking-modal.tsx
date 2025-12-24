"use client"
import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useInternalBooking } from "@/lib/hooks/useEvents"
import { useUser } from "@/lib/hooks/useAuth"
import { UserPlus, Loader2, ShieldX } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { EventsService } from "@/lib/api/events"

interface InternalBookingModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: number
  eventName: string
  onSuccess?: () => void
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export default function InternalBookingModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  onSuccess
}: InternalBookingModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [search, setSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const internalBookingMutation = useInternalBooking()
  const { data: currentUser, isLoading: isUserLoading } = useUser()

  // Check if user is superuser
  const isSuperUser = currentUser?.is_superuser || false

  // Fetch available users for booking
  const { data: availableUsers, isLoading: isUsersLoading } = useQuery({
    queryKey: ["event", eventId, "available-users"],
    queryFn: async () => {
      const res = await EventsService.getAvailableUsersForBooking(eventId)
      return res.data as User[]
    },
    enabled: isOpen && !!eventId
  })

  // Filter users by search
  const filteredUsers = (availableUsers || []).filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(search.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      alert("Please select a user to book")
      return
    }
    setIsSubmitting(true)
    try {
      await internalBookingMutation.mutateAsync({
        eventId,
        userData: { user_id: selectedUserId }
      })
      resetForm()
      onClose()
      onSuccess?.()
      alert("User successfully added to event!")
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedUserId("")
    setSearch("")
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Internal Booking - ${eventName}`} className="max-w-2xl">
      {isUserLoading ? (
        // Loading state while checking user permissions
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      ) : !isSuperUser ? (
        // Access denied view for non-superusers
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground mb-4">
            Only superusers can perform internal bookings. This feature allows administrators to add participants to events bypassing normal registration and payment processes.
          </p>
          <p className="text-sm text-muted-foreground">
            If you need to book someone for this event, please contact an administrator.
          </p>
          <div className="mt-6">
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      ) : (
        // Normal booking form for superusers
        <div className="max-h-[70vh] overflow-y-auto bg-card rounded-md pr-2 hover:pr-0">
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div className="space-y-2">
              <Label htmlFor="userSearch" className="text-gray-100">Search User</Label>
              <input
                id="userSearch"
                type="text"
                placeholder="Search by username, email, name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                disabled={isUsersLoading || isSubmitting}
                className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userSelect" className="text-gray-100">Select User *</Label>
              <select
                id="userSelect"
                title="Select a user to book for the event"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                disabled={isUsersLoading || isSubmitting}
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">-- Select User --</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email}) {user.first_name || ""} {user.last_name || ""}
                  </option>
                ))}
              </select>
              {isUsersLoading && <Loader2 className="animate-spin" />}
              {!isUsersLoading && filteredUsers.length === 0 && <div className="text-muted-foreground">No users found.</div>}
            </div>
            <div className="submit-row">
              <Button type="submit" disabled={isSubmitting || isUsersLoading || !selectedUserId} className="default">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />} Book Selected User
              </Button>
              <Button type="button" onClick={handleClose} disabled={isSubmitting} variant="ghost" className="cancel">Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}