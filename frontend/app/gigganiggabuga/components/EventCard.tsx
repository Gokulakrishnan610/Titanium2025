"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import CyberpunkBorder from "./CyberpunkBorder";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import type { HoverEffect } from "../config";
import "../events.css";

export type { HoverEffect };

interface EventCardProps {
  event: {
    id: string;
    title: string;
    category: string;
    description: string;
    prize: string;
    image: string;
    date: string;
    venue: string;
    participants: number;
  };
  hoverEffect?: HoverEffect;
  glowColor?: string;
  onRegister: (eventId: string) => void;
}

export default function EventCard({
  event,
  hoverEffect = "tilt",
  glowColor = "#C0C0C0",
  onRegister,
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || hoverEffect !== "tilt") return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const getHoverAnimation = () => {
    switch (hoverEffect) {
      case "tilt":
        return {
          rotateX,
          rotateY,
          scale: isHovered ? 1.02 : 1,
        };
      case "lift":
        return {
          y: isHovered ? -20 : 0,
          scale: isHovered ? 1.05 : 1,
        };
      case "exploded":
        return {
          scale: isHovered ? 1.05 : 1,
        };
      case "holographic":
        return {
          scale: isHovered ? 1.02 : 1,
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full overflow-hidden h-full"
      style={{
        perspective: 1000,
        clipPath: "polygon(30px 0, calc(100% - 30px) 0, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 30px), 0 30px)",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative bg-titanium-rich overflow-hidden h-full flex flex-col"
        style={{
          transformStyle: "preserve-3d",
          ...getHoverAnimation(),
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-titanium-silver/10 to-transparent rounded-lg blur-xl" />
        <div className="absolute inset-0 -z-20 bg-titanium-silver/5 rounded-lg translate-y-2 blur-2xl" />

        <div className="absolute inset-0 pointer-events-none z-20">
          <CyberpunkBorder glowColor={glowColor} animated={isHovered} />
        </div>

        {hoverEffect === "exploded" && isHovered && (
          <>
            <motion.div
              className="absolute inset-0 border border-titanium-silver/20 rounded-lg"
              initial={{ scale: 1 }}
              animate={{ scale: 1.05, opacity: 0.5 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute inset-0 border border-titanium-silver/10 rounded-lg"
              initial={{ scale: 1 }}
              animate={{ scale: 1.1, opacity: 0.3 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </>
        )}

        {hoverEffect === "holographic" && isHovered && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(192,192,192,0.3) 50%, transparent 100%)",
            }}
            initial={{ y: "-100%" }}
            animate={{ y: "100%" }}
            transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
          />
        )}

        <div className="relative z-10 p-6 flex flex-col flex-1">
          <motion.div
            className="relative h-64 rounded-md overflow-hidden mb-6"
            style={{
              transformStyle: "preserve-3d",
              ...(hoverEffect === "tilt" && isHovered
                ? { z: 50 }
                : {}),
            }}
          >
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </motion.div>

            <div className="absolute inset-0 bg-linear-to-t from-titanium-black via-transparent to-transparent" />

            <div className="absolute top-4 left-4 px-3 py-1 bg-titanium-black/80 backdrop-blur-sm border border-titanium-silver/30 rounded text-xs font-mono text-titanium-silver">
              {event.category}
            </div>

            <div className="absolute top-4 right-4 px-3 py-1 bg-titanium-silver/10 backdrop-blur-sm border border-titanium-silver/50 rounded text-xs font-mono text-titanium-bright flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {event.prize}
            </div>
          </motion.div>

          <div className="space-y-4 flex-1 flex flex-col">
            <h3 className="text-2xl font-mono font-bold text-titanium-white">
              {event.title}
            </h3>

            <p className="text-sm text-titanium-metallic leading-relaxed flex-1">
              {event.description}
            </p>

            <div className="grid grid-cols-2 gap-3 py-4 mt-auto">
              <div className="flex items-center gap-2 text-xs text-titanium-bright">
                <Calendar className="w-4 h-4 text-titanium-silver" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-titanium-bright">
                <MapPin className="w-4 h-4 text-titanium-silver" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-titanium-bright col-span-2">
                <Users className="w-4 h-4 text-titanium-silver" />
                <span>{event.participants}+ Participants</span>
              </div>
            </div>

            <motion.button
              onClick={() => onRegister(event.id)}
              className="w-full py-3 bg-titanium-silver/10 hover:bg-titanium-silver/20 border border-titanium-silver/50 hover:border-titanium-silver rounded text-titanium-white font-mono text-sm transition-all duration-300 relative overflow-hidden group mt-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">Register Now</span>
              <motion.div
                className="absolute inset-0 bg-titanium-silver/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
