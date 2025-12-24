'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

// Create a client with optimized default settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const apiError = error as { response?: { status: number } };
        if (apiError?.response?.status && apiError.response.status >= 400 && apiError.response.status < 500) {
          if (apiError.response.status === 408 || apiError.response.status === 429) {
            return failureCount < 2;
          }
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const networkError = error as { code?: string };
        if (networkError?.code === 'NETWORK_ERROR') {
          return failureCount < 1;
        }
        return false;
      },
    },
  },
});

// Provider component props
interface QueryProviderProps {
  children: ReactNode;
}

// Query provider component
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}

// Query keys for consistent caching
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    profile: ['auth', 'profile'] as const,
    profileCompletion: ['auth', 'profile', 'completion'] as const,
  },
  
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.events.details(), id] as const,
    categories: ['events', 'categories'] as const,
    featured: ['events', 'featured'] as const,
    search: (query: string) => ['events', 'search', query] as const,
    registrations: ['events', 'registrations'] as const,
  },
  
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  invalidateEvents: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  },
  
  invalidateEvent: (id: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
  },
  
  invalidateUser: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
  },
  
  clearCache: () => {
    queryClient.clear();
  },
  
  prefetchEvent: (id: number) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.events.detail(id),
      queryFn: async () => {
        const { EventsService } = await import('../api/events');
        const response = await EventsService.getEvent(id);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  setEventData: (id: number, data: unknown) => {
    queryClient.setQueryData(queryKeys.events.detail(id), data);
  },
  
  getEventData: (id: number) => {
    return queryClient.getQueryData(queryKeys.events.detail(id));
  },
  
  optimisticEventUpdate: (eventId: number, updateFn: (oldData: unknown) => unknown) => {
    queryClient.setQueryData(queryKeys.events.detail(eventId), updateFn);
  },
};

export class QueryErrorBoundary extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'QueryErrorBoundary';
  }
}

export const handleQueryError = (error: unknown): QueryErrorBoundary => {
  if (error instanceof Error) {
    return new QueryErrorBoundary(error.message, error);
  }
  return new QueryErrorBoundary('An unexpected error occurred');
};