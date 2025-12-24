import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { 
  AuthService, 
  LoginCredentials, 
  RegisterData, 
  UserProfile,
  ResetPasswordData, 
  ConfirmResetPasswordData 
} from '../api/auth';
import { clearAuthTokens } from '../api/config';
import { queryKeys, cacheUtils } from '../query/client';

// Hook for getting current user
export const useUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async () => {
      // Check if user has a token
      if (typeof window !== 'undefined') {
        const token = Cookies.get('access_token') || localStorage.getItem('access_token');
        
        if (!token) {
          // No token, user is not logged in
          return null;
        }
      }
      
      // Fetch current user from API
      try {
        const response = await AuthService.getCurrentUser();
        return response.data;
      } catch {
        // If profile fetch fails, clear tokens and return null
        clearAuthTokens();
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth requests
  });
};

// Hook for getting user profile (specifically for profile data)
export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.auth.user, // Same key as useUser for consistency
    queryFn: async () => {
      // Check if user has a token
      if (typeof window !== 'undefined') {
        const token = Cookies.get('access_token') || localStorage.getItem('access_token');
        
        if (!token) {
          // No token, user is not logged in
          return null;
        }
      }
      
      // Fetch user profile from API
      try {
        const response = await AuthService.getProfile();
        return response.data;
      } catch {
        // If profile fetch fails, clear tokens and return null
        clearAuthTokens();
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth requests
  });
};

// Hook for login
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user, data.data.user);
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

// Hook for registration
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => AuthService.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user, data.data.user);
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

// Hook for logout
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear localStorage first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('radium_user');
        localStorage.removeItem('radium_auth_token');
      }
      
      // Try to call API logout - don't let errors propagate
      await AuthService.logout().catch(() => {
        // Completely ignore any logout errors
        // User will be logged out on frontend regardless
      });
      
      return; // Ensure mutation always succeeds
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.removeQueries({ queryKey: queryKeys.auth.user });
      cacheUtils.clearCache();
    },
    onSettled: () => {
      // Always clear cache on logout, even if there's an error
      cacheUtils.clearCache();
      // Redirect to home or login page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    },
  });
};

// Hook for updating user profile (full update)
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserProfile) => AuthService.updateProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.user, response.data);
      cacheUtils.invalidateUser();
    },
  });
};

// Hook for patching user profile (partial update)
export const usePatchProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => AuthService.patchProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.user, response.data);
      cacheUtils.invalidateUser();
    },
  });
};

// Hook for getting profile completion status
export const useProfileCompletion = () => {
  return useQuery({
    queryKey: queryKeys.auth.profileCompletion,
    queryFn: async () => {
      const response = await AuthService.getProfileCompletion();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for verifying with Google OAuth
export const useGoogleVerify = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (googleToken: string) => AuthService.verifyWithGoogle(googleToken),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.user, response.data);
      cacheUtils.invalidateUser();
    },
  });
};

// Hook for changing password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { old_password: string; new_password1: string; new_password2: string }) => 
      AuthService.changePassword(data),
  });
};

// Hook for requesting password reset
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordData) => AuthService.requestPasswordReset(data),
  });
};

// Hook for confirming password reset
export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: (data: ConfirmResetPasswordData) => AuthService.confirmPasswordReset(data),
  });
};

// Hook for verifying email
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => AuthService.verifyEmail(token),
    onSuccess: () => {
      cacheUtils.invalidateUser();
    },
  });
};

// Hook for resending verification email
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: () => AuthService.resendVerificationEmail(),
  });
};

// Custom hook to check if user is authenticated
export const useAuth = () => {
  const { data: user, isLoading, error } = useUser();
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
};

// Custom hook for protecting routes
export const useAuthGuard = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    shouldRedirect: !isLoading && !isAuthenticated,
    redirectTo,
  };
};