"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import styles from "./plenary.module.css";

gsap.registerPlugin(ScrollTrigger);

interface Speaker {
  name: string;
  title: string;
  organization: string;
  photo?: string;
}

interface PlenarySession {
  id: string;
  sessionNumber: number;
  sessionTitle: string;
  topic: {
    title: string;
    description: string;
    tags: string[];
  };
  speakers: Speaker[];
  awaitingConfirmation: boolean;
  isOtherSpeakers?: boolean;
}

const plenarySessionsData: PlenarySession[] = [
  {
    id: "ps1",
    sessionNumber: 1,
    sessionTitle: "The Age of Artificial Intelligence",
    topic: {
      title: "AI Revolution",
      description: "Exploring the transformative impact of artificial intelligence on industries, society, and the future of human-machine collaboration.",
      tags: ["AI", "Machine Learning", "Future Tech"],
    },
    speakers: [],
    awaitingConfirmation: true,
  },
  {
    id: "ps2",
    sessionNumber: 2,
    sessionTitle: "Quantum, Edge & Neuromorphic Computing",
    topic: {
      title: "Next-Gen Computing",
      description: "Diving into the cutting-edge world of quantum computing, edge architectures, and brain-inspired neuromorphic systems.",
      tags: ["Quantum", "Edge Computing", "Neuromorphic"],
    },
    speakers: [],
    awaitingConfirmation: true,
  },
  {
    id: "ps3",
    sessionNumber: 3,
    sessionTitle: "Future of Mobility & Sustainable Energy",
    topic: {
      title: "Sustainable Mobility",
      description: "Exploring innovations in electric vehicles, sustainable transportation, and the future of clean energy solutions.",
      tags: ["EV", "Sustainability", "Green Energy"],
    },
    speakers: [
      {
        name: "Dr. Shankar Venugopal",
        title: "Vice-President",
        organization: "Mahindra & Mahindra",
      },
      {
        name: "Dr. Nagesh Poojari",
        title: "Managing Director",
        organization: "IPG Automotive India",
      },
      {
        name: "Mr. Paresh Patel",
        title: "Founder & CEO",
        organization: "Verde Mobility, India",
      },
      {
        name: "Dinesh Arjun",
        title: "CEO and Co-Founder",
        organization: "Raptee",
      },
    ],
    awaitingConfirmation: false,
  },
  {
    id: "ps4",
    sessionNumber: 4,
    sessionTitle: "SpaceTech & Frontier Engineering",
    topic: {
      title: "Space Exploration",
      description: "Pushing the boundaries of aerospace engineering, satellite technology, and humanity's reach into the cosmos.",
      tags: ["SpaceTech", "Aerospace", "Propulsion"],
    },
    speakers: [
      {
        name: "Professor Suresh Sampath",
        title: "Head of Gas Turbine Systems Engineering & Operations, Director-CPD Propulsion Engineering",
        organization: "Cranfield University, United Kingdom",
      },
    ],
    awaitingConfirmation: false,
  },
  {
    id: "ps5",
    sessionNumber: 5,
    sessionTitle: "Bio-Digital Convergence & Human Augmentation",
    topic: {
      title: "Biomedical Innovation",
      description: "The intersection of biology and technology - from biomedical engineering to human augmentation and digital health.",
      tags: ["Biomedical", "HealthTech", "Augmentation"],
    },
    speakers: [
      {
        name: "Suresh M.L. Raghavan",
        title: "Associate Dean for Graduate Education, Professor",
        organization: "Roy J. Carver Dept. of Biomedical Engineering, The University of Iowa",
      },
      {
        name: "Dr. Murugan",
        title: "Chief Scientist/GM - Diagnostics Micro Biology Division",
        organization: "mFINE, Chennai",
      },
      {
        name: "Bruce K Gale",
        title: "Chair and Merit Medical Systems Inc. Endowed Engineering Professor",
        organization: "The University of Utah, Dept. of Mechanical Engineering",
      },
      {
        name: "Mr. Piyush Padmanabhan",
        title: "Co-Founder and CEO",
        organization: "Next Big Innovations Labs (NBIL), Bengaluru",
      },
    ],
    awaitingConfirmation: false,
  },
  {
    id: "ps6",
    sessionNumber: 6,
    sessionTitle: "Climate Tech, Smart Cities & Circular Economy",
    topic: {
      title: "Climate Innovation",
      description: "Building sustainable cities of tomorrow through climate technology, smart infrastructure, and circular economy principles.",
      tags: ["ClimateTech", "Smart Cities", "Circular Economy"],
    },
    speakers: [],
    awaitingConfirmation: true,
  },
  {
    id: "other",
    sessionNumber: 0,
    sessionTitle: "Other Distinguished Speakers",
    topic: {
      title: "Special Guests",
      description: "Distinguished academics and industry leaders joining Titanium 2025 to share their expertise and insights.",
      tags: ["Academia", "Industry", "Leadership"],
    },
    speakers: [
      {
        name: "Dr. Krishnaswami (Hari) Srihari",
        title: "Dean Emeritus, SUNY Distinguished Professor",
        organization: "Thomas J. Watson College of Engineering, Binghamton University, New York",
      },
    ],
    awaitingConfirmation: false,
    isOtherSpeakers: true,
  },
];

function getInitials(name: string): string {
  const words = name.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.|Professor)\s*/i, "").split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
}

interface PlenarySessionsProps {
  sessions?: PlenarySession[];
}

export default function PlenarySessions({
  sessions = plenarySessionsData,
}: PlenarySessionsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PlenarySession | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (!section || !container || !scrollContainer || isMobile) return;

    const ctx = gsap.context(() => {

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
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative w-full bg-titanium-black overflow-x-hidden", styles.plenarySection)}
    >

      <div ref={containerRef} className="relative min-h-screen">

        <div className="plenary-header absolute top-20 left-0 right-0 z-10 px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-4">
            <div>
              <span className="inline-block text-xs md:text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-2 md:mb-4">
                Unlock Knowledge
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold">
                <span className="text-titanium-gradient">Plenary</span>{" "}
                <span className="text-titanium-light">Sessions</span>
              </h2>
            </div>
            <p className="text-titanium-metallic text-sm md:text-lg max-w-xl text-left md:text-right pb-1">
              Engage with industry leaders and visionaries as they share insights on the future of technology and innovation.
            </p>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex gap-4 md:gap-8 pt-32 md:pt-40 lg:pt-48 2xl:pt-64 pb-16 md:pb-24 pl-4 md:pl-8 pr-4 md:pr-8",
            isMobile ? "flex-col items-center" : "items-center",
            styles.scrollContainer
          )}
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "plenary-card w-full md:w-[85vw] lg:w-[900px] rounded-2xl overflow-hidden",
                !isMobile && "shrink-0",
                styles.sessionCard
              )}
            >
              <div className="relative w-full h-full bg-linear-to-br from-titanium-charcoal via-titanium-rich to-titanium-black border border-titanium-silver/20 backdrop-blur-xl p-6 md:p-6 flex flex-col">
                {isMobile ? (
                  <div className="relative flex flex-col justify-between w-full h-full min-h-[300px] p-4 gap-0 overflow-hidden">
                    <div className="absolute top-4 right-4 z-10">
                      {session.isOtherSpeakers ? (
                        <div className={cn(styles.dayBadge, styles.otherBadge)}>
                          <span className="text-xs font-bold">SPECIAL</span>
                          <span className="text-lg font-bold">✦</span>
                        </div>
                      ) : (
                        <div className={styles.dayBadge}>
                          <span className="text-xs font-bold">DAY</span>
                          <span className="text-2xl font-bold">{session.sessionNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 justify-start min-h-0 mt-2">
                      <h3 className="text-lg font-bold text-titanium-light leading-tight mt-2 mb-3 pr-16">
                        {session.sessionTitle}
                      </h3>
                      {session.awaitingConfirmation ? (
                        <span className={styles.revealingBadge}>Revealing Soon</span>
                      ) : (
                        <p className="text-sm text-titanium-metallic mb-2">
                          {session.speakers.length} Speaker{session.speakers.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="mt-2 px-4 py-2 bg-titanium-silver/10 border border-titanium-silver/30 rounded-lg text-titanium-silver hover:bg-titanium-silver/20 transition-colors w-fit"
                      >
                        Know More
                      </button>
                    </div>
                    <div className="absolute bottom-4 right-4 flex -space-x-2">
                      {session.speakers.slice(0, 3).map((speaker, idx) => (
                        <div key={idx} className={styles.miniAvatar}>
                          <span className={styles.miniInitials}>{getInitials(speaker.name)}</span>
                        </div>
                      ))}
                      {session.speakers.length > 3 && (
                        <div className={cn(styles.miniAvatar, styles.miniAvatarMore)}>
                          <span className={styles.miniInitials}>+{session.speakers.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-titanium-light leading-tight mt-2">
                            {session.sessionTitle}
                          </h3>
                          {session.awaitingConfirmation ? (
                            <span className={cn(styles.revealingBadge, "mt-2 inline-block")}>Revealing Soon</span>
                          ) : (
                            <p className="text-xs text-titanium-metallic mt-1">
                              {session.speakers.length} Speaker{session.speakers.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="self-start">
                          {session.isOtherSpeakers ? (
                            <div className={cn(styles.dayBadge, styles.otherBadge)}>
                              <span className="text-xs font-bold">SPECIAL</span>
                              <span className="text-lg font-bold">✦</span>
                            </div>
                          ) : (
                            <div className={styles.dayBadge}>
                              <span className="text-xs font-bold">DAY</span>
                              <span className="text-2xl font-bold">{session.sessionNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "grid gap-6 md:gap-12 flex-1",
                      isMobile ? "grid-cols-2" : "grid-cols-9"
                    )}>
                      <div className={cn(
                        isMobile ? "col-span-1 flex items-center justify-center" : "col-span-5 flex items-center justify-center"
                      )}>
                        {session.awaitingConfirmation ? (
                          <div className={styles.awaitingContainer}>
                            <div className={styles.awaitingIcon}>
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                              </svg>
                            </div>
                            <p className={styles.awaitingText}>Revealing Soon</p>
                          </div>
                        ) : (
                          <div className={cn(
                            styles.speakersGrid,
                            session.speakers.length === 1 && styles.singleSpeaker,
                            session.speakers.length === 2 && styles.twoSpeakers,
                            session.speakers.length >= 3 && styles.multiSpeakers
                          )}>
                            {session.speakers.map((speaker, idx) => (
                              <div key={idx} className={styles.speakerCard}>
                                <div className={styles.speakerAvatar}>
                                  {speaker.photo ? (
                                    <img src={speaker.photo} alt={speaker.name} className={styles.speakerPhoto} />
                                  ) : (
                                    <span className={styles.speakerInitials}>{getInitials(speaker.name)}</span>
                                  )}
                                </div>
                                <div className={styles.speakerInfo}>
                                  <h4 className={styles.speakerName}>{speaker.name}</h4>
                                  <p className={styles.speakerOrg}>{speaker.organization}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        isMobile ? "col-span-1 flex flex-col justify-between overflow-y-auto" : "col-span-4 flex flex-col justify-between"
                      )}>
                        <div className={cn("space-y-3", isMobile && "space-y-2")}>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-px flex-1 bg-linear-to-r from-titanium-silver/50 to-transparent" />
                              <span className="text-xs text-titanium-silver/70 uppercase tracking-wider">Topic</span>
                            </div>
                            <h4 className="text-xl md:text-lg font-bold text-titanium-bright mb-1">
                              {session.topic.title}
                            </h4>
                            <p className="text-base md:text-xs text-titanium-metallic leading-relaxed">
                              {session.topic.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-titanium-silver/10">
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(
        "absolute bottom-8 flex items-center gap-2 text-titanium-silver/50 text-sm",
        isMobile ? "left-1/2 transform -translate-x-1/2" : "right-8"
      )}>
        <span>{isMobile ? "Scroll down to explore" : "Scroll to explore"}</span>
        <svg className={cn("w-6 h-6", isMobile ? "animate-bounce" : "animate-bounce-x")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobile ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M9 5l7 7-7 7"} />
        </svg>
      </div>
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-titanium-charcoal border border-titanium-silver/20 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              {selectedSession.isOtherSpeakers ? (
                <div className={cn(styles.dayBadge, styles.otherBadge)}>
                  <span className="text-xs font-bold">SPECIAL</span>
                  <span className="text-xl font-bold">✦</span>
                </div>
              ) : (
                <div className={styles.dayBadge}>
                  <span className="text-xs font-bold">DAY</span>
                  <span className="text-2xl font-bold">{selectedSession.sessionNumber}</span>
                </div>
              )}
              <button
                onClick={() => setSelectedSession(null)}
                className="text-titanium-silver hover:text-titanium-light"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h3 className="text-xl font-bold text-titanium-light leading-tight mb-2">
              {selectedSession.sessionTitle}
            </h3>

            <div className="space-y-4 pb-4 overflow-y-auto max-h-[65vh]">
              <div>
                <h4 className="text-lg font-bold text-titanium-bright mb-1">Topic</h4>
                <p className="text-sm text-titanium-metallic leading-relaxed">{selectedSession.topic.title}</p>
                <p className="text-sm text-titanium-metallic leading-relaxed mt-2">{selectedSession.topic.description}</p>
              </div>

              <div>
                <h4 className="text-lg font-bold text-titanium-bright mb-3">
                  {selectedSession.awaitingConfirmation ? "Speakers" : `Speakers (${selectedSession.speakers.length})`}
                </h4>
                {selectedSession.awaitingConfirmation ? (
                  <p className={styles.revealingBadge}>Revealing Soon</p>
                ) : (
                  <div className={styles.modalSpeakersGrid}>
                    {selectedSession.speakers.map((speaker, idx) => (
                      <div key={idx} className={styles.modalSpeakerCard}>
                        <div className={styles.modalSpeakerAvatar}>
                          <span className={styles.speakerInitials}>{getInitials(speaker.name)}</span>
                        </div>
                        <div>
                          <h5 className="text-titanium-light font-semibold text-sm">{speaker.name}</h5>
                          <p className="text-titanium-metallic text-xs">{speaker.title}</p>
                          <p className="text-titanium-silver/60 text-xs">{speaker.organization}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-titanium-bright mb-1">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.topic.tags.map((tag) => (
                    <span key={tag} className="text-sm text-titanium-silver/50">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
