"use client";

// TypeScript: declare Cashfree on window at the top level
declare global {
  interface Window {
    Cashfree?: (opts: { mode: string }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => void;
    };
  }
}
import { useState, useEffect, useRef } from "react";
import { usePaymentInitiate } from "../lib/hooks/usePayment";
import {
  useRegisterForEvent,
  useRegistrationStatus,
} from "../lib/hooks/useEvents";
import { useProfile } from "../lib/hooks/useAuth";
import { Event } from "../lib/api/events";
import { Button } from "./ui/button";
import { Loader2, CheckCircle, X } from "lucide-react";

interface EventRegistrationProps {
  event: Event;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EventRegistration({
  event,
  onClose,
  onSuccess,
}: EventRegistrationProps) {
  const handleRegister = () => {
    setError("");
    registerMutation.mutate(
      {
        eventId: event.id,
        answers: [], // Empty answers for direct registration (no form)
      },
      {
        onSuccess: (data: unknown) => {
          setStep(isPaidEvent ? "payment" : "success");
          const participantData = data as { participant_id?: string };
          if (participantData?.participant_id) setParticipantId(participantData.participant_id);
          if (!isPaidEvent) onSuccess?.();
        },
        onError: () => {
          setError("Registration failed. Please try again.");
        },
      }
    );
  };
  const { data: user } = useProfile();
  const [step, setStep] = useState<
    "register" | "payment" | "success"
  >("register");
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const registerMutation = useRegisterForEvent();
  const registrationStatus = useRegistrationStatus(event.id);
  const paymentInitiate = usePaymentInitiate();

  const isPaidEvent = event.payment_type === "paid";

  // Set initial step based on registration status
  useEffect(() => {
    if (registrationStatus.data) {
      const { is_registered, payment_status } = registrationStatus.data;
      if (is_registered) {
        if (isPaidEvent && payment_status) {
          setStep("success");
        } else if (isPaidEvent && !payment_status) {
          setStep("payment");
          // Optionally initiate payment here if needed
        } else {
          setStep("success");
        }
      }
    }
  }, [registrationStatus.data, isPaidEvent]);

  // Payment initiation handler
  const handleInitiatePayment = async () => {
    console.log("=== PAYMENT INITIATION START ===");
    console.log("Event ID:", event.id);
    console.log("Is Paid Event:", isPaidEvent);
    console.log("Participant ID:", participantId);
    console.log("Current Step:", step);

    // Prevent multiple simultaneous payment initiations
    if (paymentInitiate.isPending) {
      console.log("Payment initiation already in progress, skipping");
      return;
    }

    setError(null);
    try {
      let payload;
      if (isPaidEvent) {
        payload = { 
          event_id: String(event.id),
          return_url: typeof window !== 'undefined' ? `${window.location.origin}/payment/success` : undefined
        };
        console.log("Using event_id payload for paid event:", payload);
      } else {
        if (!participantId) {
          console.error("No participant ID found for free event payment");
          setError("Participant ID not found. Please register first.");
          return;
        }
        payload = { 
          participant_id: participantId,
          return_url: typeof window !== 'undefined' ? `${window.location.origin}/payment/success` : undefined
        };
        console.log("Using participant_id payload for free event:", payload);
      }

      console.log("Final payment payload:", payload);
      console.log("Calling paymentInitiate.mutateAsync...");

      const res = await paymentInitiate.mutateAsync(payload);
      console.log("Payment API response received:", res);
      console.log("Response success:", res.data?.success);
      console.log("Response payment data:", res.data?.payment);
      console.log("Response cashfree data:", res.data?.cashfree_data);

      if (res.data.success && res.data.payment) {
        console.log("Payment initiation successful, setting order ID:", res.data.payment.order_id);
        setStep("payment");
        console.log("Step changed to 'payment'");
      } else {
        console.error("Payment initiation failed - no success or payment data");
        setError("Payment initiation failed");
      }
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error?: string } }; message?: string };
      console.error("=== PAYMENT INITIATION ERROR ===");
      console.error("Error object:", error);
      console.error("Error response:", error?.response);
      console.error("Error response data:", error?.response?.data);
      console.error("Error message:", error?.message);

      const backendError =
        error?.response?.data?.error || error?.message || "Payment initiation failed";
      console.log("Final error message:", backendError);
      setError(backendError);
    }
    console.log("=== PAYMENT INITIATION END ===");
  };

  // Cashfree SDK integration: open checkout when payment_session_id is available
  const cashfreeScriptLoaded = useRef(false);

  // Load Cashfree SDK script if not already present
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Cashfree && !cashfreeScriptLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        cashfreeScriptLoaded.current = true;
        console.log("Cashfree SDK loaded");
      };
      document.body.appendChild(script);
    }
  }, []);

  // Handle payment gateway checkout when payment data is available
  useEffect(() => {
    if (step === "payment" && paymentInitiate.data?.data?.payment_data) {
      const paymentData = paymentInitiate.data.data.payment_data;
      const gateway = paymentData.gateway;

      if (gateway === 'cashfree') {
        // Handle Cashfree payment
        if (
          paymentData.payment_session_id &&
          typeof window !== "undefined" &&
          window.Cashfree
        ) {
          const environment = paymentData.environment === "TEST" ? "sandbox" : "production";
          try {
            const cashfree = window.Cashfree({ mode: environment });
            cashfree.checkout({
              paymentSessionId: paymentData.payment_session_id,
              redirectTarget: "_self",
            });
            setError(null);
          } catch (err) {
            setError("Failed to load Cashfree payment gateway. Please try again.");
            console.error("Cashfree SDK error:", err);
          }
        }
      } else if (gateway === 'payu') {
        // Handle PayU payment - redirect to PayU form
        if (paymentData.payment_url && paymentData.form_data) {
          try {
            // Create and submit PayU form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = paymentData.payment_url;
            
            // Add all form fields
            Object.entries(paymentData.form_data).forEach(([key, value]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value as string;
              form.appendChild(input);
            });
            
            document.body.appendChild(form);
            form.submit();
            setError(null);
          } catch (err) {
            setError("Failed to redirect to PayU payment gateway. Please try again.");
            console.error("PayU redirect error:", err);
          }
        }
      }
    }
    
    // Backward compatibility for old Cashfree data structure
    else if (
      step === "payment" &&
      paymentInitiate.data?.data?.cashfree_data?.payment_session_id &&
      typeof window !== "undefined" &&
      window.Cashfree
    ) {
      const paymentSessionId = paymentInitiate.data.data.cashfree_data.payment_session_id;
      const environment = paymentInitiate.data.data.cashfree_data.environment === "TEST" ? "sandbox" : "production";
      try {
        const cashfree = window.Cashfree({ mode: environment });
        cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_self",
        });
        setError(null);
      } catch (err) {
        setError("Failed to load payment gateway. Please try again.");
        console.error("Cashfree SDK error:", err);
      }
    }
  }, [step, paymentInitiate.data]);



  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-black rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        {step === "register" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">
              Event Registration
            </h2>
            <p className="mb-4 text-white">
              Register for{" "}
              <span className="font-semibold">{event.event_name}</span>
            </p>
            {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}
            <Button
              onClick={handleRegister}
              disabled={registerMutation.isPending}
              className="w-full bg-white text-black font-bold hover:bg-gray-200"
            >
              {registerMutation.isPending ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : null}
              Register
            </Button>
          </div>
        )}
        {step === "payment" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">
              Payment Required
            </h2>
            <p className="mb-4 text-white">
              This event requires payment. Click below to proceed to payment.
            </p>
            {/* Sandbox badge if environment is TEST */}
            {(paymentInitiate.data?.data?.payment_data?.environment === "TEST" ||
              paymentInitiate.data?.data?.cashfree_data?.environment === "TEST") && (
              <div className="mb-3 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold inline-block">
                SANDBOX MODE ({paymentInitiate.data?.data?.payment_data?.gateway?.toUpperCase() || 'CASHFREE'})
              </div>
            )}
            {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}
            <Button
              onClick={handleInitiatePayment}
              disabled={paymentInitiate.isPending}
              className="w-full bg-white text-black font-bold hover:bg-gray-200"
            >
              {paymentInitiate.isPending ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : null}
              Pay Now
            </Button>
          </div>
        )}
        {step === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              Registration Complete!
            </h3>
            <p className="mb-4 text-white">
              You are successfully registered
              {isPaidEvent ? " and payment is confirmed." : "."}
            </p>
            <Button
              onClick={onClose}
              className="w-full bg-white text-black font-bold hover:bg-gray-200"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
