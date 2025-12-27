"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowRight, Calendar, MapPin, Play } from "lucide-react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const targetDate = new Date("2026-02-12T08:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const ctx = gsap.context(() => {
      // Titanium logo zoom-out animation - starts larger on mobile
      gsap.fromTo(
        ".hero-title",
        { opacity: 0, y: 50, scale: isMobile ? 1.5 : 1.2 },
        { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: "power4.out", delay: 0.3 }
      );

      gsap.fromTo(
        ".hero-tagline",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 1 }
      );

      gsap.fromTo(
        ".hero-badge",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power3.out", delay: 1.3 }
      );

      gsap.fromTo(
        ".countdown-item",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.7)", delay: 1.6 }
      );

      gsap.fromTo(
        ".hero-cta",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power3.out", delay: 2 }
      );


    }, heroRef);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-titanium-black"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/TitaniumBgB.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-titanium-black/60 z-[1]" />

      <div className="absolute inset-0 grid-pattern opacity-50 z-[2]" />

      <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-titanium-silver/5 rounded-full blur-[150px] floating-shape z-[3]" />
      <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-titanium-metallic/5 rounded-full blur-[120px] floating-shape z-[3]" />





      <div className="relative z-10 w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-12">
        {/* Left Side - Aadhi SVG - Hidden on mobile */}
        <div className="hero-badge absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 w-auto max-w-[2000px] pl-8 hidden xl:block">
          <img
            src="/aadhi.svg"
            alt="Aadhi"
            className="w-full h-full opacity-80"
          />
        </div>

        {/* Center - Logo and Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 pt-16 pb-32 sm:pb-40 md:pb-48 lg:pt-0 lg:pb-0">
          {/* <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-titanium-silver/20 bg-titanium-charcoal/50 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-titanium-silver animate-pulse" />
            <span className="text-sm text-titanium-metallic font-mono">International TECH SYMPOSIUM</span>
          </div> */}

          <div className="hero-title mb-4 sm:mb-6 overflow-hidden">
            <img
              src="/titanium-logo1.png"
              alt="TITANIUM"
              className="w-[280px] sm:w-[350px] md:w-[450px] lg:w-[500px] h-auto mx-auto"
            />
          </div>

          <p className="hero-tagline text-base sm:text-lg md:text-xl lg:text-2xl text-titanium-light/80 max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 font-light px-2">
            International Level Technical Symposium
          </p>


          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
            <div className="hero-badge flex items-center justify-center gap-2 text-titanium-metallic">
              <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm font-mono">FEBRUARY 12-14, 2026</span>
            </div>
            <div className="hero-badge flex items-center justify-center gap-2 text-titanium-metallic">
              <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm font-mono">REC, CHENNAI</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="#register"
              className="hero-cta btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 group"
            >
              Register Now
              <ArrowRight
                size={16}
                className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform duration-300"
              />
            </a>
            <button className="hero-cta btn-secondary px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2">
              <Play size={16} className="sm:w-[18px] sm:h-[18px]" />
              Watch Teaser
            </button>
          </div>
        </div>

        {/* Right Side - Vertical Timer - Desktop only */}
        <div className="absolute right-4 lg:right-20 top-1/2 -translate-y-1/2 lg:pr-32 hidden lg:block">
          <div className="flex flex-col gap-3 lg:gap-4">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Minutes", value: countdown.minutes },
              { label: "Seconds", value: countdown.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="countdown-item flex flex-col items-center p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-titanium-charcoal/50 border border-titanium-silver/10 backdrop-blur-sm min-w-[80px] lg:min-w-[100px]"
              >
                <span className="text-2xl lg:text-4xl font-bold text-titanium-gradient font-mono">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] lg:text-xs text-titanium-metallic uppercase tracking-wider mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Timer - Below Content */}
        <div className="lg:hidden absolute bottom-8 sm:bottom-16 left-1/2 -translate-x-1/2 w-full px-4 sm:px-6">
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Sec", value: countdown.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="countdown-item flex flex-col items-center p-2 sm:p-3 rounded-lg sm:rounded-xl bg-titanium-charcoal/50 border border-titanium-silver/10 backdrop-blur-sm min-w-[60px] sm:min-w-[70px]"
              >
                <span className="text-lg sm:text-2xl font-bold text-titanium-gradient font-mono">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-xs text-titanium-metallic uppercase tracking-wider mt-0.5 sm:mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 hidden sm:flex">
        <span className="text-[10px] sm:text-xs text-titanium-metallic uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-titanium-silver/50 to-transparent" />
      </div>
    </section>
  );
}
