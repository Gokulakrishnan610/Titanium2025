"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Globe, CalendarDays, Clock3, Ticket, Users, Camera, Palette, Upload, X } from "lucide-react"
import Image from "next/image"
import { CreateEventData } from "@/lib/api/events"

function Pill({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground border border-border",
        onClick && "cursor-pointer hover:bg-secondary/80",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </span>
  )
}

function Row({
  leftIcon,
  label,
  children,
}: {
  leftIcon?: React.ReactNode
  label: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-foreground/80">{leftIcon}</span>
        <span className="text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function CoverCard({
  imageFile,
  onImageChange,
  onImageRemove
}: {
  imageFile: File | null
  onImageChange: (file: File) => void
  onImageRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  // Create object URL when imageFile changes and clean up previous one
  useEffect(() => {
    // Clean up previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    // Clear previous preview
    setImagePreview(null)

    if (imageFile) {
      // Create object URL for immediate preview
      objectUrlRef.current = URL.createObjectURL(imageFile)
      setImagePreview(objectUrlRef.current)
    }
  }, [imageFile])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImageChange(file)
      // The useEffect will handle creating the preview
    }
  }

  const handleRemoveImage = () => {
    // Clean up object URL when removing image
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    // Clear preview state
    setImagePreview(null)

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Notify parent component
    onImageRemove()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card h-[320px] w-[320px] md:h-[360px] md:w-[360px]">
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt="Event cover artwork"
              width={640}
              height={640}
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
              priority
            />
            <button
              aria-label="Remove cover"
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-red-500 text-white shadow hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div
            onClick={handleImageClick}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-xl"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload cover image</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 10MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload event cover image"
        />

        {imagePreview && (
          <button
            aria-label="Change cover"
            onClick={handleImageClick}
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground shadow hover:bg-secondary/80"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
          <div className="inline-flex h-8 w-10 items-center justify-center rounded-xl border border-border bg-secondary">
            <Palette className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Theme</div>
            <div className="truncate text-sm">Minimal</div>
          </div>
        </div>

        <button
          aria-label="Shuffle theme"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-card/80"
        >
          {"\u21BB"}
        </button>
      </div>
    </div>
  )
}

function HeaderChips({
  isPublic,
  onPublicChange
}: {
  isPublic: boolean
  onPublicChange: (isPublic: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Pill className={cn("cursor-pointer", isPublic ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800")} onClick={() => onPublicChange(!isPublic)}>
          <Globe className="h-4 w-4" />
          <button onClick={() => onPublicChange(!isPublic)}>
            {isPublic ? "Public" : "Private"}
          </button>
        </Pill>
      </div>
    </div>
  )
}

function DateTimePills({
  eventData,
  onEventDataChange
}: {
  eventData: Partial<CreateEventData>
  onEventDataChange: (field: keyof CreateEventData, value: string) => void
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [activeTimeField, setActiveTimeField] = useState<'start_time' | 'end_time'>('start_time')

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select Date"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "Select Time"
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleDateSelect = (date: string) => {
    onEventDataChange("event_date", date)
    setShowDatePicker(false)
  }

  const handleTimeSelect = (time: string) => {
    onEventDataChange(activeTimeField, time)
    setShowTimePicker(false)
  }

  const openTimePicker = (field: 'start_time' | 'end_time') => {
    setActiveTimeField(field)
    setShowTimePicker(true)
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
      <div className="rounded-xl border border-border bg-card p-3 relative">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center pt-1">
            <span className="text-xs text-muted-foreground">Start</span>
            <span className="my-1 h-6 w-px rounded bg-border" />
            <span className="text-xs text-muted-foreground">End</span>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill className="cursor-pointer hover:bg-secondary/80" onClick={() => setShowDatePicker(true)}>
                <CalendarDays className="h-4 w-4" />
                {formatDate(eventData.event_date || "")}
              </Pill>
              <Pill className="cursor-pointer hover:bg-secondary/80" onClick={() => openTimePicker('start_time')}>
                <Clock3 className="h-4 w-4" />
                {formatTime(eventData.start_time || "")}
              </Pill>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill className="cursor-pointer hover:bg-secondary/80" onClick={() => setShowDatePicker(true)}>
                <CalendarDays className="h-4 w-4" />
                {formatDate(eventData.event_date || "")}
              </Pill>
              <Pill className="cursor-pointer hover:bg-secondary/80" onClick={() => openTimePicker('end_time')}>
                <Clock3 className="h-4 w-4" />
                {formatTime(eventData.end_time || "")}
              </Pill>
            </div>
          </div>
        </div>

        {/* Calendar Picker Modal */}
        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Select Date</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowDatePicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="date"
              value={eventData.event_date || ''}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              aria-label="Select event date"
            />
          </div>
        )}

        {/* Time Picker Modal */}
        {showTimePicker && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 min-w-[250px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Select {activeTimeField === 'start_time' ? 'Start' : 'End'} Time</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowTimePicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="time"
              value={eventData[activeTimeField] || ''}
              onChange={(e) => handleTimeSelect(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              aria-label={`Select ${activeTimeField === 'start_time' ? 'start' : 'end'} time`}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <div className="text-sm font-medium">GMT+05:30</div>
            <div className="text-xs text-muted-foreground">Asia/Kolkata</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CollapsedRow({
  title,
  subtitle,
  onClick,
}: {
  title: string
  subtitle?: string
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3",
        onClick && "cursor-pointer hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="text-sm font-medium break-words whitespace-pre-wrap">{title}</div>
      {subtitle ? <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap">{subtitle}</div> : null}
    </div>
  )
}

function EventOptions({
  eventData,
  onEventDataChange
}: {
  eventData: Partial<CreateEventData>
  onEventDataChange: (field: keyof CreateEventData, value: unknown) => void
}) {
  return (
    <Card className="border border-border bg-secondary/40 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-muted-foreground">Event Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row leftIcon={<Globe className="h-4 w-4" />} label="Event Type">
          <select
            value={eventData.event_type || "workshop"}
            onChange={(e) => onEventDataChange("event_type", e.target.value)}
            className="text-sm bg-transparent border border-border rounded-lg px-2 py-1 hover:bg-secondary"
            aria-label="Select event type"
          >
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="competition">Competition</option>
            <option value="hackathon">Hackathon</option>
            <option value="meetup">Meetup</option>
            <option value="conference">Conference</option>
            <option value="other">Other</option>
          </select>
        </Row>
        <Row leftIcon={<Users className="h-4 w-4" />} label="Participation">
          <select
            value={eventData.participation_type || "intra"}
            onChange={(e) => onEventDataChange("participation_type", e.target.value)}
            className="text-sm bg-transparent border border-border rounded-lg px-2 py-1 hover:bg-secondary"
            aria-label="Select participation type"
          >
            <option value="intra">Intra College</option>
            <option value="inter">Inter College</option>
          </select>
        </Row>
        <Row leftIcon={<Ticket className="h-4 w-4" />} label="Tickets">
          <button
            className="text-sm underline underline-offset-2 rounded-lg px-2 py-1 hover:bg-secondary"
            onClick={() => onEventDataChange("payment_type", eventData.payment_type === "free" ? "paid" : "free")}
          >
            {eventData.payment_type === "free" ? "Free" : "Paid"}
          </button>
        </Row>
        {eventData.payment_type === "paid" && (
          <Row leftIcon={<Ticket className="h-4 w-4" />} label="Price">
            <input
              type="number"
              value={eventData.price || ''}
              onChange={(e) => onEventDataChange("price", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Enter price"
              className="text-sm bg-transparent border border-border rounded-lg px-2 py-1 hover:bg-secondary w-24"
              min="0"
              step="0.01"
            />
          </Row>
        )}
        <Row leftIcon={<Users className="h-4 w-4" />} label="Capacity">
          <input
            type="number"
            value={eventData.max_participants || ''}
            onChange={(e) => onEventDataChange("max_participants", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Unlimited"
            className="text-sm bg-transparent border border-border rounded-lg px-2 py-1 hover:bg-secondary w-24"
            min="1"
          />
        </Row>
      </CardContent>
    </Card>
  )
}

interface EventFormProps {
  eventData: Partial<CreateEventData>
  imageFile: File | null
  isLoading: boolean
  onEventDataChange: (field: keyof CreateEventData, value: unknown) => void
  onImageChange: (file: File) => void
  onImageRemove: () => void
  onCreateEvent: () => void
}

export default function EventForm({
  eventData,
  imageFile,
  isLoading,
  onEventDataChange,
  onImageChange,
  onImageRemove,
  onCreateEvent
}: EventFormProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[380px_1fr]">
      <CoverCard
        imageFile={imageFile}
        onImageChange={onImageChange}
        onImageRemove={onImageRemove}
      />

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <input
            id="event-title"
            value={eventData.event_name || ""}
            onChange={(e) => onEventDataChange("event_name", e.target.value)}
            placeholder="Enter event name"
            className={`w-full font-semibold tracking-tight border-none bg-transparent p-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0`}
          />
        </div>

        <DateTimePills
          eventData={eventData}
          onEventDataChange={onEventDataChange}
        />

        <CollapsedRow
          title={eventData.venue || "Add Event Location"}
          subtitle="Offline location or virtual link"
          onClick={() => {
            const location = prompt("Enter event location:", eventData.venue || "")
            if (location !== null) {
              onEventDataChange("venue", location)
            }
          }}
        />

        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium">Registration Deadline</div>
          </div>
          <input
            type="date"
            value={eventData.registration_deadline || ''}
            onChange={(e) => onEventDataChange("registration_deadline", e.target.value)}
            className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
            aria-label="Registration deadline"
            required
          />
          <div className="text-xs text-muted-foreground mt-1">Last date for event registration</div>
        </div>

        <CollapsedRow
          title={eventData.description || "Add Description"}
          onClick={() => {
            const description = prompt("Enter event description:", eventData.description || "")
            if (description !== null) {
              onEventDataChange("description", description)
            }
          }}
        />

        <EventOptions
          eventData={eventData}
          onEventDataChange={onEventDataChange}
        />

        <div className="mt-2">
          <Button
            onClick={onCreateEvent}
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            aria-label="Create Event"
          >
            {isLoading ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </div>
    </div>
  )
}