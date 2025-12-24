import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  EventsService, 
  EventListItem,
  EventFilters, 
  CreateEventData,
  CreateEventGuideData
} from '../api/events';
import { PaginatedResponse } from '../api/config';
import { queryKeys, cacheUtils } from '../query/client';

// Hook for getting events with pagination
export const useEvents = (filters: EventFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.events.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const response = await EventsService.getEvents(filters);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for event lists
  });
};

// Hook for getting upcoming events
export const useUpcomingEvents = (filters: Omit<EventFilters, 'is_upcoming'> = {}) => {
  return useQuery({
    queryKey: [...queryKeys.events.all, 'upcoming', filters] as const,
    queryFn: async () => {
      const response = await EventsService.getUpcomingEvents(filters);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for infinite scrolling events
export const useInfiniteEvents = (filters: EventFilters = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.events.list({ ...filters, infinite: true }),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const response = await EventsService.getEvents({ ...filters, page: pageParam });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<EventListItem>) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        const page = url.searchParams.get('page');
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for getting single event
export const useEvent = (id: number, enabled = true) => {
  const result = useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: async () => {
      console.log("useEvent: Fetching event with ID:", id, "enabled:", enabled);
      try {
        const response = await EventsService.getEvent(id);
        console.log("useEvent: API response:", response);
        return response.data;
      } catch (error) {
        console.error("useEvent: API error:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for event details
    enabled: enabled && !!id,
  });
  
  console.log("useEvent: Query result:", { data: result.data, isLoading: result.isLoading, error: result.error, enabled: enabled && !!id });
  
  return result;
};

// Hook for getting event questions
export const useEventQuestions = (eventId: number, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.events.detail(eventId), 'questions'],
    queryFn: async () => {
      const response = await EventsService.getEventQuestions(eventId);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!eventId,
  });
};

// Hook for updating event questions
export const useUpdateEventQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, questions, requireRegistrationForm }: { eventId: number; questions: any[]; requireRegistrationForm?: boolean }) =>
      EventsService.updateEventQuestions(eventId, questions, requireRegistrationForm),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.events.detail(variables.eventId), 'questions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.eventId) });
    },
  });
};

// Hook for creating new event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventData) => EventsService.createEvent(data),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.events.detail(response.data.id), response.data);
      cacheUtils.invalidateEvents();
    },
  });
};

// Hook for updating event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEventData> }) => 
      EventsService.updateEvent(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(queryKeys.events.detail(variables.id), response.data);
      cacheUtils.invalidateEvents();
    },
  });
};

// Hook for deleting event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => EventsService.deleteEvent(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(id) });
      cacheUtils.invalidateEvents();
    },
  });
};

// Hook for registering for event
export const useRegisterForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, answers }: { eventId: number; answers?: any[] }) =>
      EventsService.registerForEvent(eventId, answers),
    onSettled: (_, __, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registrations });
    },
  });
};

// Hook for getting registration status
export const useRegistrationStatus = (eventId: number, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.events.detail(eventId), 'registration-status'] as const,
    queryFn: async () => {
      const response = await EventsService.getRegistrationStatus(eventId);
      return response.data;
    },
    enabled: enabled && !!eventId,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for getting user's registrations
export const useUserRegistrations = () => {
  return useQuery({
    queryKey: queryKeys.events.registrations,
    queryFn: async () => {
      const response = await EventsService.getUserRegistrations();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for getting event participants (Admin only)
export const useEventParticipants = (eventId: number, filters: { status?: string; attendance?: boolean } = {}, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.events.detail(eventId), 'participants', filters] as const,
    queryFn: async () => {
      const response = await EventsService.getEventParticipants(eventId, filters);
      return response.data;
    },
    enabled: enabled && !!eventId,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for admin unregistering user (Admin only)
export const useAdminUnregisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: number; userId: number }) => 
      EventsService.adminUnregisterUser(eventId, userId),
    onSettled: (_, __, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.events.detail(eventId), 'participants'] });
    },
  });
};

// Hook for internal booking (Admin only)
export const useInternalBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userData }: { eventId: number; userData: any }) =>
      EventsService.internalBooking(eventId, userData),
    onSettled: (_, __, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.events.detail(eventId), 'participants'] });
    },
  });
};

// Hook for downloading event analysis (Admin only)
export const useDownloadEventAnalysis = () => {
  return useMutation({
    mutationFn: (eventId: number) => EventsService.downloadEventAnalysis(eventId),
  });
};

// Hook for getting event OD list data (Staff only)
export const useEventODList = (eventId: number) => {
  return useQuery({
    queryKey: [...queryKeys.events.all, 'od-list', eventId] as const,
    queryFn: async () => {
      const response = await EventsService.getEventODList(eventId);
      return response.data.od_list;
    },
    enabled: !!eventId,
    staleTime: 1 * 60 * 1000, // 1 minute for OD list data
  });
};

// Hook for downloading event OD list (Staff only)
export const useDownloadEventODList = () => {
  return useMutation({
    mutationFn: (eventId: number) => EventsService.downloadEventODList(eventId),
  });
};

// Hook for marking attendance with QR code (Admin only)
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, hash }: { eventId: number; hash: string }) =>
      EventsService.markAttendance(eventId, hash),
    onSettled: (_, __, { eventId }) => {
      // Invalidate event participants and details to refresh attendance data
      queryClient.invalidateQueries({ queryKey: [...queryKeys.events.detail(eventId), 'participants'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    },
  });
};

// Hook for prefetching event details (useful for hover effects)
export const usePrefetchEvent = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.events.detail(id),
      queryFn: async () => {
        const response = await EventsService.getEvent(id);
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

// ========== EVENT GUIDE HOOKS ==========

// Hook for getting event guide
export const useEventGuide = (eventId: number, enabled = true) => {
  const result = useQuery({
    queryKey: ['events', 'guide', eventId],
    queryFn: async () => {
      console.log("useEventGuide: Fetching guide for event ID:", eventId);
      try {
        const response = await EventsService.getEventGuide(eventId);
        console.log("useEventGuide: API response:", response);
        return response.data;
      } catch (error) {
        console.error("useEventGuide: API error:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!eventId,
  });
  
  console.log("useEventGuide: Query result:", { data: result.data, isLoading: result.isLoading, error: result.error });
  
  return result;
};

// Hook for creating event guide
export const useCreateEventGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: CreateEventGuideData }) => 
      EventsService.createEventGuide(eventId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['events', 'guide', variables.eventId], response.data);
      queryClient.invalidateQueries({ queryKey: ['events', 'guide'] });
    },
  });
};

// Hook for updating event guide
export const useUpdateEventGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: Partial<CreateEventGuideData> }) => 
      EventsService.updateEventGuide(eventId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['events', 'guide', variables.eventId], response.data);
      queryClient.invalidateQueries({ queryKey: ['events', 'guide'] });
    },
  });
};

// Hook for deleting event guide
export const useDeleteEventGuide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: number) => EventsService.deleteEventGuide(eventId),
    onSuccess: (_, eventId) => {
      queryClient.removeQueries({ queryKey: ['events', 'guide', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events', 'guide'] });
    },
  });
};

// ========== FORM RESPONSE HOOKS ==========

// Hook for getting all form responses for an event (Admin only)
export const useEventFormResponses = (eventId: number, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.events.detail(eventId), 'form-responses'] as const,
    queryFn: async () => {
      const response = await EventsService.getEventFormResponses(eventId);
      return response.data;
    },
    enabled: enabled && !!eventId,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for getting single participant's form response (Admin only)
export const useParticipantFormResponse = (eventId: number, participantId: number, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.events.detail(eventId), 'participants', participantId, 'form-response'] as const,
    queryFn: async () => {
      const response = await EventsService.getParticipantFormResponse(eventId, participantId);
      return response.data;
    },
    enabled: enabled && !!eventId && !!participantId,
    staleTime: 5 * 60 * 1000,
  });
};