import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// Environment configuration
// Use localhost to match Django CORS settings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 10000; // 10 seconds

// Log API configuration on client side only
if (typeof window !== 'undefined') {
  console.log('API Configuration:', {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
  });
}

const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false, // Changed to false - Django dj-rest-auth doesn't need credentials for registration
  });

  // Request interceptor for adding authentication token
  instance.interceptors.request.use(
    (config) => {
      const token = Cookies.get('access_token') || localStorage.getItem('access_token');
      
      // Debug log for authentication
      if (config.url && (config.url.includes('/profile') || config.url.includes('/events'))) {
        console.log('API Request:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenPrefix: token ? token.substring(0, 10) + '...' : 'none'
        });
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // CSRF token is only needed for session-based auth
      // JWT auth doesn't require CSRF tokens
      // But include it if available for compatibility
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const csrfToken = Cookies.get('csrftoken');
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken;
        }
      }

      // Don't add custom headers that aren't in Django's CORS_ALLOW_HEADERS
      // Removed: X-Request-Timestamp

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling token refresh and errors
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = Cookies.get('refresh_token') || localStorage.getItem('refresh_token');
          
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh_token: refreshToken,
            });

            const { access_token, refresh_token: newRefreshToken } = response.data;
            
            if (typeof window !== 'undefined') {
              Cookies.set('access_token', access_token, { 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: 1 // 1 day
              });
              if (newRefreshToken) {
                Cookies.set('refresh_token', newRefreshToken, {
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                  expires: 7 // 7 days
                });
              }
            }

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return instance(originalRequest);
          }
        } catch {
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }

      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter && parseInt(retryAfter) < 60) {
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
          return instance(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Helper function to clear authentication tokens
export const clearAuthTokens = (): void => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// Helper function to set authentication tokens securely
export const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Prefer httpOnly cookies for security
  Cookies.set('access_token', accessToken, {
    secure: isProduction,
    sameSite: 'strict',
    expires: 1 // 1 day
  });
  
  Cookies.set('refresh_token', refreshToken, {
    secure: isProduction,
    sameSite: 'strict',
    expires: 7 // 7 days
  });

  // Fallback to localStorage for older browsers
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

// Create and export the configured API instance
export const apiClient = createApiInstance();

// Export types for better TypeScript support
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}