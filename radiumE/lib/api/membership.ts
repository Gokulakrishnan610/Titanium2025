import { apiClient } from './config';

// Types for membership system
export interface DevsMembership {
  id: number;
  user_username: string;
  membership_type: 'basic' | 'premium';
  membership_type_display: string;
  status: 'active' | 'expired' | 'suspended';
  status_display: string;
  claimed_at: string;
  expires_at: string | null;
  premium_upgraded_at: string | null;
  is_active: boolean;
  is_premium: boolean;
}

export interface PremiumMembershipSlot {
  id: number;
  name: string;
  description: string;
  total_slots: number;
  allocated_slots: number;
  available_slots: number;
  is_open: boolean;
  is_full: boolean;
  is_currently_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PremiumMembershipApplication {
  id: number;
  user_username: string;
  slot: number;
  slot_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlist';
  status_display: string;
  application_reason: string;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by_username: string | null;
  review_notes: string;
}

export interface MembershipStatus {
  has_devs_membership: boolean;
  devs_membership: DevsMembership | null;
  can_claim_devs: boolean;
  devs_eligibility_message: string;
  premium_applications: PremiumMembershipApplication[];
  available_premium_slots: PremiumMembershipSlot[];
  membership_benefits: {
    basic_devs: string[];
    premium_devs: string[];
  };
}

export interface MembershipBenefits {
  basic_devs: {
    title: string;
    description: string;
    benefits: string[];
    eligibility: string;
    cost: string;
  };
  premium_devs: {
    title: string;
    description: string;
    benefits: string[];
    eligibility: string;
    cost: string;
  };
}

export interface PremiumSlotsResponse {
  open_slots: PremiumMembershipSlot[];
  all_slots: PremiumMembershipSlot[];
}

// Membership API service
export const MembershipService = {
  // Get current membership status
  getMembershipStatus: () => 
    apiClient.get<MembershipStatus>('/users/membership/status/'),

  // Claim DEVS membership
  claimDevMembership: () => 
    apiClient.post<{ message: string; membership: DevsMembership }>('/users/membership/claim-dev/', {}),

  // Get membership benefits information
  getMembershipBenefits: () => 
    apiClient.get<MembershipBenefits>('/users/membership/benefits/'),

  // Get available premium slots
  getPremiumSlots: () => 
    apiClient.get<PremiumSlotsResponse>('/users/membership/premium-slots/'),

  // Apply for premium membership (would need to be added to backend)
  applyForPremiumSlot: (slotId: number, applicationReason: string) =>
    apiClient.post<{ message: string; application: PremiumMembershipApplication }>('/users/membership/apply-premium/', {
      slot: slotId,
      application_reason: applicationReason,
    }),
};