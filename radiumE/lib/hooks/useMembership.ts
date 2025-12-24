import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MembershipService, MembershipStatus, MembershipBenefits, PremiumSlotsResponse } from '../api/membership';

// Query keys for membership
const membershipKeys = {
  all: ['membership'] as const,
  status: () => [...membershipKeys.all, 'status'] as const,
  benefits: () => [...membershipKeys.all, 'benefits'] as const,
  premiumSlots: () => [...membershipKeys.all, 'premium-slots'] as const,
};

// Hook for getting membership status
export const useMembershipStatus = (enabled = true) => {
  return useQuery({
    queryKey: membershipKeys.status(),
    queryFn: async () => {
      const response = await MembershipService.getMembershipStatus();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });
};

// Hook for claiming DEVS membership
export const useClaimDevMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => MembershipService.claimDevMembership(),
    onSuccess: (response) => {
      // Update the membership status cache
      queryClient.setQueryData(membershipKeys.status(), (oldData: MembershipStatus | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          has_devs_membership: true,
          devs_membership: response.data.membership,
          can_claim_devs: false,
          devs_eligibility_message: 'Already has DEVS membership',
        };
      });
      
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: membershipKeys.status() });
    },
  });
};

// Hook for getting membership benefits
export const useMembershipBenefits = () => {
  return useQuery({
    queryKey: membershipKeys.benefits(),
    queryFn: async () => {
      const response = await MembershipService.getMembershipBenefits();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (benefits don't change often)
  });
};

// Hook for getting premium slots
export const usePremiumSlots = () => {
  return useQuery({
    queryKey: membershipKeys.premiumSlots(),
    queryFn: async () => {
      const response = await MembershipService.getPremiumSlots();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for applying to premium membership
export const useApplyForPremiumSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slotId, applicationReason }: { slotId: number; applicationReason: string }) =>
      MembershipService.applyForPremiumSlot(slotId, applicationReason),
    onSuccess: () => {
      // Invalidate membership status and premium slots to refresh data
      queryClient.invalidateQueries({ queryKey: membershipKeys.status() });
      queryClient.invalidateQueries({ queryKey: membershipKeys.premiumSlots() });
    },
  });
};