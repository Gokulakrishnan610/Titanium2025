"use client"

import { useState } from "react"
import { useUserRegistrations } from "../../lib/hooks/useEvents"
import { useProfile } from "../../lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import EventDetail from "../components/eventDetail-my-events"

interface LegacyEvent {
  id: string
  title: string
  subtitle?: string
  description?: string
  date: string
  time: string
  location: string
  price: string
  image: string
  category?: string
}

export default function MyEventsPage() {
  const { data: user } = useProfile()
  const { data: registrationsData, isLoading, error } = useUserRegistrations()
  const [selectedEvent, setSelectedEvent] = useState<LegacyEvent | null>(null)


  // Create events from actual registrations with full event data
  const displayEvents = registrationsData?.results?.map((registration: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Registration data from backend:', registration);
      console.log('Registration status:', registration.registration_status);
      console.log('Payment status:', registration.payment_status);
    }

    const event = registration.event
    const eventDate = new Date(event.event_date)

    return {
      id: event.id.toString(),
      title: event.event_name,
      description: event.description || "Event details",
      date: eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      time: event.start_time && event.end_time
        ? `${event.start_time} - ${event.end_time}`
        : eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
      location: event.venue,
      price: event.payment_type === "free" ? "Free" : event.price ? `₹${event.price}` : "Paid",
      image: event.event_image_url || event.event_image || '/placeholder-event.jpg',
      category: event.event_type_display || 'General'
    }
  }) || []

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading your events...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Please sign in to view your events</div>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-gray-200">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show event detail if selected
  if (selectedEvent) {
    return <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="w-full px-4 py-4 border-b border-gray-800/30">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to events
        </Link>
      </div>

      <div className="w-full mx-auto py-6 sm:py-6 md:py-8 lg:py-[34px] px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-5 md:gap-6 lg:gap-8 w-full mb-8 sm:mb-7 md:mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 md:gap-3 items-baseline flex-1">
              <div className="flex items-center gap-3 w-full">
                <div className="text-xl sm:text-lg md:text-xl lg:text-2xl font-medium leading-tight tracking-wide text-white pb-12 ml-3">
                  MY EVENTS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="w-full mx-auto px-4 sm:px-4 md:px-6 lg:px-8 mb-6">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <div className="text-red-400 text-sm">
                ⚠️ Unable to load your events. Please try again later.
              </div>
            </div>
          </div>
        )}

        {/* No events state */}
        {displayEvents.length === 0 && !error && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No registered events yet</h3>
            <p className="text-gray-400 mb-6">You haven't registered for any events. Browse and register for events to see them here.</p>
            <Link href="/">
              <Button className="bg-white text-black hover:bg-gray-200">
                Browse Events
              </Button>
            </Link>
          </div>
        )}

        {/* Events Grid */}
        {displayEvents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
            {displayEvents.map((event) => {
              // Find the registration data for this event to show status
                const registration = registrationsData?.results?.find((r: any) => {
                  const regEventId = (typeof r.event === 'object' && r.event !== null) ? r.event.id : r.event;
                  return regEventId === parseInt(event.id);
                });
                if (process.env.NODE_ENV !== 'production') {
                  console.log('Found registration for event', event.id, ':', registration);
                  console.log('Registration status check:', registration?.registration_status, 'payment_status:', registration?.payment_status, 'event.payment_type:', (registration as any)?.event?.payment_type);
                }
                const regStatus = typeof registration?.registration_status === 'string'
                  ? registration.registration_status.toLowerCase()
                  : undefined;
                const isPaidEvent = ((registration as any)?.event?.payment_type === 'paid') || (event.price !== 'Free');

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="block w-full text-left"
                >
                  <div className="w-full h-[320px] sm:h-[300px] md:h-[320px] lg:h-[340px] bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-all duration-500 shadow-lg hover:shadow-xl group">
                    <div className="p-4 sm:p-4 md:p-5 lg:p-6 h-full">
                      <div className="flex items-start justify-between gap-4 sm:gap-4 md:gap-5 lg:gap-6 h-full">
                        <div className="flex-1 space-y-3 sm:space-y-2 md:space-y-3 h-full flex flex-col justify-between min-w-0">
                          <div className="space-y-2 sm:space-y-2 md:space-y-3">
                            <div className="text-gray-400 text-sm sm:text-xs md:text-sm font-medium">
                              {event.date}, {event.time}
                            </div>

                            <h3 className="text-white text-base sm:text-base md:text-lg font-semibold leading-snug line-clamp-2 overflow-hidden whitespace-normal group-hover:text-gray-200 transition-colors duration-300">
                              {event.title}
                            </h3>

                            {event.description && (
                              <p className="text-gray-300 text-sm sm:text-xs md:text-sm leading-relaxed line-clamp-2 overflow-hidden whitespace-normal">
                                {event.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 sm:space-y-1 md:space-y-2">
                            <div className="text-gray-400 text-sm sm:text-xs md:text-sm font-medium overflow-hidden whitespace-normal line-clamp-1">
                              {event.location}
                            </div>

                            <div className="text-green-400 text-sm sm:text-xs md:text-sm font-semibold overflow-hidden whitespace-normal line-clamp-1">
                              {event.price}
                            </div>

                            {/* Registration Status */}
                            <div className="flex flex-wrap items-center gap-2">
                              {regStatus === 'confirmed' ? (
                                <div className="flex items-center gap-1 text-green-300 text-xs bg-green-500/10 border border-green-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Confirmed</span>
                                </div>
                              ) : regStatus === 'pending' ? (
                                <div className="flex items-center gap-1 text-yellow-300 text-xs bg-yellow-500/10 border border-yellow-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending</span>
                                </div>
                              ) : regStatus === 'cancelled' ? (
                                <div className="flex items-center gap-1 text-red-300 text-xs bg-red-500/10 border border-red-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <XCircle className="w-3 h-3" />
                                  <span>Cancelled</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-300 text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <span>Status unknown</span>
                                </div>
                              )}

                              {isPaidEvent && registration?.payment_status && (
                                <div className="flex items-center gap-1 text-green-300 text-xs bg-green-500/10 border border-green-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <DollarSign className="w-3 h-3" />
                                  <span>Paid</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="w-24 h-24 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 bg-gray-800 border border-gray-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-gray-500 transition-all duration-300">
                          {event.image && event.image !== '/placeholder-event.jpg' ? (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-4xl font-bold">
                              {event.category?.charAt(0) || 'E'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}