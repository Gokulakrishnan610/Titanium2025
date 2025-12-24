"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useUpdateEvent,
  useEvent,
  useEventQuestions,
  useUpdateEventQuestions,
} from "@/lib/hooks/useEvents";
import { CreateEventData } from "@/lib/api/events";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  FileText,
} from "lucide-react";
import FormBuilder from "./form-builder";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  onSuccess?: () => void;
}

export default function EditEventModal({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: EditEventModalProps) {
  const [eventFormData, setEventFormData] = useState<Partial<CreateEventData & { event_end_date?: string; event_video?: string; video_url?: string; registration_deadline_time?: string }>>({
    event_name: "",
    description: "",
    event_date: "",
    event_end_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    event_type: "workshop",
    payment_type: "free",
    participation_type: "intra",
    max_participants: 100,
    registration_deadline: "",
    registration_deadline_time: "",
    price: undefined,
    event_video: "",
    video_url: "",
  });

  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isDeadlinePassed, setIsDeadlinePassed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [registrationFormData, setRegistrationFormData] = useState<any>(null);
  const [formBuilderKey, setFormBuilderKey] = useState(0);

  // API hooks
  const { data: eventData, isLoading: eventLoading } = useEvent(
    eventId,
    isOpen
  );
  const { data: questionsData } = useEventQuestions(eventId, isOpen);
  const updateEventMutation = useUpdateEvent();
  const updateQuestionsMutation = useUpdateEventQuestions();

  // Initialize registration form data when questions data changes
  useEffect(() => {
    if (isOpen && eventData) {
      const initialFormData = {
        requireRegistrationForm: eventData.require_registration_form || false,
        questions: questionsData || [],
      };
      setRegistrationFormData(initialFormData);
    }
  }, [questionsData, isOpen, eventData]);

  // Populate form when event data loads
  useEffect(() => {
    console.log("EditEventModal: Effect triggered", { eventData, isOpen, eventId });
    
    if (eventData && isOpen) {
      // Format the dates properly
      const eventDate = eventData.event_date
        ? new Date(eventData.event_date).toISOString().split("T")[0]
        : "";
      const registrationDeadline = eventData.registration_deadline
        ? new Date(eventData.registration_deadline).toISOString().split("T")[0]
        : "";
      const registrationDeadlineTime = eventData.registration_deadline
        ? new Date(eventData.registration_deadline).toISOString().split("T")[1].substring(0, 5)
        : "";

      // Extract end date from event_end_date if available, otherwise use event_date
      const eventEndDate = eventData.event_end_date
        ? new Date(eventData.event_end_date).toISOString().split("T")[0]
        : eventDate;

      setEventFormData({
        event_name: eventData.event_name || "",
        description: eventData.description || "",
        event_date: eventDate,
        event_end_date: eventEndDate,
        start_time: eventData.start_time || "",
        end_time: eventData.end_time || "",
        venue: eventData.venue || "",
        event_type: eventData.event_type || "workshop",
        payment_type: eventData.payment_type || "free",
        participation_type: eventData.participation_type || "intra",
        max_participants: eventData.max_participants || 100,
        registration_deadline: registrationDeadline,
        registration_deadline_time: registrationDeadlineTime,
        price: eventData.price
          ? parseFloat(eventData.price.toString())
          : undefined,
        require_registration_form: eventData.require_registration_form || false,
        event_video: eventData.event_video || "",
        video_url: eventData.video_url || "",
      });

      // Also update registration form data based on actual backend value
      setRegistrationFormData({
        requireRegistrationForm: eventData.require_registration_form || false,
        questions: eventData.questions || [],
      });
    }
  }, [eventData, isOpen]);

  // Timer for registration deadline
  useEffect(() => {
    if (!eventFormData.registration_deadline || !eventFormData.registration_deadline_time) {
      setTimeRemaining("");
      setIsDeadlinePassed(false);
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(`${eventFormData.registration_deadline}T${eventFormData.registration_deadline_time}`).getTime();
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setTimeRemaining("Deadline has passed");
        setIsDeadlinePassed(true);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let timeString = "";
      if (days > 0) timeString += `${days}d `;
      if (hours > 0 || days > 0) timeString += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
      timeString += `${seconds}s`;

      setTimeRemaining(timeString.trim());
      setIsDeadlinePassed(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [eventFormData.registration_deadline, eventFormData.registration_deadline_time]);

  const handleInputChange = (
    field: keyof (CreateEventData & { event_end_date?: string; event_video?: string; video_url?: string; registration_deadline_time?: string }),
    value: string | number | undefined
  ) => {
    setEventFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!eventFormData.event_name?.trim()) {
      alert("Event name is required");
      return;
    }
    if (!eventFormData.event_date) {
      alert("Event start date is required");
      return;
    }

    if (eventFormData.event_end_date && eventFormData.event_end_date < eventFormData.event_date) {
      alert("Event end date cannot be before start date");
      return;
    }
    if (!eventFormData.start_time) {
      alert("Start time is required");
      return;
    }
    if (!eventFormData.end_time) {
      alert("End time is required");
      return;
    }

    // Validation is now handled by the backend
    if (!eventFormData.venue?.trim()) {
      alert("Venue is required");
      return;
    }
    if (!eventFormData.registration_deadline) {
      alert("Registration deadline date is required");
      return;
    }
    if (!eventFormData.registration_deadline_time) {
      alert("Registration deadline time is required");
      return;
    }

    // Validate that registration deadline is at least 1 hour before event start time
    const deadlineDateTime = new Date(`${eventFormData.registration_deadline}T${eventFormData.registration_deadline_time}`);
    const eventStartDateTime = new Date(`${eventFormData.event_date}T${eventFormData.start_time}`);
    const eventStartMinusOneHour = new Date(eventStartDateTime.getTime() - (60 * 60 * 1000)); // Subtract 1 hour
    if (deadlineDateTime >= eventStartMinusOneHour) {
      alert("Registration deadline must be at least 1 hour before the event start time");
      return;
    }

    if (
      eventFormData.payment_type === "paid" &&
      (!eventFormData.price || eventFormData.price <= 0)
    ) {
      alert("Please specify a valid price for paid events");
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine deadline date and time
      const combinedDeadline = eventFormData.registration_deadline && eventFormData.registration_deadline_time
        ? new Date(`${eventFormData.registration_deadline}T${eventFormData.registration_deadline_time}`).toISOString()
        : eventFormData.registration_deadline;

      // First update the event details
      await updateEventMutation.mutateAsync({
        id: eventId,
        data: {
          ...eventFormData,
          registration_deadline: combinedDeadline,
          require_registration_form:
            registrationFormData?.requireRegistrationForm ?? false,
        },
      });

      // Then update the questions if form data exists
      if (registrationFormData?.requireRegistrationForm) {
        await updateQuestionsMutation.mutateAsync({
          eventId,
          questions: registrationFormData.questions || [],
        });
      }

      onSuccess?.();
      onClose();
      alert("Event updated successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setShowFormEditor(false);
      setFormBuilderKey((prev) => prev + 1); // Force remount of FormBuilder
      onClose();
    }
  };

  const handleEditForm = () => {
    setShowFormEditor(true);
  };

  const handleFormDataChange = (data: any) => {
    // Only update if the data has actually changed
    const currentDataString = JSON.stringify(data);
    const previousDataString = JSON.stringify(registrationFormData);

    if (currentDataString !== previousDataString) {
      setRegistrationFormData(data);
    }
  };

  const handleSaveForm = async () => {
    try {
      await updateQuestionsMutation.mutateAsync({
        eventId,
        questions: registrationFormData?.questions || [],
        requireRegistrationForm:
          registrationFormData?.requireRegistrationForm ?? false,
      });
      alert("Form updated successfully!");
      setShowFormEditor(false);
    } catch (error: any) {
      alert(error.message || "Failed to update form");
    }
  };

  if (eventLoading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Edit Event">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading event details...</span>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !showFormEditor}
        onClose={handleClose}
        title="Edit Event"
        className="max-w-2xl"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event_name" className="text-gray-100">
              Event Name *
            </Label>
            <input
              id="event_name"
              type="text"
              value={eventFormData.event_name || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("event_name", e.target.value)
              }
              placeholder="Enter event name"
              className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-100">
              Description
            </Label>
            <textarea
              id="description"
              value={eventFormData.description || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("description", e.target.value)
              }
              placeholder="Enter event description"
              rows={3}
              className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="event_date"
                className="flex items-center gap-2 text-gray-100"
              >
                <Calendar className="h-4 w-4" />
                Event Start Date *
              </Label>
              <input
                id="event_date"
                type="date"
                value={eventFormData.event_date || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("event_date", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="event_end_date"
                className="flex items-center gap-2 text-gray-100"
              >
                <Calendar className="h-4 w-4" />
                Event End Date
              </Label>
              <input
                id="event_end_date"
                type="date"
                value={eventFormData.event_end_date || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("event_end_date", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                min={eventFormData.event_date || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="start_time"
                className="flex items-center gap-2 text-gray-100"
              >
                <Clock className="h-4 w-4" />
                Start Time *
              </Label>
              <input
                id="start_time"
                type="time"
                value={eventFormData.start_time || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("start_time", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="end_time"
                className="flex items-center gap-2 text-gray-100"
              >
                <Clock className="h-4 w-4" />
                End Time *
              </Label>
              <input
                id="end_time"
                type="time"
                value={eventFormData.end_time || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("end_time", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="registration_deadline"
                className="flex items-center gap-2 text-gray-100"
              >
                <Calendar className="h-4 w-4" />
                Registration Deadline Date *
              </Label>
              <input
                id="registration_deadline"
                type="date"
                value={eventFormData.registration_deadline || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("registration_deadline", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="registration_deadline_time"
                className="flex items-center gap-2 text-gray-100"
              >
                <Clock className="h-4 w-4" />
                Registration Deadline Time *
              </Label>
              <input
                id="registration_deadline_time"
                type="time"
                value={eventFormData.registration_deadline_time || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("registration_deadline_time", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {eventFormData.registration_deadline && (
            <div className="space-y-2">
              <Label className="text-gray-100">
                Time Remaining Until Deadline
              </Label>
              <div className={`p-3 border rounded-md bg-card text-foreground ${isDeadlinePassed ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
                {timeRemaining}
              </div>
            </div>
          )}

          {/* Venue */}
          <div className="space-y-2">
            <Label
              htmlFor="venue"
              className="flex items-center gap-2 text-gray-100"
            >
              <MapPin className="h-4 w-4" />
              Venue *
            </Label>
            <input
              id="venue"
              type="text"
              value={eventFormData.venue || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("venue", e.target.value)
              }
              placeholder="Enter event location"
              className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Event Video URL */}
          <div className="space-y-2">
            <Label
              htmlFor="event_video"
              className="flex items-center gap-2 text-gray-100"
            >
              Event Video URL
            </Label>
            <input
              id="event_video"
              type="url"
              value={eventFormData.event_video || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("event_video", e.target.value)
              }
              placeholder="Enter event video URL (e.g., YouTube link)"
              className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Video URL (Social Media) */}
          <div className="space-y-2">
            <Label
              htmlFor="video_url"
              className="flex items-center gap-2 text-gray-100"
            >
              Social Media Post URL
            </Label>
            <input
              id="video_url"
              type="url"
              value={eventFormData.video_url || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("video_url", e.target.value)
              }
              placeholder="Enter social media post URL (Instagram, Twitter, etc.)"
              className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Event Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type" className="text-gray-100">
                Event Type
              </Label>
              <select
                id="event_type"
                value={eventFormData.event_type || "workshop"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleInputChange("event_type", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="competition">Competition</option>
                <option value="hackathon">Hackathon</option>
                <option value="meetup">Meetup</option>
                <option value="conference">Conference</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participation_type" className="text-gray-100">
                Participation Type
              </Label>
              <select
                id="participation_type"
                value={eventFormData.participation_type || "intra"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleInputChange("participation_type", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="intra">Intra College</option>
                <option value="inter">Inter College</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_type" className="text-gray-100">
                Payment Type
              </Label>
              <select
                id="payment_type"
                value={eventFormData.payment_type || "free"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleInputChange("payment_type", e.target.value)
                }
                className="w-full p-3 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {eventFormData.payment_type === "paid" && (
              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="flex items-center gap-2 text-gray-100"
                >
                  <DollarSign className="h-4 w-4" />
                  Price (₹)
                </Label>
                <input
                  id="price"
                  type="number"
                  value={eventFormData.price || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(
                      "price",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="max_participants"
              className="flex items-center gap-2 text-gray-100"
            >
              <Users className="h-4 w-4" />
              Maximum Participants
            </Label>
            <input
              id="max_participants"
              type="number"
              value={eventFormData.max_participants || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange(
                  "max_participants",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Enter maximum participants"
              min="1"
              className="w-full p-3 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Form Editor Button */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleEditForm}
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              Edit Registration Form
            </Button>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Event"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Form Editor Modal */}
      <Modal
        isOpen={showFormEditor}
        onClose={() => setShowFormEditor(false)}
        title={`Edit Registration Form - ${eventData?.event_name || "Event"}`}
        className="max-w-4xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto bg-card rounded-md pr-2 hover:pr-0">
          <FormBuilder
            key={formBuilderKey}
            onFormDataChange={handleFormDataChange}
            onToggleChange={async (enabled) => {
              // Update the event's require_registration_form field via API
              try {
                await updateEventMutation.mutateAsync({
                  id: eventId,
                  data: {
                    require_registration_form: enabled,
                  },
                });
                alert(`Registration form ${enabled ? 'enabled' : 'disabled'} successfully!`);
              } catch (error: any) {
                alert(error.message || `Failed to ${enabled ? 'enable' : 'disable'} registration form`);
                throw error; // Re-throw to prevent state update
              }
            }}
            initialQuestions={questionsData || []}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFormEditor(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveForm}
              disabled={updateQuestionsMutation.isPending}
            >
              {updateQuestionsMutation.isPending ? "Saving..." : "Save Form"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
