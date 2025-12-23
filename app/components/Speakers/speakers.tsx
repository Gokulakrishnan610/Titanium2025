"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Linkedin, Twitter } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const speakers = [
  {
    name: "Dr. Sarah Chen",
    title: "Chief AI Officer",
    company: "TechCorp Global",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    topic: "The Future of Generative AI",
  },
  {
    name: "Marcus Johnson",
    title: "VP of Engineering",
    company: "CloudScale Inc",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    topic: "Scaling Infrastructure for Billions",
  },
  {
    name: "Elena Rodriguez",
    title: "Security Researcher",
    company: "CyberDefense Labs",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    topic: "Zero Trust Architecture",
  },
  {
    name: "David Kim",
    title: "Founder & CEO",
    company: "QuantumLeap",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    topic: "Quantum Computing Revolution",
  },
  {
    name: "Priya Sharma",
    title: "Head of Product",
    company: "MetaVerse Labs",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    topic: "Building the Spatial Web",
  },
  {
    name: "James Wright",
    title: "Distinguished Engineer",
    company: "OpenSource Foundation",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    topic: "Open Source at Scale",
  },
];

export default function Speakers() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section header animation
      gsap.fromTo(
        ".speakers-header",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".speakers-header",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Speaker cards animation
      gsap.set(".speaker-card", { opacity: 0, y: 30 });
      
      gsap.to(".speaker-card", {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".speakers-grid",
          start: "top 85%",
          end: "bottom 15%",
          scrub: 1,
          toggleActions: "play reverse play reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="speakers"
      className="relative py-32 bg-titanium-rich overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="speakers-header text-center mb-16">
          <span className="inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
            Learn from the Best
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-titanium-gradient">Eminent</span>{" "}
            <span className="text-titanium-light">Speakers</span>
          </h2>
          <p className="text-titanium-metallic text-lg max-w-2xl mx-auto">
            World-renowned experts sharing insights that will shape the future of technology
          </p>
        </div>

        {/* Speakers Grid */}
        <div className="speakers-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {speakers.map((speaker) => (
            <div
              key={speaker.name}
              className="speaker-card group titanium-card rounded-2xl overflow-hidden"
            >
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden">
                <img
                  src={speaker.image}
                  alt={speaker.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-titanium-black via-transparent to-transparent" />
                
                {/* Social Links */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-titanium-charcoal/80 backdrop-blur-sm flex items-center justify-center text-titanium-silver hover:text-titanium-white hover:bg-titanium-silver/20 transition-all duration-300"
                  >
                    <Twitter size={18} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-titanium-charcoal/80 backdrop-blur-sm flex items-center justify-center text-titanium-silver hover:text-titanium-white hover:bg-titanium-silver/20 transition-all duration-300"
                  >
                    <Linkedin size={18} />
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-titanium-white mb-1">
                  {speaker.name}
                </h3>
                <p className="text-titanium-silver text-sm mb-2">
                  {speaker.title}
                </p>
                <p className="text-titanium-metallic text-sm mb-4">
                  {speaker.company}
                </p>
                <div className="pt-4 border-t border-titanium-silver/10">
                  <span className="text-xs font-mono text-titanium-metallic uppercase tracking-wider">
                    Speaking on
                  </span>
                  <p className="text-titanium-light mt-1">{speaker.topic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <a
            href="#"
            className="btn-secondary px-8 py-4 rounded-full text-base font-semibold inline-block"
          >
            View All Speakers
          </a>
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}
