"use client"
import { useState } from "react"
import AdminLayout from "../components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEvents } from "@/lib/hooks/useEvents"
import { useUser } from "@/lib/hooks/useAuth"
import ParticipantsModal from "../components/participants-modal"
import InternalBookingModal from "../components/internal-booking-modal"
import EditEventModal from "../components/edit-event-modal"
import EventGuideModal from "../components/event-guide-modal"
import { useDeleteEvent, useDownloadEventAnalysis } from "@/lib/hooks/useEvents"
import { Edit, Trash2, UserPlus, Download, File, Search, Filter, Calendar, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ManageEventsPage() {
  const [search, setSearch] = useState("")
  const [eventType, setEventType] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [isUpcoming, setIsUpcoming] = useState("")
  const [participantsModal, setParticipantsModal] = useState<{ isOpen: boolean; eventId: number; eventName: string }>({
    isOpen: false,
    eventId: 0,
    eventName: ""
  })
  const [internalBookingModal, setInternalBookingModal] = useState<{ isOpen: boolean; eventId: number; eventName: string }>({
    isOpen: false,
    eventId: 0,
    eventName: ""
  })
  const [editEventModal, setEditEventModal] = useState<{ isOpen: boolean; eventId: number }>({
    isOpen: false,
    eventId: 0
  })
  const [eventGuideModal, setEventGuideModal] = useState<{ isOpen: boolean; eventId: number; eventName: string }>({
    isOpen: false,
    eventId: 0,
    eventName: ""
  })

  const deleteEventMutation = useDeleteEvent()
  const downloadAnalysisMutation = useDownloadEventAnalysis()
  const router = useRouter()

  const { data: eventsData, isLoading: eventsLoading, refetch } = useEvents({
    search: search || undefined,
    event_type: eventType || undefined,
    payment_type: paymentType || undefined,
    is_upcoming: isUpcoming ? (isUpcoming === "true") : undefined,
  })

  const { data: user } = useUser()
  const isStaffOrSuperuser = user?.is_eventStaff || user?.is_superuser

  // Event action handlers
  const handleDeleteEvent = async (eventId: number, eventName: string) => {
    if (confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      try {
        await deleteEventMutation.mutateAsync(eventId)
        refetch()
        alert("Event deleted successfully!")
      } catch (error: any) {
        alert(error.message || "Failed to delete event")
      }
    }
  }

  const handleDownloadAnalysis = async (eventId: number, eventName: string) => {
    try {
      const blob = await downloadAnalysisMutation.mutateAsync(eventId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName}_analysis_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(error.message || "Failed to download analysis")
    }
  }



  return (
    <AdminLayout title="Manage Events">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    title="Filter by event type"
                  >
                    <option value="">All Event Types</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="competition">Competition</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="meetup">Meetup</option>
                    <option value="conference">Conference</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    title="Filter by payment type"
                  >
                    <option value="">All Payment Types</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                  <select
                    value={isUpcoming}
                    onChange={(e) => setIsUpcoming(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    title="Filter by event status"
                  >
                    <option value="">All Events</option>
                    <option value="true">Upcoming Only</option>
                    <option value="false">Past Events</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Events List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Events ({eventsData?.count || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm sm:text-base">Loading events...</span>
                  </div>
                ) : eventsData?.results?.length ? (
                  <div className="space-y-4">
                    {eventsData.results.map((event) => (
                      <Card key={event.id} className="p-3 sm:p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                              <h3 className="font-semibold text-base sm:text-lg truncate">{event.event_name}</h3>
                              <Badge variant={event.is_upcoming ? "default" : "secondary"} className="w-fit">
                                {event.is_upcoming ? "Upcoming" : "Past"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="truncate">
                                <span className="font-medium">Type:</span> {event.event_type_display}
                              </div>
                              <div className="truncate">
                                <span className="font-medium">Payment:</span> {event.payment_type_display}
                              </div>
                              <div className="truncate">
                                <span className="font-medium">Date:</span> {new Date(event.event_date).toLocaleDateString()}
                              </div>
                              <div className="truncate">
                                <span className="font-medium">Venue:</span> {event.venue}
                              </div>
                            </div>
                          </div>
                          
                          {/* Mobile Action Buttons */}
                          <div className="flex flex-col sm:hidden gap-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditEventModal({ isOpen: true, eventId: event.id })}
                                className="bg-secondary/40 flex-1"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEventGuideModal({
                                  isOpen: true,
                                  eventId: event.id,
                                  eventName: event.event_name
                                })}
                                className="bg-secondary/40 flex-1"
                              >
                                <BookOpen className="h-4 w-4 mr-1" />
                                Guide
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setParticipantsModal({
                                  isOpen: true,
                                  eventId: event.id,
                                  eventName: event.event_name
                                })}
                                className="bg-secondary/40 flex-1"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Participants
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInternalBookingModal({
                                  isOpen: true,
                                  eventId: event.id,
                                  eventName: event.event_name
                                })}
                                className="bg-secondary/40 flex-1"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add User
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadAnalysis(event.id, event.event_name)}
                                disabled={new Date(event.event_date) > new Date()}
                                className="bg-secondary/40 flex-1"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Analysis
                              </Button>
                              {isStaffOrSuperuser && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/events-head-office/od-list/${event.id}`)}
                                  className="bg-secondary/40 flex-1"
                                >
                                  <File className="h-4 w-4 mr-1" />
                                  OD List
                                </Button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEvent(event.id, event.event_name)}
                                className="bg-secondary/40 flex-1"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          {/* Desktop Action Buttons */}
                          <div className="hidden sm:flex lg:flex-wrap xl:flex-nowrap gap-1 lg:gap-2 lg:ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditEventModal({ isOpen: true, eventId: event.id })}
                              className="bg-secondary/40 text-xs lg:text-sm"
                            >
                              <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              <span className="hidden md:inline">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEventGuideModal({
                                isOpen: true,
                                eventId: event.id,
                                eventName: event.event_name
                              })}
                              className="bg-secondary/40 text-xs lg:text-sm"
                            >
                              <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              <span className="hidden md:inline">Guide</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setParticipantsModal({
                                isOpen: true,
                                eventId: event.id,
                                eventName: event.event_name
                              })}
                              className="bg-secondary/40 text-xs lg:text-sm"
                            >
                              <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              <span className="hidden md:inline">Participants</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInternalBookingModal({
                                isOpen: true,
                                eventId: event.id,
                                eventName: event.event_name
                              })}
                              className="bg-secondary/40 text-xs lg:text-sm"
                            >
                              <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              <span className="hidden lg:inline">Add User</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push('/events-head-office/analysis')}
                              className="bg-secondary/40 text-xs lg:text-sm"
                            >
                              <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              <span className="hidden lg:inline">Analysis</span>
                            </Button>
                            {isStaffOrSuperuser && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/events-head-office/od-list/${event.id}`)}
                                className="bg-secondary/40 text-xs lg:text-sm"
                              >
                                <File className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                <span className="hidden lg:inline">OD List</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEvent(event.id, event.event_name)}
                              className="bg-secondary/40 text-xs lg:text-sm"
                            >
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              <span className="hidden md:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">No events found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modals */}
          <ParticipantsModal
            isOpen={participantsModal.isOpen}
            onClose={() => setParticipantsModal({ isOpen: false, eventId: 0, eventName: "" })}
            eventId={participantsModal.eventId}
            eventName={participantsModal.eventName}
          />

          <InternalBookingModal
            isOpen={internalBookingModal.isOpen}
            onClose={() => setInternalBookingModal({ isOpen: false, eventId: 0, eventName: "" })}
            eventId={internalBookingModal.eventId}
            eventName={internalBookingModal.eventName}
            onSuccess={() => refetch()}
          />

          <EditEventModal
            isOpen={editEventModal.isOpen}
            onClose={() => setEditEventModal({ isOpen: false, eventId: 0 })}
            eventId={editEventModal.eventId}
            onSuccess={() => refetch()}
          />

          <EventGuideModal
            isOpen={eventGuideModal.isOpen}
            onClose={() => setEventGuideModal({ isOpen: false, eventId: 0, eventName: "" })}
            eventId={eventGuideModal.eventId}
            eventName={eventGuideModal.eventName}
          />
        </AdminLayout>
      )
    }