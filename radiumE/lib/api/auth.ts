import { apiClient, setAuthTokens, clearAuthTokens, ApiResponse } from './config';

// Error interface for API errors
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

// Authentication interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password1: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  gender?: string;
  degree?: string;
  year?: string;
  year_display?: string;
  department?: string;
  rollno?: string;
  phone_number?: string;
  college_name?: string;
  profile_picture?: string | null;
  is_profile_complete: boolean;
  date_of_birth?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  is_eventStaff: boolean;
  is_superuser: boolean;
  is_qr_scanner: boolean;
  // Legacy/localStorage field for backward compatibility
  isAdmin?: boolean;
}

export interface UserProfile {
  display_name?: string;
  gender?: string;
  degree?: string;
  department?: string;
  rollno?: string;
  phone_number?: string;
  college_name?: string;
  date_of_birth?: string;
  bio?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetPasswordData {
  uid: string;
  token: string;
  new_password1: string;
  new_password2: string;
}

// Authentication service class
export class AuthService {
  static async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post('/auth/login/', credentials);
      const { user, access_token, refresh_token, token_type, expires_at, message } = response.data;
      
      setAuthTokens(access_token, refresh_token);
      
      return {
        data: { 
          user, 
          tokens: { 
            access_token, 
            refresh_token, 
            token_type: token_type || 'Bearer', 
            expires_at 
          } 
        },
        status: response.status,
        message: message || 'Login successful'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Register new user
  static async register(data: RegisterData & Partial<UserProfile>): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      // 1. Register user
      const regResponse = await apiClient.post('/auth/register/', data);
      // Remove legacy key tokens before login to avoid confusion
      clearAuthTokens();

      // 2. Auto-login user (get real tokens)
      const loginResp = await apiClient.post('/auth/login/', {
        username: data.username,
        password: data.password1
      });
      const { user: loggedInUser, access_token, refresh_token, token_type, expires_at } = loginResp.data;
      setAuthTokens(access_token, refresh_token);

      // 3. Patch user profile with cached profile fields (now authenticated)
      const profileFields: Partial<UserProfile> = {};
      const profileKeys: (keyof UserProfile)[] = [
        'display_name', 'gender', 'degree', 'department', 'rollno', 'phone_number', 'college_name', 'date_of_birth', 'bio'
      ];
      for (const k of profileKeys) {
        if (data[k]) profileFields[k] = data[k];
      }
      let patchedUser = loggedInUser;
      if (Object.keys(profileFields).length > 0) {
        try {
          const patchResp = await apiClient.patch('/users/profile/', profileFields);
          patchedUser = patchResp.data;
        } catch (patchErr) {
          // NIGGA ASS ERROR IGNORE THIS
        }
      }

      return {
        data: {
          user: patchedUser,
          tokens: { access_token, refresh_token, token_type: token_type || 'Bearer', expires_at }
        },
        status: loginResp.status,
        message: 'Registration and login successful'
      };
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Registration error details:', {
        hasResponse: !!apiError.response,
        hasRequest: !!apiError.request,
        message: apiError.message,
        code: (error as { code?: string }).code,
        responseData: apiError.response?.data,
        responseStatus: apiError.response?.status,
      });
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/', {}, {
        timeout: 3000, // 3 second timeout for logout
      });
    } catch {
      // Silently ignore logout errors - tokens will be cleared anyway
      // This handles cases where:
      // - Server is down
      // - Network issues
      // - CORS problems
      // - Token already invalid
    } finally {
      // Always clear tokens regardless of server response
      clearAuthTokens();
    }
  }

  // Get current user profile
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get('/users/profile/');
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Get user profile (alias for getCurrentUser for clarity)
  static async getProfile(): Promise<ApiResponse<User>> {
    return this.getCurrentUser();
  }

  // Update user profile (PUT for full update)
  static async updateProfile(data: UserProfile): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put('/users/profile/', data);
      return {
        data: response.data,
        status: response.status,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Patch user profile (PATCH for partial update)
  static async patchProfile(data: Partial<UserProfile>): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.patch('/users/profile/', data);
      return {
        data: response.data,
        status: response.status,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Get profile completion status
  static async getProfileCompletion(): Promise<ApiResponse<{ is_complete: boolean; completion_percentage: number }>> {
    try {
      const response = await apiClient.get('/users/profile/completion/');
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Change password
  static async changePassword(data: { old_password: string; new_password1: string; new_password2: string }): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post('/auth/change-password/', data);
      return {
        data: response.data,
        status: response.status,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Request password reset
  static async requestPasswordReset(data: ResetPasswordData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post('/auth/reset-password/', data);
      return {
        data: response.data,
        status: response.status,
        message: 'Password reset email sent'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Confirm password reset
  static async confirmPasswordReset(data: ConfirmResetPasswordData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post('/auth/reset-password/confirm/', data);
      return {
        data: response.data,
        status: response.status,
        message: 'Password reset successful'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Verify email
  static async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post('/auth/verify-email/', { token });
      return {
        data: response.data,
        status: response.status,
        message: 'Email verified successfully'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Resend verification email
  static async resendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post('/auth/resend-verification/');
      return {
        data: response.data,
        status: response.status,
        message: 'Verification email sent'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Verify user with Google OAuth (updates is_verified field)
  static async verifyWithGoogle(googleToken: string): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post('/auth/google-verify/', {
        token: googleToken
      });
      return {
        data: response.data,
        status: response.status,
        message: 'User verified with Google'
      };
    } catch (error) {
      throw this.handleAuthError(error as ApiError);
    }
  }

  // Error handler for authentication errors
  private static handleAuthError(error: ApiError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          // Extract specific field errors if available
          if (data && typeof data === 'object') {
            const fieldErrors = Object.entries(data)
              .filter(([key]) => key !== 'message' && key !== 'detail')
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            
            if (fieldErrors) {
              return new Error(fieldErrors);
            }
          }
          return new Error((data.message as string) || (data.detail as string) || 'Invalid request data');
        case 401:
          clearAuthTokens();
          return new Error('Invalid credentials');
        case 403:
          return new Error('Access forbidden');
        case 404:
          return new Error('User not found');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error((data.message as string) || (data.detail as string) || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Request was sent but no response received
      // This could be CORS, network issue, or server not responding
      const errorCode = (error as { code?: string }).code;
      
      if (errorCode === 'ERR_NETWORK') {
        return new Error('Cannot connect to server. Please ensure the backend is running at http://localhost:8000');
      }
      
      return new Error('Network error. Please check your connection and ensure the backend server is running.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}