"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Users, Signal, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

const workshops = [
  {
    title: "Building Production-Ready AI Applications",
    instructor: "Dr. Sarah Chen",
    instructorRole: "Chief AI Officer, TechCorp",
    duration: "4 hours",
    level: "Advanced",
    participants: "50 seats",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    topics: ["LLM Fine-tuning", "RAG Systems", "Production Deployment"],
  },
  {
    title: "Kubernetes Security Masterclass",
    instructor: "Elena Rodriguez",
    instructorRole: "Security Researcher, CyberDefense Labs",
    duration: "3 hours",
    level: "Intermediate",
    participants: "40 seats",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop",
    topics: ["Pod Security", "Network Policies", "RBAC"],
  },
  {
    title: "Full-Stack Web3 Development",
    instructor: "Marcus Johnson",
    instructorRole: "VP Engineering, CloudScale",
    duration: "5 hours",
    level: "Intermediate",
    participants: "60 seats",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop",
    topics: ["Smart Contracts", "DApps", "Token Standards"],
  },
  {
    title: "Advanced System Design Patterns",
    instructor: "David Kim",
    instructorRole: "Founder & CEO, QuantumLeap",
    duration: "4 hours",
    level: "Advanced",
    participants: "45 seats",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
    topics: ["Microservices", "Event Sourcing", "CQRS"],
  },
  {
    title: "Cloud Native Architecture",
    instructor: "Priya Sharma",
    instructorRole: "Head of Product, MetaVerse Labs",
    duration: "4 hours",
    level: "Advanced",
    participants: "55 seats",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400&fit=crop",
    topics: ["Serverless", "Containers", "Service Mesh"],
  },
  {
    title: "DevSecOps Pipeline Mastery",
    instructor: "James Wright",
    instructorRole: "Distinguished Engineer, OpenSource Foundation",
    duration: "3 hours",
    level: "Intermediate",
    participants: "45 seats",
    image: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&h=400&fit=crop",
    topics: ["CI/CD Security", "SAST/DAST", "Compliance"],
  },
];

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Workshops() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!isMounted || isMobile) return;

    const section = sectionRef.current;
    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (!section || !trigger || !panel) return;

    const totalWidth = panel.scrollWidth;
    const viewportWidth = window.innerWidth;
    const availableSpace = viewportWidth - (0.35 * viewportWidth); // Account for left sidebar
    
    const tween = gsap.to(panel, {
      x: () => -(totalWidth - availableSpace + 100), // Add extra 100px padding
      ease: "none",
      scrollTrigger: {
        trigger: trigger,
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => `+=${totalWidth - availableSpace + 200}`, // Increase scroll distance
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Simple smooth progress calculation
          setProgress(self.progress * 100);
        },
      },
    });

    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [isMobile, isMounted]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "text-green-400 border-green-400/30";
      case "Intermediate":
        return "text-yellow-400 border-yellow-400/30";
      case "Advanced":
        return "text-red-400 border-red-400/30";
      default:
        return "text-titanium-silver border-titanium-silver/30";
    }
  };

  return (
    <section
      ref={sectionRef}
      id="workshops"
      className="relative bg-titanium-rich"
    >
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />


      {/* Mobile Layout */}
      {isMounted && isMobile ? (
        <div className="py-16 px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
              Hands-On Learning
            </span>
            <h2 className="text-3xl font-bold leading-tight">
              <span className="text-titanium-gradient">Featured</span>{" "}
              <span className="text-titanium-light">Workshops</span>
            </h2>
            <p className="text-titanium-metallic mt-4 max-w-md mx-auto">
              Expert-led sessions designed to transform your skills
            </p>
            <a
              href="#"
              className="btn-secondary px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 w-fit mt-6 mx-auto"
            >
              View All Workshops
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="flex flex-col gap-6">
            {workshops.map((workshop, index) => (
              <div
                key={workshop.title}
                className="workshop-card group titanium-card rounded-2xl overflow-hidden relative"
              >
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-5xl font-bold text-titanium-silver/10 font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative h-44 overflow-hidden">
                  <img
                    src={workshop.image}
                    alt={workshop.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-titanium-charcoal via-transparent to-transparent" />

                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono border ${getLevelColor(
                        workshop.level
                      )} bg-titanium-black/50 backdrop-blur-sm`}
                    >
                      {workshop.level}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-titanium-white mb-2">
                    {workshop.title}
                  </h3>

                  <div className="mb-3">
                    <p className="text-titanium-silver text-sm font-medium">
                      {workshop.instructor}
                    </p>
                    <p className="text-titanium-metallic text-xs">
                      {workshop.instructorRole}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {workshop.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 rounded text-xs bg-titanium-charcoal text-titanium-metallic"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-titanium-silver/10">
                    <div className="flex items-center gap-1 text-titanium-metallic text-sm">
                      <Clock size={14} />
                      {workshop.duration}
                    </div>
                    <div className="flex items-center gap-1 text-titanium-metallic text-sm">
                      <Users size={14} />
                      {workshop.participants}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div ref={triggerRef} className="relative h-screen overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-[35vw] z-20 flex flex-col justify-center px-8 lg:px-16 bg-titanium-rich">
            <div className="absolute inset-0 grid-pattern opacity-20" />
            <div className="workshops-header relative z-10">
              <span className="inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
                Hands-On Learning
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-titanium-gradient">Featured</span>
                <br />
                <span className="text-titanium-light">Workshops</span>
              </h2>
              <p className="text-titanium-metallic mt-6 max-w-md">
                Expert-led sessions designed to transform your skills
              </p>
              <a
                href="#"
                className="btn-secondary px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 w-fit mt-8"
              >
                View All Workshops
                <ArrowRight size={16} />
              </a>


              <div className="mt-12 w-48">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-titanium-metallic font-mono">01</span>
                  <span className="text-xs text-titanium-metallic font-mono">
                    {String(workshops.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="h-1 bg-titanium-charcoal rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-titanium-metallic to-titanium-silver rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div 
            className="absolute left-[35vw] top-0 h-full w-48 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(to right, var(--color-titanium-rich) 0%, var(--color-titanium-rich) 20%, transparent 100%)"
            }}
          />


          <div className="h-full flex items-center pl-[35vw]">
            <div
              ref={panelRef}
              className="flex gap-8 pr-[15vw]"
              style={{ willChange: "transform" }}
            >
            {workshops.map((workshop, index) => (
              <div
                key={workshop.title}
                className="workshop-card group w-[420px] flex-shrink-0 titanium-card rounded-2xl overflow-hidden relative"
              >

                <div className="absolute top-4 right-4 z-10">
                  <span className="text-6xl font-bold text-titanium-silver/10 font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative h-52 overflow-hidden">
                  <img
                    src={workshop.image}
                    alt={workshop.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-titanium-charcoal via-transparent to-transparent" />

                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono border ${getLevelColor(
                        workshop.level
                      )} bg-titanium-black/50 backdrop-blur-sm`}
                    >
                      {workshop.level}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-titanium-white mb-3 line-clamp-2 min-h-[3.5rem]">
                    {workshop.title}
                  </h3>


                  <div className="mb-4">
                    <p className="text-titanium-silver text-sm font-medium">
                      {workshop.instructor}
                    </p>
                    <p className="text-titanium-metallic text-xs">
                      {workshop.instructorRole}
                    </p>
                  </div>


                  <div className="flex flex-wrap gap-2 mb-6">
                    {workshop.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 rounded text-xs bg-titanium-charcoal text-titanium-metallic"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>


                  <div className="flex items-center gap-4 pt-4 border-t border-titanium-silver/10">
                    <div className="flex items-center gap-1 text-titanium-metallic text-sm">
                      <Clock size={14} />
                      {workshop.duration}
                    </div>
                    <div className="flex items-center gap-1 text-titanium-metallic text-sm">
                      <Users size={14} />
                      {workshop.participants}
                    </div>
                    <div className="flex items-center gap-1 text-titanium-metallic text-sm">
                      <Signal size={14} />
                      {workshop.level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>
      )}


      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}
