"use client"

import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEventGuide, useCreateEventGuide, useUpdateEventGuide, useDeleteEventGuide } from "@/lib/hooks/useEvents"
import { CreateEventGuideData } from "@/lib/api/events"

interface EventGuideModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: number
  eventName: string
}

export default function EventGuideModal({ isOpen, onClose, eventId, eventName }: EventGuideModalProps) {
  const [formData, setFormData] = useState<CreateEventGuideData>({
    language: 'english',
    duration: '',
    tickets_needed_for: '',
    entry_allowed_for: 'all_ages',
    layout: 'indoor',
    seating_arrangement: 'seated',
    venue: '',
  })

  const { data: existingGuide, isLoading: guideLoading } = useEventGuide(eventId, isOpen)
  const createGuideMutation = useCreateEventGuide()
  const updateGuideMutation = useUpdateEventGuide()
  const deleteGuideMutation = useDeleteEventGuide()

  const isEditing = !!existingGuide
  const isLoading = createGuideMutation.isPending || updateGuideMutation.isPending || deleteGuideMutation.isPending

  // Load existing guide data when modal opens
  useEffect(() => {
    if (existingGuide) {
      setFormData({
        language: existingGuide.language,
        duration: existingGuide.duration,
        tickets_needed_for: existingGuide.tickets_needed_for,
        entry_allowed_for: existingGuide.entry_allowed_for,
        layout: existingGuide.layout,
        seating_arrangement: existingGuide.seating_arrangement,
        venue: existingGuide.venue,
      })
    } else {
      // Reset form for new guide
      setFormData({
        language: 'english',
        duration: '',
        tickets_needed_for: '',
        entry_allowed_for: 'all_ages',
        layout: 'indoor',
        seating_arrangement: 'seated',
        venue: '',
      })
    }
  }, [existingGuide, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (isEditing) {
        await updateGuideMutation.mutateAsync({ eventId, data: formData })
        alert('Event guide updated successfully!')
      } else {
        await createGuideMutation.mutateAsync({ eventId, data: formData })
        alert('Event guide created successfully!')
      }
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to save event guide')
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    
    if (confirm('Are you sure you want to delete this event guide? This action cannot be undone.')) {
      try {
        await deleteGuideMutation.mutateAsync(eventId)
        alert('Event guide deleted successfully!')
        onClose()
      } catch (error: any) {
        alert(error.message || 'Failed to delete event guide')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            {isEditing ? 'Edit' : 'Create'} Event Guide - {eventName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {guideLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading event guide...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="tamil">Tamil</option>
                  <option value="english_hindi">English & Hindi</option>
                  <option value="english_tamil">English & Tamil</option>
                  <option value="all">All Languages</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 hours, 3 days, 1 week"
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* Tickets Needed For */}
              <div>
                <label className="block text-sm font-medium mb-2">Tickets Needed For</label>
                <input
                  type="text"
                  value={formData.tickets_needed_for}
                  onChange={(e) => setFormData({ ...formData, tickets_needed_for: e.target.value })}
                  placeholder="e.g., Entry, Food & Entry, All activities"
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* Entry Allowed For */}
              <div>
                <label className="block text-sm font-medium mb-2">Entry Allowed For</label>
                <select
                  value={formData.entry_allowed_for}
                  onChange={(e) => setFormData({ ...formData, entry_allowed_for: e.target.value as any })}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="all_ages">All Ages</option>
                  <option value="13_above">13 Years & Above</option>
                  <option value="18_above">18 Years & Above</option>
                  <option value="21_above">21 Years & Above</option>
                </select>
              </div>

              {/* Layout */}
              <div>
                <label className="block text-sm font-medium mb-2">Layout</label>
                <select
                  value={formData.layout}
                  onChange={(e) => setFormData({ ...formData, layout: e.target.value as any })}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Seating Arrangement */}
              <div>
                <label className="block text-sm font-medium mb-2">Seating Arrangement</label>
                <select
                  value={formData.seating_arrangement}
                  onChange={(e) => setFormData({ ...formData, seating_arrangement: e.target.value as any })}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="seated">Seated</option>
                  <option value="standing">Standing</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium mb-2">Venue</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g., Main Auditorium, Conference Hall A, Online"
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update Guide' : 'Create Guide'}
                    </>
                  )}
                </Button>

                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none"
                  >
                    Delete Guide
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}