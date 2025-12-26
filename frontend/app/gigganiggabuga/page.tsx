"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import EventCard, { type HoverEffect } from "./components/EventCard";
import RegistrationModal from "./components/RegistrationModal";
import eventsConfig, { type BackgroundStyle, type LoadingStyle } from "./config";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./events.css";

gsap.registerPlugin(ScrollTrigger);

// Types
export type { HoverEffect, BackgroundStyle, LoadingStyle } from "./config";

interface Event {
  id: string;
  title: string;
  category: string;
  description: string;
  prize: string;
  image: string;
  date: string;
  venue: string;
  participants: number;
}

interface EventsPageProps {
  hoverEffect?: HoverEffect;
  backgroundStyle?: BackgroundStyle;
  loadingStyle?: LoadingStyle;
  glowColor?: string;
}

// Pseudo data fallback
const PSEUDO_EVENTS: Event[] = [
  {
    id: "1",
    title: "HackTitan 2025",
    category: "Hackathon",
    description: "48-hour coding marathon to build innovative solutions for real-world problems. Team up with brilliant minds and create something extraordinary.",
    prize: "₹5,00,000",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 14-16, 2025",
    venue: "SRMIST KTR",
    participants: 500,
  },
  {
    id: "2",
    title: "CyberFortress CTF",
    category: "Cybersecurity",
    description: "Capture the flag competition testing your security and ethical hacking skills. Crack challenges and dominate the leaderboard.",
    prize: "₹2,50,000",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 15, 2025",
    venue: "Tech Park Block",
    participants: 300,
  },
  {
    id: "3",
    title: "AI Arena Challenge",
    category: "Artificial Intelligence",
    description: "Build and deploy machine learning models to solve complex real-world challenges. Showcase your AI expertise.",
    prize: "₹3,00,000",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 17, 2025",
    venue: "Innovation Lab",
    participants: 250,
  },
  {
    id: "4",
    title: "RoboWars 2025",
    category: "Robotics",
    description: "Design and program robots to compete in various challenging combat and task-based competitions.",
    prize: "₹2,00,000",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 16-17, 2025",
    venue: "Arena Ground",
    participants: 200,
  },
  {
    id: "5",
    title: "GameDev Jam",
    category: "Game Development",
    description: "Create an original game from scratch in just 24 hours. Unleash your creativity and game development skills.",
    prize: "₹1,50,000",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 18, 2025",
    venue: "Creative Studio",
    participants: 180,
  },
  {
    id: "6",
    title: "StartUp Pitch Battle",
    category: "Entrepreneurship",
    description: "Pitch your startup idea to top VCs and industry leaders. Win funding and mentorship for your venture.",
    prize: "₹10,00,000",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 19, 2025",
    venue: "Auditorium",
    participants: 150,
  },
  {
    id: "7",
    title: "Code Sprint Marathon",
    category: "Competitive Programming",
    description: "Intense competitive programming contest featuring algorithmic challenges and optimization problems.",
    prize: "₹1,00,000",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 14, 2025",
    venue: "Lab Complex",
    participants: 400,
  },
  {
    id: "8",
    title: "Design Thinking Workshop",
    category: "Workshop",
    description: "Learn design thinking methodologies and create user-centered solutions for complex problems.",
    prize: "Certificates",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
    date: "Feb 15-16, 2025",
    venue: "Workshop Hall",
    participants: 100,
  },
];

export default function EventsPage({
  hoverEffect = eventsConfig.hoverEffect,
  backgroundStyle = eventsConfig.backgroundStyle,
  loadingStyle = eventsConfig.loadingStyle,
  glowColor = eventsConfig.glowColor,
}: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/events/");
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
          setFilteredEvents(data);
        } else {
          throw new Error("Backend unavailable");
        }
      } catch {
        setEvents(PSEUDO_EVENTS);
        setFilteredEvents(PSEUDO_EVENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const renderBackground = () => {
    switch (backgroundStyle) {
      case "grid":
        return (
          <div className="fixed inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-0 events-grid-background" />
          </div>
        );
      case "particles":
        return (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-titanium-silver rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        );
      case "noise":
        return (
          <div className="fixed inset-0 pointer-events-none opacity-10">
            <div className="absolute inset-0 bg-linear-to-br from-titanium-silver/20 via-transparent to-titanium-silver/20" />
          </div>
        );
      case "solid":
      default:
        return null;
    }
  };

  const renderLoading = () => {
    switch (loadingStyle) {
      case "skeleton":
        return (
          <div className="flex gap-6 px-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shrink-0 w-125 h-150 bg-titanium-charcoal rounded-lg animate-pulse" />
            ))}
          </div>
        );
      case "spinner":
        return (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 text-titanium-silver animate-spin" />
            <span className="ml-4 text-titanium-silver font-mono">Loading Events...</span>
          </div>
        );
      case "logo":
        return (
          <div className="flex items-center justify-center h-screen">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Sparkles className="w-16 h-16 text-titanium-silver" />
            </motion.div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-titanium-black">
        {renderBackground()}
        {renderLoading()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-titanium-black relative overflow-hidden">
      {renderBackground()}

      <motion.div
        ref={progressBarRef}
        className="fixed top-0 left-0 h-1 bg-titanium-silver z-50"
        style={{ width: `${scrollProgress}%` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <div
        ref={scrollContainerRef}
        className="max-w-[1600px] mx-auto px-12 py-16 pb-32 mt-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14 w-full items-stretch">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div 
                key={event.id} 
                className="w-full min-h-full flex"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <EventCard
                  event={event}
                  hoverEffect={hoverEffect}
                  glowColor={glowColor}
                  onRegister={setSelectedEvent}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full w-full h-96 flex items-center justify-center">
              <p className="text-titanium-metallic font-mono">No events found</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <RegistrationModal
            eventId={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
