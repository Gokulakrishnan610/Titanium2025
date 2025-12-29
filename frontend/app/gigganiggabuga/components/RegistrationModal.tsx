"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";

interface RegistrationModalProps {
  eventId: string;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  teamName?: string;
  teamSize?: number;
  transactionId?: string;
}

export default function RegistrationModal({
  eventId,
  onClose,
}: RegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    college: "",
    branch: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const [eventDetails, setEventDetails] = useState<{
    title: string;
    prize: string;
    fee: string;
  } | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/events/${eventId}/`);
        if (response.ok) {
          const data = await response.json();
          setEventDetails(data);
        }
      } catch {
        setEventDetails({
          title: "Tech Event",
          prize: "₹50,000",
          fee: "₹500",
        });
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = "Phone must be 10 digits";
      }
      if (!formData.college.trim()) newErrors.college = "College is required";
      if (!formData.branch.trim()) newErrors.branch = "Branch is required";
      if (!formData.year.trim()) newErrors.year = "Year is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as Step);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/registrations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          ...formData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/events/${eventId}/ticket/${data.ticket_id}`;
      } else {
        throw new Error("Registration failed");
      }
    } catch {
      setTimeout(() => {
        window.location.href = `/events/${eventId}/ticket/DEMO123`;
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (typeof window !== "undefined" && (window as typeof window & { Razorpay?: unknown }).Razorpay) {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_demo",
        amount: 50000, 
        currency: "INR",
        name: "Titanium 2025",
        description: eventDetails?.title || "Event Registration",
        handler: function (response: { razorpay_payment_id: string }) {
          handleInputChange("transactionId", response.razorpay_payment_id);
          handleNext();
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#C0C0C0",
        },
      };

      const RazorpayConstructor = (window as typeof window & { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
      const razorpay = new RazorpayConstructor(options);
      razorpay.open();
    } else {
      handleNext();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-mono font-bold text-titanium-white mb-6">
              Personal Details
            </h3>

            <div>
              <label className="block text-sm text-titanium-metallic mb-2 font-mono">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-3 bg-titanium-charcoal border ${
                  errors.name ? "border-red-500" : "border-titanium-silver/30"
                } rounded-lg text-titanium-white focus:outline-none focus:border-titanium-silver transition-colors`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-titanium-metallic mb-2 font-mono">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 bg-titanium-charcoal border ${
                  errors.email ? "border-red-500" : "border-titanium-silver/30"
                } rounded-lg text-titanium-white focus:outline-none focus:border-titanium-silver transition-colors`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-titanium-metallic mb-2 font-mono">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-4 py-3 bg-titanium-charcoal border ${
                  errors.phone ? "border-red-500" : "border-titanium-silver/30"
                } rounded-lg text-titanium-white focus:outline-none focus:border-titanium-silver transition-colors`}
                placeholder="9876543210"
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-titanium-metallic mb-2 font-mono">
                  College *
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => handleInputChange("college", e.target.value)}
                  className={`w-full px-4 py-3 bg-titanium-charcoal border ${
                    errors.college ? "border-red-500" : "border-titanium-silver/30"
                  } rounded-lg text-titanium-white focus:outline-none focus:border-titanium-silver transition-colors`}
                  placeholder="SRMIST"
                />
                {errors.college && (
                  <p className="text-red-400 text-xs mt-1">{errors.college}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-titanium-metallic mb-2 font-mono">
                  Branch *
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  className={`w-full px-4 py-3 bg-titanium-charcoal border ${
                    errors.branch ? "border-red-500" : "border-titanium-silver/30"
                  } rounded-lg text-titanium-white focus:outline-none focus:border-titanium-silver transition-colors`}
                  placeholder="CSE"
                />
                {errors.branch && (
                  <p className="text-red-400 text-xs mt-1">{errors.branch}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-titanium-metallic mb-2 font-mono">
                Year *
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                aria-label="Select your year of study"
                className={`w-full px-4 py-3 bg-titanium-charcoal border ${
                  errors.year ? "border-red-500" : "border-titanium-silver/30"
                } rounded-lg text-titanium-white focus:outline-none focus:border-titanium-silver transition-colors`}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              {errors.year && (
                <p className="text-red-400 text-xs mt-1">{errors.year}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-mono font-bold text-titanium-white mb-6">
              Payment Details
            </h3>

            <div className="p-6 bg-titanium-charcoal border border-titanium-silver/30 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-titanium-metallic font-mono">Event</span>
                <span className="text-titanium-white font-mono">
                  {eventDetails?.title || "Loading..."}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-titanium-metallic font-mono">
                  Registration Fee
                </span>
                <span className="text-titanium-white font-mono text-lg">
                  {eventDetails?.fee || "₹500"}
                </span>
              </div>
              <div className="border-t border-titanium-silver/20 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-titanium-silver font-mono font-bold">
                    Total Amount
                  </span>
                  <span className="text-titanium-silver font-mono font-bold text-xl">
                    {eventDetails?.fee || "₹500"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="w-full py-4 bg-titanium-silver text-titanium-black font-mono font-bold rounded-lg hover:bg-titanium-bright transition-colors"
            >
              Proceed to Payment
            </button>

            <p className="text-xs text-titanium-metallic text-center">
              Secured by Razorpay • Your payment is safe and encrypted
            </p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>

            <h3 className="text-2xl font-mono font-bold text-titanium-white">
              Registration Successful!
            </h3>

            <p className="text-titanium-metallic">
              Your registration for <strong>{eventDetails?.title}</strong> has been
              confirmed. Your e-ticket has been generated and sent to your email.
            </p>

            <div className="p-4 bg-titanium-charcoal border border-titanium-silver/30 rounded-lg">
              <p className="text-xs text-titanium-metallic mb-1">
                Transaction ID
              </p>
              <p className="text-titanium-white font-mono">
                {formData.transactionId || "DEMO-" + Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-titanium-silver text-titanium-black font-mono font-bold rounded-lg hover:bg-titanium-bright transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  View E-Ticket
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-titanium-black/80 backdrop-blur-xl"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-titanium-rich border border-titanium-silver/30 rounded-2xl p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close registration modal"
          className="absolute top-6 right-6 text-titanium-metallic hover:text-titanium-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all ${
                  currentStep >= step
                    ? "bg-titanium-silver text-titanium-black"
                    : "bg-titanium-charcoal text-titanium-metallic"
                }`}
              >
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    currentStep > step
                      ? "bg-titanium-silver"
                      : "bg-titanium-charcoal"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {currentStep !== 3 && (
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-titanium-charcoal border border-titanium-silver/30 hover:border-titanium-silver rounded-lg text-titanium-white font-mono transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {currentStep < 2 && (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-titanium-silver text-titanium-black font-mono font-bold rounded-lg hover:bg-titanium-bright transition-colors flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
