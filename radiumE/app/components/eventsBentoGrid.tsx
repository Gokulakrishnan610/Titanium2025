"use client"

import { useState } from "react"
import EventDetail from "./eventDetail"
import { HyperText } from "./external/hyperText"
import { useEvents } from "../../lib/hooks/useEvents"
import { EventListItem } from "../../lib/api/events"

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
  event_video?: string
  video_url?: string
}

interface EventsBentoGridProps {
  events?: LegacyEvent[]
  title?: string
  filters?: string[]
  onFilterChange?: (filter: string) => void
  activeFilters?: string[]
}

const defaultEvents: LegacyEvent[] = [
  {
    id: "1",
    title: "Minichestra Beyond Borders - Japan ANIME Classic Concert in Chennai",
    subtitle: "",
    description:
      "Experience the magic of Japanese anime music performed by a live orchestra. A spectacular evening featuring iconic soundtracks from beloved anime series.",
    date: "Sun, 21 Sep",
    time: "2:00 PM",
    location: "Sir Mutha Venkatasubba Rao Concert Hall, Chennai",
    price: "Free",
    image: "/anime-concert-poster-with-japanese-theme.jpg",
    category: "Music",
  },
  {
    id: "2", 
    title: "V2 Live : Vidyasagar (Day 1) and Vijay Antony (Day 2)",
    subtitle: "",
    description:
      "Two days of incredible music featuring renowned composers Vidyasagar and Vijay Antony. Don't miss this exclusive live performance event.",
    date: "Sat, 20 Sep – Sun, 21 Sep",
    time: "7:00 PM",
    location: "Park Ground, Codissia Road, Coimbatore",
    price: "₹1800 onwards",
    image: "/music-concert-poster-with-two-performers.jpg",
    category: "Music",
  },
  {
    id: "3",
    title: "Tech Conference 2025 - AI & Future Technologies",
    subtitle: "",
    description:
      "Join industry leaders and innovators for a day of insights into artificial intelligence, machine learning, and emerging technologies.",
    date: "Fri, 25 Oct",
    time: "9:00 AM",
    location: "Radisson Blu, Chennai",
    price: "₹2500",
    image: "/tech-conference-poster.jpg",
    category: "Technology",
  },
  {
    id: "4",
    title: "Food Festival - Taste of Chennai",
    subtitle: "",
    description:
      "Explore the diverse culinary landscape of Chennai with over 50 food vendors offering traditional and modern delicacies.",
    date: "Sat, 26 Oct",
    time: "11:00 AM",
    location: "Phoenix MarketCity, Chennai",
    price: "Free Entry",
    image: "/food-festival-poster.jpg",
    category: "Food",
  },
  {
    id: "5",
    title: "Startup Pitch Night",
    subtitle: "",
    description:
      "Watch innovative startups pitch their ideas to investors and industry experts. Network with entrepreneurs and potential investors.",
    date: "Thu, 24 Oct",
    time: "6:00 PM",
    location: "IIT Madras Research Park",
    price: "₹500",
    image: "/startup-pitch-poster.jpg",
    category: "Business",
  },
]

const defaultFilters = ["Filters", "This Weekend", "Today", "Tomorrow", "Under 10 km", "Music", "Sports"]

// Helper function to transform API event to display format
const transformApiEvent = (apiEvent: EventListItem): LegacyEvent => {
  // Parse the event date
  const eventDate = new Date(apiEvent.event_date);
  
  // Format date like "Sun, 21 Sep"
  const dateStr = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
  
  // Format time like "2:00 PM"
  const timeStr = eventDate.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
  
  return {
    id: apiEvent.id.toString(),
    title: apiEvent.event_name,
    description: apiEvent.description || '', // Now includes description from API
    date: dateStr,
    time: timeStr,
    location: apiEvent.venue || 'TBD',
    price: apiEvent.payment_type_display || 'TBD', // Use display value: "Free" or "Paid"
    image: apiEvent.event_image_url || apiEvent.event_image || '/placeholder-event.jpg',
    category: apiEvent.event_type_display || 'General',
    event_video: apiEvent.event_video || undefined,
    video_url: apiEvent.video_url || undefined,
  }
}

export default function EventsBentoGrid({
  events: staticEvents,
  title = "EVENTS",
  filters = defaultFilters,
  onFilterChange,
  activeFilters = ["This Weekend"],
}: EventsBentoGridProps) {
  const [selectedEvent, setSelectedEvent] = useState<LegacyEvent | null>(null)
  const [isTerminalMode, setIsTerminalMode] = useState(false)
  
  // Use API to fetch events (now public endpoint per backend changes)
  // NOTE: Removed is_upcoming filter - let's show ALL events for now
  const { data: apiEventsData, isLoading, error } = useEvents({ 
    payment_type: activeFilters?.includes("Free") ? "free" : undefined,
    // is_upcoming: activeFilters?.includes("This Weekend") ? true : undefined, // Commented out - shows all events
    page_size: 20
  })
  
  // Transform API events to legacy format for compatibility
  const apiEvents: LegacyEvent[] = apiEventsData?.results?.map(transformApiEvent) || []
  
  // Use API events if available, fallback to static events only if explicitly provided
  // Don't fall back to defaultEvents - show "No Events" message instead
  const events: LegacyEvent[] = apiEvents.length > 0 
    ? apiEvents 
    : (staticEvents && staticEvents.length > 0) 
      ? staticEvents 
      : []

  const handleEventClick = (event: LegacyEvent) => {
    setSelectedEvent(event)
  }

  const handleBackToGrid = () => {
    setSelectedEvent(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading events...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  // Show fallback events even if there's an error, with optional error message
  const showErrorBanner = error && apiEvents.length === 0

  if (selectedEvent) {
    return <EventDetail event={selectedEvent} onBack={handleBackToGrid} />
  }

  return (
    
    <div
      className={`min-h-screen ${isTerminalMode ? "bg-black" : "bg-black"} ${isTerminalMode ? "text-white" : "text-white"}`}
    >
      
      {/* Error Banner - Show when API fails but still display fallback events */}
      {showErrorBanner && (
        <div className="w-full mx-auto px-4 sm:px-4 md:px-6 lg:px-8 pt-6">
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 text-sm">
                ⚠️ Unable to load live events. Showing sample events below.
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="ml-auto px-3 py-1 bg-yellow-600 text-yellow-100 text-xs rounded hover:bg-yellow-500 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full mx-auto py-6 sm:py-6 md:py-8 lg:py-[34px] px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-5 md:gap-6 lg:gap-8 w-full mb-8 sm:mb-7 md:mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 md:gap-3 items-baseline flex-1">
              <div className="flex items-center gap-3 w-full">
                {isTerminalMode ? (
                  <HyperText
                    className="text-green-400 text-xl sm:text-lg md:text-xl lg:text-2xl font-bold font-mono"
                    duration={1000}
                    animateOnHover={true}
                  >
                    {title}
                  </HyperText>
                ) : (
                  <div className="text-xl sm:text-lg md:text-xl lg:text-2xl font-medium leading-tight tracking-wide text-white pb-12 ml-3">
                    {title}
                  </div>
                )}
              </div>
            </div>
            {/* <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">Terminal Mode</span>
              <button
                onClick={() => setIsTerminalMode(!isTerminalMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black ${
                  isTerminalMode ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    isTerminalMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div> */}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          {events.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-6xl">📅</div>
                <h3 className="text-2xl font-semibold text-white">No Events Scheduled Yet</h3>
                <p className="text-gray-400 text-lg">Check back soon for upcoming events!</p>
              </div>
            </div>
          ) : (
            events.map((event) => (
              <button key={event.id} onClick={() => handleEventClick(event)} className="block w-full text-left">
                {isTerminalMode ? (
                  <div className="w-full h-[300px] bg-gray-900 border border-green-500/30 rounded-xl overflow-hidden hover:border-green-400/50 transition-all duration-500 shadow-lg hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02] group">
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b border-green-500/20">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-xs ml-2 font-mono">event_{event.id}.log</span>
                    </div>

                    <div className="h-full bg-black/95 p-4 flex flex-col">
                      <div className="w-full h-20 bg-gray-800 border border-green-500/30 rounded-lg mb-3 overflow-hidden group-hover:border-green-400/50 transition-all duration-300 flex items-center justify-center">
                        {event.image && event.image !== '/placeholder-event.jpg' ? (
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                          />
                        ) : (
                          <div className="text-green-400 text-2xl font-bold">
                            {event.category?.charAt(0) || 'E'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-xs">
                        <div className="text-green-400 font-medium">
                          <span className="text-gray-500">$</span> {event.date}, {event.time}
                        </div>

                        <div className="text-green-300 font-semibold text-sm leading-tight">
                          {">"} {event.title.length > 40 ? `${event.title.substring(0, 40)}...` : event.title}
                        </div>

                        {event.description && (
                          <div className="text-gray-300 leading-relaxed">
                            {"#"}{" "}
                            {event.description.length > 70
                              ? `${event.description.substring(0, 70)}...`
                              : event.description}
                          </div>
                        )}

                        <div className="text-cyan-400 font-medium">
                          {"@"} {event.location.length > 30 ? `${event.location.substring(0, 30)}...` : event.location}
                        </div>

                        <div className="text-yellow-400 font-semibold">
                          {"$"} {event.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[260px] sm:h-[230px] md:h-[240px] lg:h-[250px] bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden hover:border-gray-600 transition-all duration-500 shadow-lg hover:shadow-xl group">
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
                          </div>
                        </div>

                        <div className="w-20 h-20 sm:w-18 sm:h-18 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-gray-500 transition-all duration-300">
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
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
