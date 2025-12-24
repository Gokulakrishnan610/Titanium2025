import { apiClient, ApiResponse, PaginatedResponse } from "./config";

// Event interfaces
export interface Event {
  id: number;
  event_name: string;
  description: string;
  event_date: string;
  event_end_date?: string | null;
  start_time: string;
  end_time: string;
  event_type:
    | "workshop"
    | "seminar"
    | "competition"
    | "hackathon"
    | "meetup"
    | "conference"
    | "other";
  event_type_display: string;
  event_mode: "offline" | "online";
  event_mode_display: string;
  meeting_url?: string | null;
  payment_type: "free" | "paid";
  payment_type_display: string;
  participation_type: "intra" | "inter";
  participation_type_display: string;
  price?: number | null;
  max_participants: number;
  registration_deadline: string;
  venue: string;
  event_image?: string | null;
  event_image_url?: string | null;
  event_video?: string | null;
  video_url?: string | null;
  gateway_options?: "payu" | "cashfree" | null;
  gateway_options_display?: string | null;
  gateway_credentials?: Record<string, any> | null;
  is_active: boolean;
  is_upcoming: boolean;
  is_registration_open: boolean;
  get_current_participants?: number;
  created_at: string;
  updated_at: string;
  questions?: EventQuestion[];
  require_registration_form?: boolean;
}

export interface EventListItem {
  id: number;
  event_name: string;
  description: string;
  event_date: string;
  event_type: string;
  event_type_display: string;
  payment_type: string;
  payment_type_display: string;
  venue: string;
  event_image?: string | null;
  event_image_url?: string | null;
  event_video?: string | null;
  video_url?: string | null;
  is_active: boolean;
  is_upcoming: boolean;
  questions?: EventQuestion[];
}

export interface EventRegistration {
  id: number;
  user: number;
  event: number;
  registration_status: "pending" | "confirmed" | "cancelled";
  payment_status: boolean;
  registered_at: string;
  updated_at: string;
}

export interface RegistrationStatus {
  is_registered: boolean;
  registration_status?: "pending" | "confirmed" | "cancelled";
  payment_status?: boolean;
  registered_at?: string;
  registration?: {
    hash?: string;
  };
}

export interface CreateEventData {
    event_name: string;
    description: string;
    event_date: string;
    event_end_date?: string;
    start_time: string;
    end_time: string;
    event_type:
      | "workshop"
      | "seminar"
      | "competition"
      | "hackathon"
      | "meetup"
      | "conference"
      | "other";
    event_mode: "offline" | "online";
    meeting_url?: string;
    payment_type: "free" | "paid";
    participation_type: "intra" | "inter";
    price?: number;
    max_participants: number;
    registration_deadline: string;
    venue: string;
    event_image?: File;
    event_video?: string;
    gateway_options?: "payu" | "cashfree";
    gateway_credentials?: Record<string, any>;
    require_registration_form?: boolean;
    questions?: Partial<EventQuestion>[];
  }

export interface EventQuestion {
  id: number;
  event: number;
  label: string;
  question_type: string;
  question_type_display: string;
  required: boolean;
  order: number;
  help_text: string;
  options?: string[] | null;
  created_at: string;
}

export interface EventGuide {
  id: number;
  event: number;
  language: 'english' | 'hindi' | 'tamil' | 'english_hindi' | 'english_tamil' | 'all';
  language_display: string;
  duration: string;
  tickets_needed_for: string;
  entry_allowed_for: 'all_ages' | '13_above' | '18_above' | '21_above';
  entry_allowed_for_display: string;
  layout: 'indoor' | 'outdoor' | 'hybrid';
  layout_display: string;
  seating_arrangement: 'standing' | 'seated' | 'mixed';
  seating_arrangement_display: string;
  venue: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventGuideData {
  language: 'english' | 'hindi' | 'tamil' | 'english_hindi' | 'english_tamil' | 'all';
  duration: string;
  tickets_needed_for: string;
  entry_allowed_for: 'all_ages' | '13_above' | '18_above' | '21_above';
  layout: 'indoor' | 'outdoor' | 'hybrid';
  seating_arrangement: 'standing' | 'seated' | 'mixed';
  venue: string;
}

export interface FormResponse {
  id: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name: string;
  };
  answers: Record<string, unknown>;
  submitted_at: string;
}

export interface EventFilters {
  event_type?: string;
  payment_type?: string;
  is_upcoming?: boolean;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// API error interface
interface ApiError {
  response?: {
    status: number;
    data: {
      message?: string;
      [key: string]: unknown;
    };
  };
  request?: unknown;
  message?: string;
}

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

// OD List interfaces
export interface ODListEntry {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_college: string;
  user_department: string;
  user_year: string;
  attended: boolean;
  registration_date: string;
}

export interface ODListResponse {
  event_id: number;
  event_name: string;
  od_list: ODListEntry[];
  total_count: number;
}

// Events service class
export class EventsService {
  static async getEvents(
    filters: EventFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<EventListItem>>> {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key, value]) => [key, String(value)])
        )
      );

      console.log("EventsService.getEvents: Making request to:", `/events/?${params}`);
      const response = await apiClient.get(`/events/?${params}`);
      console.log("EventsService.getEvents: Response data:", response.data);
      
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(
    filters: Omit<EventFilters, "is_upcoming"> = {}
  ): Promise<ApiResponse<PaginatedResponse<EventListItem>>> {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key, value]) => [key, String(value)])
        )
      );

      const response = await apiClient.get(`/events/upcoming/?${params}`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get single event by ID
  static async getEvent(id: number): Promise<ApiResponse<Event>> {
    try {
      console.log("EventsService.getEvent: Fetching event ID:", id);
      console.log("EventsService.getEvent: Making request to:", `/events/${id}/`);

      const response = await apiClient.get(`/events/${id}/`);

      console.log("EventsService.getEvent: Response status:", response.status);
      console.log("EventsService.getEvent: Response data:", response.data);

      // Backend returns { success: true, data: eventData }
      // We need to extract the actual event data
      const eventData = response.data.success ? response.data.data : response.data;
      console.log("EventsService.getEvent: Extracted event data:", eventData);

      return {
        data: eventData,  // Return the extracted event data directly
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get event questions
  static async getEventQuestions(
    eventId: number
  ): Promise<ApiResponse<EventQuestion[]>> {
    try {
      const response = await apiClient.get(`/events/${eventId}/questions/`);
      return {
        data: response.data.data || [],
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Update event questions
  static async updateEventQuestions(
    eventId: number,
    questions: Partial<EventQuestion>[],
    requireRegistrationForm?: boolean
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post(`/events/${eventId}/questions/`, {
        questions,
        require_registration_form: requireRegistrationForm,
      });
      return {
        data: response.data,
        status: response.status,
        message: "Questions updated successfully",
      };
    } catch (error) {
      console.error("EventsService.getEvent: Error:", error);
      throw this.handleEventError(error as ApiError);
    }
  }

  // Create event (Admin only)
  static async createEvent(data: CreateEventData): Promise<ApiResponse<Event>> {
    try {
      const hasImage = data.event_image instanceof File;
      const hasQuestions = data.questions && data.questions.length > 0;

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "event_image" && value instanceof File) {
            formData.append(key, value);
          }
          else if (key === "questions" && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          }
          else if (key === "require_registration_form") {
            formData.append(key, String(hasQuestions || value === true));
          }
          else {
            formData.append(key, String(value));
          }
        }
      });

      // Submit form data

      const response = await apiClient.post("/events/create/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        data: response.data,
        status: response.status,
        message: "Event created successfully",
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Update event (Admin only)
  static async updateEvent(
    id: number,
    data: Partial<CreateEventData>
  ): Promise<ApiResponse<Event>> {
    try {
      const hasImage = data.event_image instanceof File;
      const hasQuestions = data.questions && data.questions.length > 0;

      let requestData: FormData | Record<string, unknown>;
      const headers: Record<string, string> = {};

      if (hasImage) {
        // Use FormData when there's an image
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === "event_image" && value instanceof File) {
              formData.append(key, value);
            }
            else if (key === "questions" && Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            }
            else if (key === "require_registration_form") {
              formData.append(key, String(hasQuestions || value === true));
            }
            else {
              formData.append(key, String(value));
            }
          }
        });

        requestData = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        // Use JSON when there's no image
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { event_image: _eventImage, ...jsonData } = data;
        requestData = jsonData;
        headers['Content-Type'] = 'application/json';
      }

      const response = await apiClient.patch(
        `/events/${id}/update/`,
        requestData,
        {
          headers,
        }
      );

      return {
        data: response.data,
        status: response.status,
        message: "Event updated successfully",
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Delete event (Admin only)
  static async deleteEvent(
    id: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await apiClient.delete(`/events/${id}/delete/`);
      return {
        data: { message: "Event deleted successfully" },
        status: 204,
        message: "Event deleted successfully",
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Register for event
  static async registerForEvent(
    eventId: number,
    answers?: any[]
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const payload: any = {};
      if (answers && answers.length > 0) {
        payload.answers = answers;
      }

      const response = await apiClient.post(`/events/${eventId}/register/`, payload);
      return {
        data: response.data,
        status: response.status,
        message: "Registration successful",
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Check registration status for an event
  static async getRegistrationStatus(
    eventId: number
  ): Promise<ApiResponse<RegistrationStatus>> {
    try {
      const response = await apiClient.get(
        `/events/${eventId}/registration-status/`
      );
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get user's registered events
  static async getUserRegistrations(): Promise<
    ApiResponse<PaginatedResponse<EventRegistration>>
  > {
    try {
      const response = await apiClient.get("/user/registrations/");
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get event participants (Admin only)
  static async getEventParticipants(
    eventId: number,
    filters: { status?: string; attendance?: boolean } = {}
  ): Promise<ApiResponse<PaginatedResponse<EventRegistration>>> {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key, value]) => [key, String(value)])
        )
      );

      const response = await apiClient.get(
        `/events/${eventId}/participants/?${params}`
      );
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Admin unregister user from event (Admin only)
  static async adminUnregisterUser(
    eventId: number,
    userId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete(
        `/events/${eventId}/admin-unregister/`,
        {
          data: { user_id: userId },
        }
      );
      return {
        data: response.data,
        status: response.status,
        message: "User successfully unregistered from event",
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Internal booking (Admin only)
  static async internalBooking(
    eventId: number,
    userData: any
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post(
        `/events/${eventId}/internal-book/`,
        userData
      );
      return {
        data: response.data,
        status: response.status,
        message: "User successfully added to event",
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Download event analysis (Admin only)
  static async downloadEventAnalysis(eventId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/events/${eventId}/analysis/download/`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get event OD list data (Staff only)
  static async getEventODList(eventId: number): Promise<ApiResponse<ODListResponse>> {
    try {
      const response = await apiClient.get(`/events/${eventId}/od-list/`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Download event OD list (Staff only)
  static async downloadEventODList(eventId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/events/${eventId}/od-list/download/`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Mark attendance with QR code (Admin only)
  static async markAttendance(
    eventId: number,
    hash: string
  ): Promise<ApiResponse<{ message: string; participant_id: number }>> {
    try {
      const response = await apiClient.put(
        `/events/${eventId}/mark-attendance/`,
        { hash }
      );
      return {
        data: response.data,
        status: response.status,
        message: response.data.message,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // ========== EVENT GUIDE METHODS ==========

  // Get event guide (Public)
  static async getEventGuide(eventId: number): Promise<ApiResponse<EventGuide>> {
    try {
      console.log("EventsService.getEventGuide: Fetching guide for event ID:", eventId);
      const response = await apiClient.get(`/events/${eventId}/eventdesc/`);
      console.log("EventsService.getEventGuide: Response:", response.data);
      
      // Handle wrapped response format
      const guideData = response.data.success ? response.data.data : response.data;
      
      return {
        data: guideData,
        status: response.status
      };
    } catch (error) {
      console.error("EventsService.getEventGuide: Error:", error);
      throw this.handleEventError(error as ApiError);
    }
  }

  // Create event guide (Admin only)
  static async createEventGuide(eventId: number, data: CreateEventGuideData): Promise<ApiResponse<EventGuide>> {
    try {
      const response = await apiClient.post(`/events/${eventId}/eventdesc/admin/`, data);
      
      // Handle wrapped response format
      const guideData = response.data.success ? response.data.data : response.data;
      
      return {
        data: guideData,
        status: response.status,
        message: 'Event guide created successfully'
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Update event guide (Admin only)
  static async updateEventGuide(eventId: number, data: Partial<CreateEventGuideData>): Promise<ApiResponse<EventGuide>> {
    try {
      const response = await apiClient.patch(`/events/${eventId}/eventdesc/admin/`, data);
      
      // Handle wrapped response format
      const guideData = response.data.success ? response.data.data : response.data;
      
      return {
        data: guideData,
        status: response.status,
        message: 'Event guide updated successfully'
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Delete event guide (Admin only)
  static async deleteEventGuide(eventId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete(`/events/${eventId}/eventdesc/admin/`);
      return {
        data: response.data,
        status: response.status,
        message: 'Event guide deleted successfully'
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get available users for internal booking (Admin only)
  static async getAvailableUsersForBooking(eventId: number): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get(`/events/${eventId}/available-users/`)
    return { data: response.data, status: response.status }
  }

  // ========== FORM RESPONSE METHODS ==========

  // Get all form responses for an event (Admin only)
  static async getEventFormResponses(eventId: number): Promise<ApiResponse<FormResponse[]>> {
    try {
      const response = await apiClient.get(`/events/${eventId}/form-responses/`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Get single participant's form response (Admin only)
  static async getParticipantFormResponse(eventId: number, participantId: number): Promise<ApiResponse<FormResponse>> {
    try {
      const response = await apiClient.get(`/events/${eventId}/participants/${participantId}/form-response/`);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw this.handleEventError(error as ApiError);
    }
  }

  // Error handler for event-related errors
  private static handleEventError(error: ApiError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      let detailsMsg = "";
      if (data && typeof data === "object" && data.details) {
        detailsMsg = Object.entries(data.details)
          .map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
          )
          .join("\n");
      }
      // Helper to ensure only strings are passed to Error
      const safeString = (val: unknown): string => {
        if (typeof val === "string") return val;
        if (Array.isArray(val)) return val.join(", ");
        if (val && typeof val === "object") return JSON.stringify(val);
        return "";
      };
      switch (status) {
        case 400:
          // Try to extract more specific error information
          let errorMessage = '';
          if (detailsMsg) {
            errorMessage = safeString(detailsMsg);
          } else if (data && typeof data === 'object') {
            // Try to extract field-specific errors
            const fieldErrors = Object.entries(data)
              .filter(([key, value]) => key !== 'success' && (Array.isArray(value) || typeof value === 'string'))
              .map(([field, msgs]) => {
                const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                return `${field}: ${msgStr}`;
              })
              .join('\n');

            if (fieldErrors) {
              errorMessage = fieldErrors;
            } else {
              // Handle nested error structures like {"success":false,"errors":{"field":["message"]}}
              const nestedErrors = (data as any).errors;
              if (nestedErrors && typeof nestedErrors === 'object') {
                const nestedFieldErrors = Object.entries(nestedErrors)
                  .map(([field, msgs]) => {
                    const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                    return `${field}: ${msgStr}`;
                  })
                  .join('\n');
                errorMessage = nestedFieldErrors || `Validation failed: ${JSON.stringify(data)}`;
              } else {
                errorMessage = safeString((data as any).message) || safeString((data as any).error) || `Validation failed: ${JSON.stringify(data)}`;
              }
            }
          } else {
            errorMessage = safeString((data as any).message) || safeString((data as any).error) || 'Invalid event data';
          }
          
          return new Error(errorMessage);
        case 401:
          return new Error("Authentication required");
        case 403:
          return new Error("You do not have permission to perform this action");
        case 404:
          return new Error("Event not found");
        case 409:
          return new Error("Event registration conflict");
        case 429:
          return new Error("Too many requests. Please try again later.");
        case 500:
          return new Error("Server error. Please try again later.");
        default:
          return new Error(
            safeString(detailsMsg) ||
              safeString(data.message) ||
              safeString(data.error) ||
              "An unexpected error occurred"
          );
      }
    } else if (error.request) {
      return new Error("Network error. Please check your connection.");
    } else {
      return new Error("An unexpected error occurred");
    }
  }
}
