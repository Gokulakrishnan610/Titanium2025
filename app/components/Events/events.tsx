"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Shield, Brain, Cpu, Gamepad2, Rocket, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./radialevents.module.css";

gsap.registerPlugin(ScrollTrigger);

const events = [
  {
    icon: Code,
    title: "HackTitan",
    category: "Hackathon",
    description: "48-hour coding marathon to build innovative solutions for real-world problems",
    prize: "₹5,00,000",
    featured: true,
    image: "https://images.unsplash.com/photo-1660644808219-1f103401bc85?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    icon: Shield,
    title: "CyberFortress",
    category: "CTF",
    description: "Capture the flag competition testing your security and hacking skills",
    prize: "₹2,50,000",
    featured: true,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    icon: Brain,
    title: "AI Arena",
    category: "AI Challenge",
    description: "Build and deploy machine learning models to solve complex challenges",
    prize: "₹3,00,000",
    featured: false,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
  },
  {
    icon: Cpu,
    title: "RoboWars",
    category: "Robotics",
    description: "Design and program robots to compete in various challenging tasks",
    prize: "₹2,00,000",
    featured: false,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
  },
  {
    icon: Gamepad2,
    title: "GameDev Jam",
    category: "Game Development",
    description: "Create an original game from scratch in just 24 hours",
    prize: "₹1,50,000",
    featured: false,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
  },
  {
    icon: Rocket,
    title: "StartUp Pitch",
    category: "Entrepreneurship",
    description: "Pitch your startup idea to top VCs and industry leaders",
    prize: "₹10,00,000",
    featured: true,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function Events() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tabTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const rotationRef = useRef(0);
  const startXRef = useRef(0);
  const startRotationRef = useRef(0);

  const radius = 900;
  const verticalScale = 0.3;
  const angleStep = 180 / events.length;

  function updateCardsPosition(animate = true) {
    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      const rotationAngle = index * angleStep - rotationRef.current;
      const angle = rotationAngle * (Math.PI / 90);
      const x = Math.sin(angle) * radius;
      const y = (-Math.cos(angle) * radius + radius) * verticalScale;

      const normalizedY = y / (radius * 2 * verticalScale);
      const scale = 1 - normalizedY * 0.3;

      const normalizedAngle = ((rotationAngle % 360) + 360) % 360;
      

      let opacity = 0;
      const fadeRange = 25; 
      const visibleRange = 25;
      
      let distanceFromCenter = normalizedAngle;
      if (distanceFromCenter > 180) {
        distanceFromCenter = 360 - distanceFromCenter;
      }
      
      if (distanceFromCenter <= visibleRange) {
        opacity = 1;
      } else if (distanceFromCenter <= visibleRange + fadeRange) {
        const fadeProgress = (distanceFromCenter - visibleRange) / fadeRange;
        opacity = 1 - Math.pow(fadeProgress, 2); 
      } else {
        opacity = 0;
      }

      const zIndex = Math.round(1000 - y);
      const cardRotation = Math.sin(angle) * 20;

      if (animate) {
        gsap.to(card, {
          x,
          y,
          scale,
          opacity,
          rotation: cardRotation,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => {
            card.style.zIndex = zIndex.toString();
          },
        });
      } else {
        gsap.set(card, {
          x,
          y,
          scale,
          opacity,
          rotation: cardRotation,
        });
        card.style.zIndex = zIndex.toString();
      }
    });
  }

  useEffect(() => {
    updateCardsPosition(false);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
    startRotationRef.current = rotationRef.current;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startXRef.current;
    const rotationDelta = deltaX * -0.04;
    rotationRef.current = startRotationRef.current + rotationDelta;

    updateCardsPosition(false);

    const totalRotation = angleStep * events.length;
    const normalizedRotation = ((rotationRef.current % totalRotation) + totalRotation) % totalRotation;
    const newIndex = Math.round(normalizedRotation / angleStep) % events.length;
    setCurrentIndex(newIndex);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const nearestCardOffset = Math.round(rotationRef.current / angleStep);
    const targetRotation = nearestCardOffset * angleStep;

    gsap.to(rotationRef, {
      current: targetRotation,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        updateCardsPosition(false);
      },
    });

    const normalizedIndex = ((nearestCardOffset % events.length) + events.length) % events.length;
    setCurrentIndex(normalizedIndex);
  };

  const handleIndicatorClick = (index: number) => {
    const currentStep = Math.round(rotationRef.current / angleStep);
    const currentIndexAtStep = ((currentStep % events.length) + events.length) % events.length;

    let diff = index - currentIndexAtStep;

    if (diff > events.length / 2) {
      diff -= events.length;
    } else if (diff < -events.length / 2) {
      diff += events.length;
    }

    const targetRotation = (currentStep + diff) * angleStep;

    gsap.to(rotationRef, {
      current: targetRotation,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        updateCardsPosition(false);
      },
    });

    setCurrentIndex(index);
  };

  useEffect(() => {
    const tabText = tabTextRefs.current[currentIndex];
    if (tabText) {
      gsap.fromTo(
        tabText,
        { scale: 0.9, opacity: 0.6 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "back.out(1.7)",
        },
      );
    }
  }, [currentIndex]);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo(
        ".events-header",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".events-header",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="events"
      className="relative py-16 bg-titanium-black overflow-hidden min-h-screen"
    >
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

      <div className="relative z-10 w-full h-full flex flex-col">
        <div className="events-header text-center mb-8 pt-8">
          <span className="inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
            Compete & Create
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-titanium-gradient">Featured</span>{" "}
            <span className="text-titanium-light">Events</span>
          </h2>
          <p className="text-titanium-metallic text-lg max-w-2xl mx-auto">
            Participate in world-class competitions and win incredible prizes
          </p>
        </div>


        <div className="relative flex-1 flex flex-col min-h-[700px ] mt-28">
          <div
            ref={containerRef}
            className={cn(
              styles["radial-carousel-container"],
              "relative w-full h-full min-h-[600px] select-none",
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
              {events.map((event, index) => (
                <div
                  key={event.title}
                  ref={(el) => {
                    cardsRef.current[index] = el;
                  }}
                  className="absolute w-[571px] h-[744px] rounded-3xl shadow-2xl flex flex-col items-center justify-end p-10 transition-shadow hover:shadow-3xl overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    backgroundImage: `url(${event.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />

                  {event.featured && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/10 backdrop-blur-md text-white border border-white/20">
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="absolute top-8 left-8 z-10">
                    <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <event.icon size={32} className="text-white" />
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center text-center gap-4 w-full">
                    <span className="text-xs font-mono uppercase tracking-wider text-lime-400">
                      {event.category}
                    </span>
                    <h2 className="text-4xl font-bold leading-tight text-white">{event.title}</h2>
                    <p className="text-sm opacity-80 max-w-xs leading-relaxed line-clamp-2 text-white">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                      <Trophy size={20} className="text-lime-400" />
                      <div className="text-left">
                        <span className="text-xs uppercase tracking-wider block text-white/70">
                          Prize Pool
                        </span>
                        <span className="text-xl font-bold text-white">{event.prize}</span>
                      </div>
                    </div>

                    <button className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium transition-all duration-300">
                      View Event
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>

            <div className="absolute -bottom-46 left-1/2 -translate-x-1/2 z-20">
              <button className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                EXPLORE ALL EVENTS
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          <div className="mt-62 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Trophy, value: "₹25L+", label: "Total Prizes" },
              { icon: Users, value: "5000+", label: "Participants" },
              { icon: Code, value: "50+", label: "Challenges" },
              { icon: Rocket, value: "100+", label: "Mentors" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl bg-titanium-charcoal/30 border border-titanium-silver/5"
              >
                <stat.icon size={24} className="text-titanium-silver mx-auto mb-3" />
                <div className="text-2xl font-bold text-titanium-gradient">{stat.value}</div>
                <div className="text-sm text-titanium-metallic">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}
