import { useMutation, useQuery } from '@tanstack/react-query';
import { PaymentService, PaymentInitiateRequest } from '../api/payment';

export function usePaymentInitiate() {
  return useMutation({
    mutationFn: (data: PaymentInitiateRequest) => PaymentService.initiatePayment(data),
  });
}

export function usePaymentStatus(order_id?: string) {
  return useQuery({
    queryKey: ['payment-status', order_id],
    queryFn: () => order_id ? PaymentService.getPaymentStatus(order_id) : Promise.resolve(undefined),
    enabled: !!order_id,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });
}

export function useUserPayments() {
  return useQuery({
    queryKey: ['user-payments'],
    queryFn: () => PaymentService.listUserPayments(),
    staleTime: 60 * 1000,
  });
}
