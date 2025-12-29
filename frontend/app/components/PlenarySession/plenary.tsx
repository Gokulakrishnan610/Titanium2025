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
        photo: "/Plenary/ShankarVenugopal.png",
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
        photo: "/Plenary/PareshPatel.jpg",
      },
      {
        name: "Dinesh Arjun",
        title: "CEO and Co-Founder",
        organization: "Raptee",
        photo: "/Plenary/dineshArjun.png",
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
        photo: "/Plenary/SureshSampath.jpeg",
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
        photo: "/Plenary/BruceGale.jpg",
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
        photo: "/Plenary/srihari.png",
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

        <div className="plenary-header absolute top-8 sm:top-16 md:top-20 left-0 right-0 z-10 px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 md:gap-8 mb-4 sm:mb-4">
            <div>
              <span className="inline-block text-[10px] sm:text-xs md:text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-1 sm:mb-2 md:mb-4">
                Unlock Knowledge
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold">
                <span className="text-titanium-gradient">Plenary</span>{" "}
                <span className="text-titanium-light">Sessions</span>
              </h2>
            </div>
            <p className="text-titanium-metallic text-xs sm:text-sm md:text-lg max-w-xl text-left md:text-right pb-1 hidden sm:block">
              Engage with industry leaders and visionaries as they share insights on the future of technology and innovation.
            </p>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex gap-4 sm:gap-6 md:gap-8 pt-28 sm:pt-32 md:pt-40 lg:pt-48 2xl:pt-64 pb-12 sm:pb-16 md:pb-24 px-3 sm:px-4 md:pl-8 md:pr-8",
            isMobile ? "flex-col items-center" : "items-center",
            styles.scrollContainer
          )}
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "plenary-card w-[calc(100%-8px)] sm:w-[calc(100%-16px)] md:w-[85vw] lg:w-[900px] rounded-xl sm:rounded-2xl overflow-hidden",
                !isMobile && "shrink-0",
                styles.sessionCard
              )}
            >
              <div className="relative w-full h-full bg-linear-to-br from-titanium-charcoal via-titanium-rich to-titanium-black border border-titanium-silver/20 backdrop-blur-xl p-3 sm:p-4 md:p-6 flex flex-col">
                {isMobile ? (
                  <div className="relative flex flex-col w-full p-2 gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm sm:text-base font-bold text-titanium-light leading-snug flex-1 pr-2">
                        {session.sessionTitle}
                      </h3>
                      {session.isOtherSpeakers ? (
                        <span className={cn(styles.dayBadgePill)}>
                          <span className="font-bold">SPECIAL</span> ✦
                        </span>
                      ) : (
                        <span className={cn(styles.dayBadgePill)}>
                          <span className="font-bold">DAY</span> {session.sessionNumber}
                        </span>
                      )}
                    </div>

                    {/* Speaker cards for mobile */}
                    {session.awaitingConfirmation ? (
                      <div className="flex items-center justify-center py-4">
                        <span className={cn(styles.revealingBadge)}>Revealing Soon</span>
                      </div>
                    ) : (
                      <div className={cn(
                        "grid gap-2",
                        session.speakers.length === 1 ? "grid-cols-1" : "grid-cols-2"
                      )}>
                        {session.speakers.slice(0, 4).map((speaker, idx) => (
                          <div key={idx} className={cn(
                            styles.speakerCardMobile,
                            session.speakers.length === 1 && styles.speakerCardMobileSingle
                          )}>
                            <div className={cn(
                              styles.speakerAvatarMobile,
                              session.speakers.length === 1 && styles.speakerAvatarMobileSingle
                            )}>
                              {speaker.photo ? (
                                <img src={speaker.photo} alt={speaker.name} className={styles.speakerPhoto} />
                              ) : (
                                <span className={styles.speakerInitialsMobile}>{getInitials(speaker.name)}</span>
                              )}
                            </div>
                            <div className={styles.speakerInfoMobile}>
                              <h4 className={styles.speakerNameMobile}>{speaker.name}</h4>
                              <p className={styles.speakerOrgMobile}>{speaker.organization}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-titanium-silver/10">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-2.5 py-1 bg-titanium-silver/10 border border-titanium-silver/30 rounded text-titanium-silver hover:bg-titanium-silver/20 transition-colors text-[10px] sm:text-xs"
                      >
                        Know More
                      </button>
                      {!session.awaitingConfirmation && session.speakers.length > 4 && (
                        <span className={cn(styles.speakersBadge, styles.revealingBadgeMobile)}>
                          +{session.speakers.length - 4} more
                        </span>
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
        "absolute bottom-4 sm:bottom-6 md:bottom-8 flex items-center gap-1.5 sm:gap-2 text-titanium-silver/50 text-xs sm:text-sm",
        isMobile ? "left-1/2 transform -translate-x-1/2" : "right-8"
      )}>
        <span>{isMobile ? "Scroll down" : "Scroll to explore"}</span>
        <svg className={cn("w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", isMobile ? "animate-bounce" : "animate-bounce-x")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobile ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M9 5l7 7-7 7"} />
        </svg>
      </div>
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-titanium-charcoal border border-titanium-silver/20 rounded-2xl p-4 sm:p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              {selectedSession.isOtherSpeakers ? (
                <span className={styles.dayBadgePillLarge}>
                  <span className="font-bold">SPECIAL</span> ✦
                </span>
              ) : (
                <span className={styles.dayBadgePillLarge}>
                  <span className="font-bold">DAY</span> {selectedSession.sessionNumber}
                </span>
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
                          {speaker.photo ? (
                            <img src={speaker.photo} alt={speaker.name} className={styles.speakerPhoto} />
                          ) : (
                            <span className={styles.speakerInitials}>{getInitials(speaker.name)}</span>
                          )}
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
