import { apiClient } from './config';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  is_eventStaff: boolean;
  is_superuser: boolean;
  is_qr_scanner: boolean;
  is_verified: boolean;
}

export interface UpdateUserRoleData {
  userId: number;
  role: 'is_qr_scanner';
  value: boolean;
}

// Users service class
export class UsersService {
  static async getUsers(): Promise<{ data: User[]; status: number }> {
    try {
      const response = await apiClient.get('/users/list/');
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateUserRole(data: UpdateUserRoleData): Promise<{ data: { message: string; user_id: number; role: string; value: boolean }; status: number }> {
    try {
      const response = await apiClient.patch(`/users/${data.userId}/role/`, {
        role: data.role,
        value: data.value
      });
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw error;
    }
  }
}