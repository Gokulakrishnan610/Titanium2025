"use client"

import { Clock, BookOpen, Users, MapPin, Armchair } from "lucide-react"
import { useEventGuide } from "@/lib/hooks/useEvents"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EventGuideDisplayProps {
  eventId: number
  className?: string
}

export default function EventGuideDisplay({ eventId, className = "" }: EventGuideDisplayProps) {
  const { data: eventGuide, isLoading, error } = useEventGuide(eventId)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Event Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !eventGuide) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Event Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No event guide available for this event.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Event Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Language */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Language</div>
              <div className="font-medium">{eventGuide.language_display}</div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-medium">{eventGuide.duration}</div>
            </div>
          </div>

          {/* Tickets Needed For */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tickets Needed For</div>
              <div className="font-medium">{eventGuide.tickets_needed_for}</div>
            </div>
          </div>

          {/* Entry Allowed For */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Entry Allowed For</div>
              <div className="font-medium">{eventGuide.entry_allowed_for_display}</div>
            </div>
          </div>

          {/* Layout */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Layout</div>
              <div className="font-medium">{eventGuide.layout_display}</div>
            </div>
          </div>

          {/* Seating Arrangement */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <Armchair className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Seating Arrangement</div>
              <div className="font-medium">{eventGuide.seating_arrangement_display}</div>
            </div>
          </div>
        </div>

          {/* Venue */}
          <div className="flex items-center gap-3 md:col-span-2">
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Venue</div>
              <div className="font-medium">{eventGuide.venue}</div>
            </div>
          </div>

        {/* Last Updated */}
        {eventGuide.updated_at && (
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            Last updated: {new Date(eventGuide.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}