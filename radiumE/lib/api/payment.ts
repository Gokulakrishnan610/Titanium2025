import { apiClient } from './config';

export interface PaymentInitiateRequest {
  participant_id?: string;
  event_id?: string;
  return_url?: string;
}

export interface PaymentInitiateResponse {
  success: boolean;
  payment: {
    order_id: string;
    status: string;
    [key: string]: unknown;
  };
  gateway: 'cashfree' | 'payu';
  payment_data: {
    gateway: 'cashfree' | 'payu';
    order_id: string;
    payment_url: string;
    environment: string;
    // Cashfree specific fields
    cf_order_id?: string;
    payment_session_id?: string;
    payment_token?: string;
    order_amount?: string;
    order_currency?: string;
    // PayU specific fields
    form_data?: Record<string, string>;
  };
  // Keep backward compatibility for Cashfree
  cashfree_data?: {
    order_id: string;
    payment_session_id: string;
    payment_token: string;
    order_amount: string;
    order_currency: string;
    environment: string;
    payment_url: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    payment: {
      id: number;
      order_id: string;
      status: string;
      [key: string]: unknown;
    };
  };
  error?: string;
}

export class PaymentService {
  static async initiatePayment(data: PaymentInitiateRequest) {
    return apiClient.post<PaymentInitiateResponse>('/payment/initiate/', data);
  }

  static async getPaymentStatus(order_id: string) {
    return apiClient.get<PaymentStatusResponse>(`/payment/status/${order_id}/`);
  }

  static async listUserPayments() {
    return apiClient.get('/payment/list/');
  }
}
