import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  useEvent,
  useRegistrationStatus,
  useEventQuestions,
  useRegisterForEvent,
} from "../../lib/hooks/useEvents";
import { useAuth } from "../../lib/hooks/useAuth";
import { EventQuestion, Event } from "../../lib/api/events";
import EventGuideDisplay from "./event-guide-display";
import EventRegistration from "../../components/EventRegistration";
import QRCode from "qrcode";

// Legacy interface for props
interface LegacyEvent {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  price: string;
  image: string;
  category?: string;
  languages?: string[];
  duration?: string;
  ageRequirement?: string;
  entryAllowed?: string;
  layout?: string;
  seatingArrangement?: string;
  kidFriendly?: boolean;
  petFriendly?: boolean;
  fullDescription?: string;
}

interface EventDetailProps {
  event: LegacyEvent;
  onBack: () => void;
}

export default function EventDetail({
  event: legacyEvent,
  onBack,
}: EventDetailProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationAnswers, setRegistrationAnswers] = useState<
    Record<number, string | string[]>
  >({});
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // API hooks
  const { isAuthenticated } = useAuth();

  const { data: apiEvent, isLoading } = useEvent(parseInt(legacyEvent.id));

  const { data: registrationStatus, refetch: refetchRegistrationStatus } =
    useRegistrationStatus(parseInt(legacyEvent.id), isAuthenticated);

  // Debug logging for registration status
  console.log('EventDetail-My-Events - Registration Status:', {
    eventId: legacyEvent.id,
    isAuthenticated,
    registrationStatus,
    is_registered: registrationStatus?.is_registered,
    payment_status: registrationStatus?.payment_status,
    registration: registrationStatus?.registration,
    hash: registrationStatus?.registration?.hash
  });

  const { data: eventQuestions, isLoading: questionsLoading } = useEventQuestions(
    parseInt(legacyEvent.id),
    isAuthenticated && !registrationStatus?.is_registered
  );

  // Generate QR code when component mounts and user is registered
  useEffect(() => {
    // Debug loggings for qru generation
    console.log('QR Code Generation Effect - registrationStatus:', registrationStatus);
    console.log('QR Code Generation Effect - is_registered:', registrationStatus?.is_registered);
    console.log('QR Code Generation Effect - registered (fallback):', (registrationStatus as any)?.registered);
    console.log('QR Code Generation Effect - registration object:', registrationStatus?.registration);
    console.log('QR Code Generation Effect - hash:', registrationStatus?.registration?.hash);

    const isUserRegistered = registrationStatus?.is_registered || (registrationStatus as any)?.registered;
    console.log('QR Code Generation Effect - isUserRegistered:', isUserRegistered);

    if (isUserRegistered && registrationStatus?.registration?.hash) {
      console.log('Generating QR code for hash:', registrationStatus.registration.hash);
      QRCode.toDataURL(registrationStatus.registration.hash)
        .then((url: string) => {
          console.log('QR code generated successfully:', url.substring(0, 50) + '...');
          setQrCodeUrl(url);
        })
        .catch((err: any) => {
          console.error('Error generating QR code:', err);
          setQrCodeUrl(null);
        });
    } else {
      console.log('Not generating QR code - conditions not met');
      setQrCodeUrl(null);
    }
  }, [registrationStatus]);


  const registerMutation = useRegisterForEvent();

  const event =
  apiEvent && typeof apiEvent.id !== "undefined"
      ? {
          id: apiEvent.id.toString(),
          title: apiEvent.event_name || legacyEvent.title,
          description: apiEvent.description || legacyEvent.description || "",
          date: apiEvent.event_date
            ? new Date(apiEvent.event_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : legacyEvent.date,
          image:
            apiEvent.event_image_url ||
            apiEvent.event_image ||
            legacyEvent.image ||
            "/placeholder-event.jpg",
          fullDescription:
            apiEvent.description || legacyEvent.fullDescription || "",
          languages: legacyEvent.languages || ["English", "Hindi"],
          duration: legacyEvent.duration || "3 Days",
          ageRequirement: legacyEvent.ageRequirement || "13 yrs & above",
          entryAllowed: legacyEvent.entryAllowed || "All ages",
          layout: legacyEvent.layout || "Outdoor",
          seatingArrangement: legacyEvent.seatingArrangement || "Standing",
          kidFriendly:
            legacyEvent.kidFriendly !== undefined
              ? legacyEvent.kidFriendly
              : true,
          petFriendly:
            legacyEvent.petFriendly !== undefined
              ? legacyEvent.petFriendly
              : true,
          category: apiEvent.event_type_display || legacyEvent.category,
          price:
            apiEvent.payment_type === "free"
              ? "Free"
              : apiEvent.price
              ? `₹${apiEvent.price}`
              : legacyEvent.price || "Paid",
          location: apiEvent.venue || legacyEvent.location,
          time:
            apiEvent.start_time && apiEvent.end_time
              ? `${apiEvent.start_time} - ${apiEvent.end_time}`
              : legacyEvent.time,
        }
      : legacyEvent;

  // Show loading spinner while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading event details...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  const fullDescription =
    event.fullDescription ||
    event.description ||
    `Welcome to ${event.title}! This is an amazing event that brings together enthusiasts from all walks of life. Experience incredible performances, engaging workshops, and networking opportunities with like-minded individuals. Join us for an unforgettable experience filled with learning, entertainment, and community building. Don't miss out on this spectacular gathering that promises to deliver exceptional value and memorable moments.`;

  const truncatedDescription =
    fullDescription.length > 200
      ? fullDescription.substring(0, 200) + "..."
      : fullDescription;

  // Function to render description with links
  const renderDescription = (text: string) => {
    const parts = text.split(/(\[.*?\])/);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const linkText = part.slice(1, -1);
        // Check if it's a URL
        if (linkText.startsWith('http://') || linkText.startsWith('https://')) {
          return (
            <a
              key={index}
              href={linkText}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              {linkText}
            </a>
          );
        }
      }
      return part;
    });
  };

  const handleRegistrationFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];
    eventQuestions?.forEach((question: EventQuestion) => {
      if (
        question.required &&
        (!registrationAnswers[question.id] ||
          registrationAnswers[question.id] === "")
      ) {
        missingFields.push(question.label);
      }
    });

    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}`
      );
      return;
    }

    try {
      const answers = Object.entries(registrationAnswers).map(
        ([questionId, value]) => ({
          question: parseInt(questionId),
          value: value,
        })
      );

      await registerMutation.mutateAsync({
        eventId: parseInt(event.id),
        answers,
      });

      await refetchRegistrationStatus();
      setShowRegistrationForm(false);
      setRegistrationAnswers({});

      // Show success modal after successful form submission
      setShowRegistrationForm(false);
      setShowSuccessModal(true);
      refetchRegistrationStatus();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      alert(`Registration failed: ${errorMessage}`);
    }
  };

  const handleInputChange = (questionId: number, value: string | string[]) => {
    setRegistrationAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with back button */}
      <div className="w-full px-4 py-4 border-b border-gray-800/30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          title="Back to events"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to events
        </button>
      </div>

      <div className="w-full px-6 py-6 lg:px-12 lg:py-8">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Main Event Image/Poster */}
          <div className="flex-1 lg:flex-[2]">
            <div className="w-full h-[300px] sm:h-[400px] lg:h-[480px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
              <Image
                src={
                  event.image ||
                  "/placeholder.svg?height=480&width=800&query=event poster"
                }
                alt={event.title}
                className="w-full h-full object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
                style={{ objectFit: "cover" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all duration-300 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info Card */}
          <div className="lg:w-80 xl:w-96">
            <div className="bg-black/30 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 lg:sticky lg:top-8 shadow-2xl">
              {/* Title and Category */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-3 leading-tight text-white">
                  {event.title}
                </h1>
                {event.category && (
                  <div className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M17.2929 20.7071C17.5789 20.9931 18.009 21.0787 18.3827 20.9239C18.7564 20.7691 19 20.4045 19 20V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V20C5 20.4045 5.24364 20.7691 5.61732 20.9239C5.99099 21.0787 6.42111 20.9931 6.70711 20.7071L12 15.4142L17.2929 20.7071ZM7 4C6.44772 4 6 4.44772 6 5V8L18 8V5C18 4.44772 17.5523 4 17 4H7ZM18 9L6 9L6 9V20L11.2929 14.7071C11.6834 14.3166 12.3166 14.3166 12.7071 14.7071L18 20V9Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-white/70 text-sm font-medium">
                      {event.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Date and Location */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white/70"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8 4.5V6.5C8 6.77614 8.22386 7 8.5 7C8.77614 7 9 6.77614 9 6.5V4.5C9 4.22386 8.77614 4 8.5 4C8.22386 4 8 4.22386 8 4.5ZM7 6.5C7 7.32843 7.67157 8 8.5 8C9.32843 8 10 7.32843 10 6.5L10 6H14L14 6.5C14 7.32843 14.6716 8 15.5 8C16.3284 8 17 7.32843 17 6.5L17 6H18.5C19.3284 6 20 6.67157 20 7.5V10H4L4 7.5C4 6.67157 4.67157 6 5.5 6L7 6L7 6.5ZM17 5H18.5C19.8807 5 21 6.11929 21 7.5V18.5C21 19.8807 19.8807 21 18.5 21H5.5C4.11929 21 3 19.8807 3 18.5V7.5C3 6.11929 4.11929 5 5.5 5H7L7 4.5C7 3.67157 7.67157 3 8.5 3C9.32843 3 10 3.67157 10 4.5L10 5L14 5L14 4.5C14 3.67157 14.6716 3 15.5 3C16.3284 3 17 3.67157 17 4.5L17 5ZM4 11L4 18.5C4 19.3284 4.67157 20 5.5 20H18.5C19.3284 20 20 19.3284 20 18.5V11H4ZM15.5 7C15.2239 7 15 6.77614 15 6.5V4.5C15 4.22386 15.2239 4 15.5 4C15.7761 4 16 4.22386 16 4.5V6.5C16 6.77614 15.7761 7 15.5 7Z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="text-white font-medium">
                    {event.date}, {event.time}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white/70"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.5 10.0714C5.5 6.2881 8.96304 4 12 4C15.037 4 18.5 6.2881 18.5 10.0714C18.5 12.4463 17.3299 14.5887 15.8656 16.3303C14.4439 18.0211 12.8224 19.2405 12 19.8053C11.1776 19.2405 9.55612 18.0211 8.13442 16.3303C6.67006 14.5887 5.5 12.4463 5.5 10.0714ZM4.5 10.0714C4.5 5.57143 8.59091 3 12 3C15.4091 3 19.5 5.57143 19.5 10.0714C19.5 15.4847 14.1819 19.5305 12.5021 20.6734C12.1968 20.8812 11.8032 20.8812 11.4979 20.6734C9.81808 19.5305 4.5 15.4847 4.5 10.0714ZM10 10.5C10 9.39543 10.8954 8.5 12 8.5C13.1046 8.5 14 9.39543 14 10.5C14 11.6046 13.1046 12.5 12 12.5C10.8954 12.5 10 11.6046 10 10.5ZM12 7.5C10.3431 7.5 9 8.84315 9 10.5C9 12.1569 10.3431 13.5 12 13.5C13.6569 13.5 15 12.1569 15 10.5C15 8.84315 13.6569 7.5 12 7.5Z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="text-white font-medium">{event.location}</div>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-white/20 mb-6" />

              {/* Price and Book Button */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Starts from</p>
                  <p className="text-2xl font-bold text-white">{event.price}</p>
                </div>
                <button
                  onClick={() => {
                    if (apiEvent?.require_registration_form) {
                      setShowRegistrationForm(true);
                    } else {
                      setShowBookingModal(true);
                    }
                  }}
                  disabled={(() => {
                    const isUserRegistered = registrationStatus?.is_registered || (registrationStatus as any)?.registered;
                    return isUserRegistered || questionsLoading || !apiEvent;
                  })()}
                  className={`bg-white/90 backdrop-blur-md text-black font-semibold rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    apiEvent?.require_registration_form
                      ? "py-2 px-6 text-sm"
                      : "py-3 px-8"
                  }`}
                >
                  {(() => {
                    console.log('Button render - registrationStatus:', registrationStatus);
                    console.log('Button render - is_registered:', registrationStatus?.is_registered);
                    console.log('Button render - apiEvent:', !!apiEvent);
                    console.log('Button render - questionsLoading:', questionsLoading);
                    console.log('Button render - require_registration_form:', apiEvent?.require_registration_form);

                    // Check if user is registered (backend returns different field names)
                    const isUserRegistered = registrationStatus?.is_registered || (registrationStatus as any)?.registered;

                    if (isUserRegistered) {
                      console.log('Showing ALREADY REGISTERED');
                      return "ALREADY REGISTERED";
                    } else if (!apiEvent) {
                      console.log('Showing LOADING EVENT...');
                      return "LOADING EVENT...";
                    } else if (questionsLoading) {
                      console.log('Showing LOADING...');
                      return "LOADING...";
                    } else if (apiEvent?.require_registration_form) {
                      console.log('Showing FILL REGISTRATION FORM');
                      return "FILL REGISTRATION FORM";
                    } else {
                      console.log('Showing BOOK TICKETS');
                      return "BOOK TICKETS";
                    }
                  })()}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About the Event */}
        <div className="mb-8 lg:mb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">
            About the Event
          </h2>
          <div className="mb-4">
            <p className="text-white leading-relaxed mb-4">
              {showFullDescription ? renderDescription(fullDescription) : renderDescription(truncatedDescription)}
            </p>
            {fullDescription.length > 200 && (
              <button
                title="Close"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-white hover:text-white/80 transition-colors flex items-center gap-2 font-medium bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"
              >
                {showFullDescription ? "Show less" : "Show more"}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showFullDescription ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* My QR Section */}
        {(() => {
          console.log('QR Section Render - registrationStatus:', registrationStatus);
          console.log('QR Section Render - is_registered:', registrationStatus?.is_registered);
          console.log('QR Section Render - registered (fallback):', (registrationStatus as any)?.registered);
          console.log('QR Section Render - qrCodeUrl:', qrCodeUrl);

          const shouldShowQR = registrationStatus?.is_registered || (registrationStatus as any)?.registered;
          console.log('QR Section Render - shouldShowQR:', shouldShowQR);

          if (shouldShowQR) {
            return (
              <div className="mb-8 lg:mb-12">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  My QR Code
                </h2>
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <div className="text-center">
                    <p className="text-white/70 mb-4">
                      Use this QR code for attendance marking at the event
                    </p>
                    {qrCodeUrl ? (
                      <div className="inline-block p-4 bg-white rounded-lg">
                        <Image
                          src={qrCodeUrl}
                          alt="Attendance QR Code"
                          width={200}
                          height={200}
                          className="mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-white/10 rounded-lg flex items-center justify-center mx-auto">
                        <div className="text-white/50">Generating QR...</div>
                      </div>
                    )}
                    <p className="text-white/60 text-sm mt-4">
                      Show this QR code at the venue for quick check-in
                    </p>
                  </div>
                </div>
              </div>
            );
          } else {
            console.log('QR Section Render - Not showing QR section');
            return null;
          }
        })()}

        {/* Event Guide */}
        <div className="mb-8 lg:mb-12">
          <EventGuideDisplay
            eventId={parseInt(event.id)}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/60 [&_.border-border]:border-white/20"
          />
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">
                Complete Registration - {event.title}
              </h3>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="text-white/70 hover:text-white transition-colors p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form
                onSubmit={handleRegistrationFormSubmit}
                className="space-y-6"
              >
                {/* Event Summary */}
                <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Event Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Date:</span>
                      <span className="text-white font-medium">
                        {event.date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Time:</span>
                      <span className="text-white font-medium">
                        {event.time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Venue:</span>
                      <span className="text-white font-medium">
                        {event.location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Price:</span>
                      <span className="text-white font-medium">
                        {event.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Form Fields */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">
                    Registration Form
                  </h4>
                  {eventQuestions && eventQuestions.length > 0 ? (
                    eventQuestions.map((question: EventQuestion) => (
                      <div key={question.id} className="space-y-2">
                        <label className="block text-white font-medium">
                          {question.label}
                          {question.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </label>

                        {question.question_type === "short_text" && (
                          <input
                            type="text"
                            value={registrationAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                            placeholder={question.help_text || ""}
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            required={question.required}
                          />
                        )}

                        {question.question_type === "long_text" && (
                          <textarea
                            value={registrationAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                            placeholder={question.help_text || ""}
                            rows={4}
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                            required={question.required}
                          />
                        )}

                        {question.question_type === "email" && (
                          <input
                            type="email"
                            value={registrationAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                            placeholder={question.help_text || ""}
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            required={question.required}
                          />
                        )}

                        {question.question_type === "phone" && (
                          <input
                            type="tel"
                            value={registrationAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                            placeholder={question.help_text || ""}
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            required={question.required}
                          />
                        )}

                        {question.question_type === "number" && (
                          <input
                            type="number"
                            value={registrationAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                            placeholder={question.help_text || ""}
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            required={question.required}
                          />
                        )}

                        {question.question_type === "date" && (
                          <input
                            type="date"
                            value={registrationAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleInputChange(question.id, e.target.value)
                            }
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                            required={question.required}
                            aria-label={question.label}
                          />
                        )}

                        {question.question_type === "single_choice" &&
                          question.options && (
                            <select
                              value={registrationAnswers[question.id] || ""}
                              onChange={(e) =>
                                handleInputChange(question.id, e.target.value)
                              }
                              className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                              required={question.required}
                              aria-label={question.label}
                            >
                              <option value="">Select an option</option>
                              {question.options.map((option, index) => (
                                <option
                                  key={index}
                                  value={option}
                                  className="bg-black text-white"
                                >
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                        {question.question_type === "multi_choice" &&
                          question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, index) => (
                                <label
                                  key={index}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={(
                                      registrationAnswers[question.id] || []
                                    ).includes(option)}
                                    onChange={(e) => {
                                      const currentValues = Array.isArray(
                                        registrationAnswers[question.id]
                                      )
                                        ? (registrationAnswers[
                                            question.id
                                          ] as string[])
                                        : [];
                                      if (e.target.checked) {
                                        handleInputChange(question.id, [
                                          ...currentValues,
                                          option,
                                        ]);
                                      } else {
                                        handleInputChange(
                                          question.id,
                                          currentValues.filter(
                                            (v: string) => v !== option
                                          )
                                        );
                                      }
                                    }}
                                    className="rounded border-white/20 bg-black/20 text-white focus:ring-white/50"
                                  />
                                  <span className="text-white">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                        {question.question_type === "file" && (
                          <input
                            type="file"
                            onChange={(e) =>
                              handleInputChange(
                                question.id,
                                e.target.files?.[0]?.name || ""
                              )
                            }
                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white file:bg-white/20 file:text-white file:border-none file:rounded file:px-3 file:py-1 file:mr-3 focus:outline-none focus:ring-2 focus:ring-white/50"
                            required={question.required}
                            accept={question.help_text || "*"}
                            aria-label={question.label}
                          />
                        )}

                        {question.help_text &&
                          question.question_type !== "file" && (
                            <p className="text-white/60 text-sm">
                              {question.help_text}
                            </p>
                          )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/70">
                        No registration questions configured for this event.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                {eventQuestions && eventQuestions.length > 0 && (
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-white/90 backdrop-blur-md text-black font-semibold py-4 px-6 rounded-2xl hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white/20"
                  >
                    {registerMutation.isPending
                      ? "SUBMITTING..."
                      : "COMPLETE REGISTRATION"}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {showBookingModal && (
        <EventRegistration
          event={
            (apiEvent && typeof apiEvent.id === "number"
              ? ({
                  id: apiEvent.id,
                  event_name: apiEvent.event_name || event.title || "",
                  payment_type:
                    apiEvent.payment_type ||
                    (event.price === "Free" ? "free" : "paid"),
                  description: apiEvent.description || "",
                  event_date: apiEvent.event_date || "",
                  start_time: apiEvent.start_time || "",
                  end_time: apiEvent.end_time || "",
                  event_type: apiEvent.event_type || "other",
                  event_type_display: apiEvent.event_type_display || "",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  event_mode: (apiEvent as any).event_mode || "offline",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  event_mode_display: (apiEvent as any).event_mode_display || "Offline",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  meeting_url: (apiEvent as any).meeting_url || null,
                  payment_type_display: apiEvent.payment_type_display || "",
                  participation_type: apiEvent.participation_type || "intra",
                  participation_type_display:
                    apiEvent.participation_type_display || "",
                  price: apiEvent.price || 0,
                  max_participants: apiEvent.max_participants || 0,
                  registration_deadline: apiEvent.registration_deadline || "",
                  venue: apiEvent.venue || "",
                  is_active: apiEvent.is_active ?? true,
                  is_upcoming: apiEvent.is_upcoming ?? false,
                  is_registration_open: apiEvent.is_registration_open ?? false,
                  created_at: apiEvent.created_at || "",
                  updated_at: apiEvent.updated_at || "",
                  event_end_date: apiEvent.event_end_date || null,
                  gateway_options: apiEvent.gateway_options || null,
                  gateway_options_display: apiEvent.gateway_options_display || null,
                  gateway_credentials: apiEvent.gateway_credentials || null,
                  event_image: apiEvent.event_image || null,
                  event_image_url: apiEvent.event_image_url || null,
                  event_video: apiEvent.event_video || null,
                  video_url: apiEvent.video_url || null,
                  questions: apiEvent.questions || [],
                  require_registration_form: apiEvent.require_registration_form || false,
                } as unknown as Event)
              : {
                  id: parseInt(legacyEvent.id),
                  event_name: legacyEvent.title,
                  description: legacyEvent.description || "",
                  event_date: legacyEvent.date || "",
                  start_time: "",
                  end_time: "",
                  event_type: "other",
                  event_type_display: "",
                  event_mode: "offline",
                  event_mode_display: "Offline",
                  meeting_url: null,
                  payment_type: legacyEvent.price === "Free" ? "free" : "paid",
                  payment_type_display: "",
                  participation_type: "intra",
                  participation_type_display: "",
                  price: legacyEvent.price === "Free" ? 0 : 100,
                  max_participants: 100,
                  registration_deadline: "",
                  venue: legacyEvent.location || "",
                  is_active: true,
                  is_upcoming: false,
                  is_registration_open: true,
                  created_at: "",
                  updated_at: "",
                  event_end_date: null,
                  gateway_options: null,
                  gateway_options_display: null,
                  gateway_credentials: null,
                  event_image: null,
                  event_image_url: null,
                  event_video: null,
                  video_url: null,
                  questions: [],
                  require_registration_form: false,
                }) as Event
          }
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            setShowSuccessModal(true);
            refetchRegistrationStatus();
          }}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">
                Registration Successful!
              </h3>

              <p className="text-white/70 mb-8 leading-relaxed">
                Congratulations! You have successfully registered for{" "}
                <span className="font-semibold text-white">{event.title}</span>.
                {apiEvent?.payment_type === "paid"
                  ? " Please complete the payment to confirm your registration."
                  : " Your registration is now confirmed."}
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-white/90 backdrop-blur-md text-black font-semibold py-3 px-6 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-white/20"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
