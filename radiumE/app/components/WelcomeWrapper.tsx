"use client";
import { useState, useEffect } from "react";
import WelcomeScreen from "./WelcomeScreen";

interface WelcomeWrapperProps {
  children: React.ReactNode;
}

export default function WelcomeWrapper({ children }: WelcomeWrapperProps) {
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if user has seen welcome screen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('welcome_seen');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, []);

  const handleWelcomeComplete = () => {
    localStorage.setItem('welcome_seen', 'true');
    setShowWelcome(false);
  };

  // Show welcome screen if needed
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return <>{children}</>;
}