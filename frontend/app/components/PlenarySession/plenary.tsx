"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import styles from "./plenary.module.css";

gsap.registerPlugin(ScrollTrigger);

interface PlenarySession {
  id: string;
  sessionTitle: string;
  day: number;
  date: string;
  time: string;
  crypticHint: string;
  topic: {
    title: string;
    description: string;
    tags: string[];
  };
  venue: string;
  featured?: boolean;
  achievements: string[];
}

const plenarySessionsData: PlenarySession[] = [
  {
    id: "ps1",
    sessionTitle: "The Future of Computing",
    day: 1,
    date: "2025-01-20",
    time: "10:00 AM - 11:30 AM",
    crypticHint: "A visionary who revolutionized personal computing and global philanthropy",
    topic: {
      title: "Innovation in the Age of AI",
      description: "Exploring how artificial intelligence will reshape industries and transform society",
      tags: ["AI", "Innovation", "Future Tech"],
    },
    venue: "Main Seminar Hall",
    featured: true,
    achievements: ["Tech Pioneer", "Philanthropist", "Industry Legend"],
  },
  {
    id: "ps2",
    sessionTitle: "The Open Source Revolution",
    day: 2,
    date: "2025-01-21",
    time: "11:00 AM - 12:30 PM",
    crypticHint: "The architect behind the kernel that powers billions of devices worldwide",
    topic: {
      title: "Building Systems That Last Decades",
      description: "Lessons from creating and maintaining the world's most important operating system",
      tags: ["Open Source", "Linux", "System Design"],
    },
    venue: "A304",
    featured: true,
    achievements: ["OS Creator", "Open Source Legend", "Software Architect"],
  },
  {
    id: "ps3",
    sessionTitle: "Entrepreneurship & Innovation",
    day: 3,
    date: "2025-01-22",
    time: "09:30 AM - 11:00 AM",
    crypticHint: "A serial entrepreneur pushing humanity toward a multi-planetary future",
    topic: {
      title: "Building Tomorrow's Technology",
      description: "From electric vehicles to space exploration - reimagining what's possible",
      tags: ["Space Tech", "Innovation", "Sustainability"],
    },
    venue: "Purple Hall",
    featured: true,
    achievements: ["Space Pioneer", "Tech Innovator", "Visionary CEO"],
  },
  {
    id: "ps4",
    sessionTitle: "AI Ethics & Society",
    day: 4,
    date: "2025-01-23",
    time: "02:00 PM - 03:30 PM",
    crypticHint: "Leading one of the world's most influential tech companies into the AI era",
    topic: {
      title: "Responsible AI Development",
      description: "Balancing technological innovation with ethical considerations and societal impact",
      tags: ["AI Ethics", "Technology", "Society"],
    },
    venue: "Auditorium",
    featured: false,
    achievements: ["Tech CEO", "AI Pioneer", "Industry Leader"],
  },
  {
    id: "ps5",
    sessionTitle: "The Quantum Leap",
    day: 5,
    date: "2025-01-24",
    time: "10:30 AM - 12:00 PM",
    crypticHint: "Transforming enterprise technology through cloud innovation and AI integration",
    topic: {
      title: "Cloud Computing & Quantum Integration",
      description: "How quantum computing will revolutionize cloud infrastructure and business solutions",
      tags: ["Quantum", "Cloud", "Future Computing"],
    },
    venue: "Tech Lounge",
    featured: false,
    achievements: ["Cloud Architect", "Tech Transformer", "Business Leader"],
  },
  {
    id: "ps6",
    sessionTitle: "Security & Privacy",
    day: 6,
    date: "2025-01-25",
    time: "03:00 PM - 04:30 PM",
    crypticHint: "A champion of user privacy and security in the modern digital landscape",
    topic: {
      title: "Privacy as a Fundamental Right",
      description: "Building secure systems that protect user privacy in an interconnected world",
      tags: ["Security", "Privacy", "User Trust"],
    },
    venue: "D103",
    featured: false,
    achievements: ["Privacy Advocate", "Security Expert", "Tech Leader"],
  },
];

interface PlenarySessionsProps {
  sessions?: PlenarySession[];
}

export default function PlenarySessions({
  sessions = plenarySessionsData,
}: PlenarySessionsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (!section || !container || !scrollContainer) return;

    const ctx = gsap.context(() => {

      // Horizontal scroll
      const totalScrollWidth = scrollContainer.scrollWidth - window.innerWidth;
      
      gsap.to(scrollContainer, {
        x: () => `-${totalScrollWidth}px`,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: () => `+=${totalScrollWidth + window.innerHeight}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cn("relative w-full bg-titanium-black overflow-x-hidden", styles.plenarySection)}
    >
      
      <div ref={containerRef} className="relative min-h-screen">

        <div className="plenary-header absolute top-20 left-0 right-0 z-10 px-8">
          <div className="mb-4">
            <h2 className="text-5xl md:text-7xl font-bold shimmer">
              Plenary Sessions
            </h2>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className={cn("flex items-center gap-8 pt-64 pb-32 pl-8 pr-8", styles.scrollContainer)}
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "plenary-card shrink-0 w-[900px] rounded-2xl overflow-hidden",
                styles.sessionCard
              )}
            >
              <div className="relative w-full h-full bg-linear-to-br from-titanium-charcoal via-titanium-rich to-titanium-black border border-titanium-silver/20 backdrop-blur-xl p-6 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={styles.dayBadge}>
                      <span className="text-xs font-bold">DAY</span>
                      <span className="text-2xl font-bold">{session.day}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-titanium-light leading-tight">
                        {session.sessionTitle}
                      </h3>
                      <p className="text-xs text-titanium-metallic mt-1">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span className="text-titanium-silver/60 block mt-1">{session.time}</span>
                    </div>
                  </div>
                  {session.featured && (
                    <div className="px-2 py-1 rounded-md bg-titanium-silver/10 border border-titanium-silver/30">
                      <span className="text-titanium-silver text-xs font-semibold">★</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-9 gap-12 flex-1">
                  <div className="col-span-5 flex items-center justify-center">
                    <div className={styles.humanFigureXL}>
                      <div className={styles.figureGlow} />
                      <Image
                        src="/personMask.png"
                        alt="Mystery Speaker Mask"
                        className={styles.mysteryMaskXL}
                        width={400}
                        height={400}
                        draggable={false}
                        priority
                      />
                      <div className={styles.mysteryLabel}>MYSTERY SPEAKER</div>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-linear-to-r from-titanium-silver/50 to-transparent" />
                          <span className="text-xs text-titanium-silver/70 uppercase tracking-wider">Topic</span>
                        </div>
                        <h4 className="text-lg font-bold text-titanium-bright mb-1">
                          {session.topic.title}
                        </h4>
                        <p className="text-xs text-titanium-metallic leading-relaxed">
                          {session.topic.description}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-linear-to-r from-titanium-silver/50 to-transparent" />
                          <span className="text-xs text-titanium-silver/70 uppercase tracking-wider">Hint</span>
                        </div>
                        <div className="bg-titanium-silver/5 rounded-lg p-3 border-l-2 border-titanium-silver/30">
                          <p className="text-xs text-titanium-metallic italic leading-relaxed">
                            &quot;{session.crypticHint}&quot;
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-linear-to-r from-titanium-silver/50 to-transparent" />
                          <span className="text-xs text-titanium-silver/70 uppercase tracking-wider">Achievements</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {session.achievements.map((achievement) => (
                            <span
                              key={achievement}
                              className="px-2 py-0.5 rounded bg-titanium-silver/10 border border-titanium-silver/20 text-titanium-silver text-xs"
                            >
                              {achievement}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-titanium-silver/10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-titanium-metallic">{session.time}</span>
                        </div>
                        <span className="text-titanium-silver font-medium">{session.venue}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.topic.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-titanium-silver/50"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 right-8 flex items-center gap-2 text-titanium-silver/50 text-sm">
        <span>Scroll to explore</span>
        <svg className="w-6 h-6 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </section>
  );
}
