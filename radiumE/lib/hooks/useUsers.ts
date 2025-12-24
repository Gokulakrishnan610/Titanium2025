import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersService, User, UpdateUserRoleData } from '../api/users';
import { queryKeys } from '../query/client';

// Hook for getting all users
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async () => {
      const response = await UsersService.getUsers();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for updating user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserRoleData) => {
      const response = await UsersService.updateUserRole(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
};