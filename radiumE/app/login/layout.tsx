"use client";
import type { Metadata } from "next";
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>   
        <div className="relative z-10">
          {children}
        </div>
    </GoogleOAuthProvider>
  );
}
