const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface Club {
  id: number;
  name: string;
  slug: string;
  description: string;
  club_type: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  banner?: string;
  primary_color: string;
  secondary_color: string;
  status: string;
  is_default: boolean;
  allow_public_events: boolean;
  require_approval: boolean;
  payment_gateway: string;
  total_events: number;
  total_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubMembership {
  id: number;
  club: number;
  club_name: string;
  user: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  role: string;
  status: string;
  can_create_events: boolean;
  can_manage_members: boolean;
  can_manage_payments: boolean;
  can_view_analytics: boolean;
  joined_at: string;
}

export interface CreateClubData {
  name: string;
  slug: string;
  description: string;
  club_type: string;
  email: string;
  phone?: string;
  website?: string;
  primary_color: string;
  secondary_color: string;
  payment_gateway: string;
}

export interface AdminAccess {
  has_access: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  club_admin_count: number;
}

class ClubsAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async checkAdminAccess(): Promise<AdminAccess> {
    const response = await fetch(`${API_BASE_URL}/clubs/check_admin_access/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check admin access');
    }

    return response.json();
  }

  async getClubs(params?: { status?: string; type?: string; search?: string }): Promise<Club[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/clubs/?${searchParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch clubs');
    }

    return response.json();
  }

  async getClub(slug: string): Promise<Club> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch club');
    }

    return response.json();
  }

  async createClub(data: CreateClubData): Promise<Club> {
    const response = await fetch(`${API_BASE_URL}/clubs/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create club');
    }

    return response.json();
  }

  async updateClub(slug: string, data: Partial<CreateClubData>): Promise<Club> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update club');
    }

    return response.json();
  }

  async deleteClub(slug: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete club');
    }
  }

  async getMyClubs(): Promise<ClubMembership[]> {
    const response = await fetch(`${API_BASE_URL}/clubs/my_clubs/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch my clubs');
    }

    return response.json();
  }

  async joinClub(slug: string): Promise<ClubMembership> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/join/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to join club');
    }

    return response.json();
  }

  async leaveClub(slug: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/leave/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to leave club');
    }
  }

  async getClubEvents(slug: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/events/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch club events');
    }

    return response.json();
  }

  async getClubMembers(slug: string): Promise<ClubMembership[]> {
    const response = await fetch(`${API_BASE_URL}/clubs/${slug}/members/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch club members');
    }

    return response.json();
  }
}

export const clubsAPI = new ClubsAPI();