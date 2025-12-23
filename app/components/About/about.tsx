"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Globe, Users, Calendar, Mic } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Users, value: "10,000+", label: "Attendees" },
  { icon: Globe, value: "50+", label: "Countries" },
  { icon: Calendar, value: "100+", label: "Events" },
  { icon: Mic, value: "80+", label: "Speakers" },
];

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-title",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-title",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ".about-description",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-description",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ".stat-card",
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".stats-grid",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );


      stats.forEach((stat, index) => {
        const numericValue = parseInt(stat.value.replace(/[^0-9]/g, ""));
        gsap.fromTo(
          `.stat-value-${index}`,
          { innerText: 0 },
          {
            innerText: numericValue,
            duration: 2,
            ease: "power2.out",
            snap: { innerText: 1 },
            scrollTrigger: {
              trigger: `.stat-value-${index}`,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
            onUpdate: function () {
              const target = document.querySelector(`.stat-value-${index}`);
              if (target) {
                const currentValue = Math.round(
                  gsap.getProperty(this.targets()[0], "innerText") as number
                );
                target.textContent = currentValue.toLocaleString() + (stat.value.includes("+") ? "+" : "");
              }
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-32 bg-titanium-black overflow-hidden"
    >

      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div>
            <span className="about-title inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
              About The Symposium
            </span>
            <h2 className="about-title text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              <span className="text-titanium-gradient">Redefining</span>
              <br />
              <span className="text-titanium-light">Tech Excellence</span>
            </h2>
            <div className="about-description space-y-6 text-titanium-metallic text-lg leading-relaxed">
              <p>
                TITANIUM 2026 brings together the brightest minds in technology for three days of 
                innovation, collaboration, and breakthrough discoveries. From AI pioneers to 
                cybersecurity experts, this is where the future takes shape.
              </p>
              <p>
                Experience world-class hackathons, capture-the-flag competitions, hands-on workshops, 
                and keynotes from industry titans. Whether you&apos;re a developer, entrepreneur, or 
                tech enthusiast, TITANIUM is your gateway to what&apos;s next.
              </p>
            </div>

 
            <div className="about-description flex flex-wrap gap-3 mt-8">
              {["Hackathon", "CTF", "AI Summit", "Web3", "DevOps", "Security"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-titanium-silver/20 text-titanium-light bg-titanium-charcoal/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>


          <div className="stats-grid grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="stat-card titanium-card rounded-2xl p-8 text-center group"
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-titanium-charcoal border border-titanium-silver/10 flex items-center justify-center group-hover:border-titanium-silver/30 transition-colors duration-300">
                  <stat.icon size={28} className="text-titanium-silver" />
                </div>
                <div className={`stat-value-${index} text-4xl md:text-5xl font-bold text-titanium-gradient mb-2`}>
                  0
                </div>
                <div className="text-sm text-titanium-metallic uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}
