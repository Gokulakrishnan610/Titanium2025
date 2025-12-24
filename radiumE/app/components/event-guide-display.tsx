'use client'

import { Clock } from "lucide-react"
import { useEventGuide } from "../../lib/hooks/useEvents"

interface EventGuideDisplayProps {
  eventId: number
  className?: string
}

export default function EventGuideDisplay({ eventId, className = "" }: EventGuideDisplayProps) {
  const { data: eventGuide, isLoading, error } = useEventGuide(eventId)

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <h2 className="text-2xl font-bold mb-6 text-foreground">Event Guide</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error || !eventGuide) {
    return (
      <div className={`p-6 ${className}`}>
        <h2 className="text-2xl font-bold mb-6 text-foreground">Event Guide</h2>
        <p className="text-muted-foreground">No event guide available for this event.</p>
      </div>
    )
  }

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-foreground">Event Guide</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Language</div>
            <div className="text-foreground font-medium">{eventGuide.language_display}</div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Duration</div>
            <div className="text-foreground font-medium">{eventGuide.duration}</div>
          </div>
        </div>

        {/* Tickets Needed For */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Tickets Needed For</div>
            <div className="text-foreground font-medium">{eventGuide.tickets_needed_for}</div>
          </div>
        </div>

        {/* Entry Allowed For */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Entry Allowed For</div>
            <div className="text-foreground font-medium">{eventGuide.entry_allowed_for_display}</div>
          </div>
        </div>

        {/* Layout */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Layout</div>
            <div className="text-foreground font-medium">{eventGuide.layout_display}</div>
          </div>
        </div>

        {/* Seating Arrangement */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm12 0a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Seating Arrangement</div>
            <div className="text-foreground font-medium">{eventGuide.seating_arrangement_display}</div>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-4 md:col-span-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Venue</div>
            <div className="text-foreground font-medium">{eventGuide.venue}</div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {eventGuide.updated_at && (
        <div className="text-sm text-muted-foreground border-t border-border pt-4 mt-6">
          Last updated: {new Date(eventGuide.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      )}
    </div>
  )
}