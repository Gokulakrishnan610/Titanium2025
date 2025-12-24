'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePaymentStatus } from '../../../lib/hooks/usePayment';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled' | 'pending' | 'abandoned'>('loading');
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Extract order and Cashfree params
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('referenceId');

  const paymentStatus = usePaymentStatus(orderId || undefined);

  // Manual refresh function
  const refreshStatus = () => {
    paymentStatus.refetch();
  };

  // Timeout: if payment is still loading after 10 seconds, show pending
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => setTimeoutReached(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    // If no order ID, show abandoned
    if (!orderId) {
      console.log('[PAYMENT_SUCCESS] No order ID found, showing abandoned');
      setStatus('abandoned');
      return;
    }

    console.log('[PAYMENT_SUCCESS] Order ID:', orderId);
    console.log('[PAYMENT_SUCCESS] Full paymentStatus object:', paymentStatus);
    console.log('[PAYMENT_SUCCESS] Payment status data:', paymentStatus.data);
    if (paymentStatus.data) {
      console.log('[PAYMENT_SUCCESS] Response status:', paymentStatus.data.status);
      console.log('[PAYMENT_SUCCESS] Response data keys:', Object.keys(paymentStatus.data.data || {}));
      console.log('[PAYMENT_SUCCESS] Response data.data keys:', paymentStatus.data.data?.data ? Object.keys(paymentStatus.data.data.data) : 'no data.data');
    }
    console.log('[PAYMENT_SUCCESS] Payment status loading:', paymentStatus.isLoading);
    console.log('[PAYMENT_SUCCESS] Payment status error:', paymentStatus.error);

    // If we have backend payment data, use it
    if (paymentStatus.data) {
      // Try different possible paths for the payment data
      let paymentData = null;
      let paymentStatusValue = null;

      const responseData = paymentStatus.data.data;

      // Try the expected path first: response.data.data.data.payment
      if (responseData?.data?.payment) {
        paymentData = responseData.data.payment;
        paymentStatusValue = paymentData.status?.toLowerCase();
      }
      // Try alternative path: response.data.data.payment
      // @ts-expect-error - Checking alternative response structure
      else if (responseData?.payment) {
        // @ts-expect-error - Accessing alternative response structure
        paymentData = responseData.payment;
        paymentStatusValue = paymentData.status?.toLowerCase();
      }

      console.log('[PAYMENT_SUCCESS] Backend payment status:', paymentStatusValue);
      console.log('[PAYMENT_SUCCESS] Payment data found at path:', paymentData ? 'found' : 'not found');
      console.log('[PAYMENT_SUCCESS] Full response data:', responseData);

      if (paymentStatusValue === 'success') {
        setStatus('success');
      } else if (paymentStatusValue === 'failed') {
        setStatus('failed');
      } else if (paymentStatusValue === 'cancelled') {
        setStatus('cancelled');
      } else if (paymentStatusValue === 'pending') {
        // If still pending after 10 seconds, show pending status
        if (timeoutReached) {
          setStatus('pending');
        }
        // Otherwise keep loading while polling
      } else {
        // Unknown status, keep loading
        if (timeoutReached) {
          setStatus('pending');
        }
      }
    } else if (timeoutReached) {
      // If no backend data after timeout, show pending
      console.log('[PAYMENT_SUCCESS] Timeout reached with no backend data');
      setStatus('pending');
    }
    // If paymentStatus is loading and not timed out, stay in loading state
  }, [paymentStatus, timeoutReached, orderId]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Verifying payment...</div>;
  }
  if (status === 'abandoned') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600">Payment Not Completed</h1>
          <p>You did not complete the payment or closed the payment window early.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Back to Home</button>
        </div>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-600">Payment Pending</h1>
          <p>Your payment is still pending or was not completed.<br/>If you closed the payment window or cancelled, no money was deducted.</p>
          <button onClick={refreshStatus} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded mr-2">Check Status Again</button>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Back to Home</button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
            <p>Your payment has been processed successfully and you are registered for the event.</p>
            <button onClick={() => router.push('/my-events')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">View My Events</button>
          </div>
        )}
        {status === 'failed' && (
          <div>
            <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
            <p>There was an issue processing your payment.</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Try Again</button>
          </div>
        )}
        {status === 'cancelled' && (
          <div>
            <h1 className="text-2xl font-bold text-yellow-600">Payment Cancelled</h1>
            <p>You cancelled the payment process.</p>
            <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}