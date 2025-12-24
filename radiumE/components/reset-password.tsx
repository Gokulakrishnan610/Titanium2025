"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useConfirmPasswordReset } from "../lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
} from "@tabler/icons-react";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    new_password1: '',
    new_password2: '',
    uid: '',
    token: ''
  });
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const confirmPasswordResetMutation = useConfirmPasswordReset();

  useEffect(() => {
    // Extract uid and token from URL parameters
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    if (uid && token) {
      setFormData(prev => ({
        ...prev,
        uid,
        token
      }));
    } else {
      setAuthError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');

    try {
      if (!formData.new_password1 || !formData.new_password2) {
        setAuthError('Please fill in all password fields');
        setIsLoading(false);
        return;
      }

      if (formData.new_password1 !== formData.new_password2) {
        setAuthError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (formData.new_password1.length < 8) {
        setAuthError('Password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }

      await confirmPasswordResetMutation.mutateAsync({
        uid: formData.uid,
        token: formData.token,
        new_password1: formData.new_password1,
        new_password2: formData.new_password2
      });

      setIsSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setAuthError(`Failed to reset password: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (isSuccess) {
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-2 dark:bg-black text-center">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Password Reset Successful
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          Your password has been successfully reset. You will be redirected to the login page shortly.
        </p>

        <div className="mt-6">
          <button
            onClick={handleBackToLogin}
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
          >
            Go to Login &rarr;
            <BottomGradient />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-2 dark:bg-black text-center">
      <button
        onClick={handleBackToLogin}
        className="flex items-center text-sm text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 mb-4"
      >
        <IconArrowLeft className="h-4 w-4 mr-2" />
        Back to Login
      </button>

      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Reset Your Password
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Enter your new password below.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="new_password1">New Password *</Label>
          <Input
            id="new_password1"
            placeholder="••••••••"
            type="password"
            onChange={handleInputChange}
            value={formData.new_password1}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-8">
          <Label htmlFor="new_password2">Confirm New Password *</Label>
          <Input
            id="new_password2"
            placeholder="••••••••"
            type="password"
            onChange={handleInputChange}
            value={formData.new_password2}
            required
          />
        </LabelInputContainer>

        {/* Error Display */}
        {authError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
          </div>
        )}

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading || !formData.uid || !formData.token}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'} &rarr;
          <BottomGradient />
        </button>
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};