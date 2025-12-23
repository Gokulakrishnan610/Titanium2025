"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const sponsors = {
  platinum: [
    { name: "TechCorp", logo: "TC" },
    { name: "CloudScale", logo: "CS" },
    { name: "MetaVerse Labs", logo: "MV" },
  ],
  gold: [
    { name: "QuantumLeap", logo: "QL" },
    { name: "CyberDefense", logo: "CD" },
    { name: "DataStream", logo: "DS" },
    { name: "NeuralNet", logo: "NN" },
  ],
  silver: [
    { name: "CodeBase", logo: "CB" },
    { name: "DevTools", logo: "DT" },
    { name: "CloudSync", logo: "CS" },
    { name: "APIHub", logo: "AH" },
    { name: "SecureStack", logo: "SS" },
    { name: "DataFlow", logo: "DF" },
  ],
};

export default function Sponsors() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section header animation
      gsap.fromTo(
        ".sponsors-header",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".sponsors-header",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Sponsor tiers animation
      gsap.fromTo(
        ".sponsor-tier",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".sponsors-container",
            start: "top 75%",
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
      id="sponsors"
      className="relative py-32 bg-titanium-rich overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="sponsors-header text-center mb-20">
          <span className="inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
            Backed by Industry Leaders
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-titanium-gradient">Our</span>{" "}
            <span className="text-titanium-light">Sponsors</span>
          </h2>
          <p className="text-titanium-metallic text-lg max-w-2xl mx-auto">
            Partnering with world-class organizations to make TITANIUM 2026 extraordinary
          </p>
        </div>

        <div className="sponsors-container space-y-20">
          {/* Platinum Sponsors */}
          <div className="sponsor-tier">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-mono bg-titanium-silver/10 text-titanium-silver border border-titanium-silver/30">
                Platinum Partners
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {sponsors.platinum.map((sponsor) => (
                <div
                  key={sponsor.name}
                  className="w-64 h-32 titanium-card rounded-2xl flex items-center justify-center group silver-glow-hover"
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold text-titanium-gradient mb-2">
                      {sponsor.logo}
                    </div>
                    <div className="text-titanium-metallic text-sm">{sponsor.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Sponsors */}
          <div className="sponsor-tier">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-mono bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/30">
                Gold Partners
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {sponsors.gold.map((sponsor) => (
                <div
                  key={sponsor.name}
                  className="w-48 h-24 titanium-card rounded-xl flex items-center justify-center group"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-titanium-light mb-1">
                      {sponsor.logo}
                    </div>
                    <div className="text-titanium-metallic text-xs">{sponsor.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Silver Sponsors */}
          <div className="sponsor-tier">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-mono bg-titanium-silver/5 text-titanium-metallic border border-titanium-silver/20">
                Silver Partners
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {sponsors.silver.map((sponsor) => (
                <div
                  key={sponsor.name}
                  className="w-36 h-20 bg-titanium-charcoal/50 border border-titanium-silver/10 rounded-lg flex items-center justify-center hover:border-titanium-silver/30 transition-colors duration-300"
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold text-titanium-metallic">
                      {sponsor.logo}
                    </div>
                    <div className="text-titanium-metallic/60 text-xs">{sponsor.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infinite Marquee */}
        <div className="mt-24 overflow-hidden">
          <div className="flex animate-marquee">
            {[...sponsors.platinum, ...sponsors.gold, ...sponsors.silver, ...sponsors.platinum, ...sponsors.gold, ...sponsors.silver].map(
              (sponsor, index) => (
                <div
                  key={`marquee-${index}`}
                  className="flex-shrink-0 mx-8 text-2xl font-bold text-titanium-charcoal"
                >
                  {sponsor.name}
                </div>
              )
            )}
          </div>
        </div>

        {/* Become a Sponsor CTA */}
        <div className="mt-20 text-center">
          <div className="titanium-card rounded-2xl p-12 max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-titanium-white mb-4">
              Become a Sponsor
            </h3>
            <p className="text-titanium-metallic mb-8 max-w-lg mx-auto">
              Partner with TITANIUM 2026 and connect with 10,000+ tech professionals from around the world
            </p>
            <a
              href="#"
              className="btn-primary px-8 py-4 rounded-full text-base font-semibold inline-block"
            >
              Get Sponsorship Details
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}
