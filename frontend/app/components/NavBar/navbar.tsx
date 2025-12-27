"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Speakers", href: "#speakers" },
  { name: "Events", href: "#events" },
  { name: "Workshops", href: "#workshops" },
  { name: "Schedule", href: "#schedule" },
  // { name: "Sponsors", href: "#sponsors" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const plenaryEl = document.querySelector(".plenarySection");
    if (!plenaryEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(navRef.current, { y: "-100%", duration: 0.5, ease: "power2.out" });
          } else {
            gsap.to(navRef.current, { y: "0%", duration: 0.5, ease: "power2.out" });
          }
        });
      },
      { root: null, threshold: 0.05 }
    );
    observer.observe(plenaryEl);
    const scrollHandler = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", scrollHandler);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".nav-item",
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 will-change-transform ${
          isScrolled
            ? "bg-titanium-black/90 backdrop-blur-xl border-b border-titanium-silver/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="#" className="nav-item flex items-center gap-2">
              <img 
                src="/rec.png" 
                alt="REC Logo" 
                className="h-16 w-auto"
              />
            </a>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="nav-item text-sm text-titanium-metallic hover:text-titanium-white transition-colors duration-300 relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-titanium-silver group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

 
            <div className="hidden lg:block">
              <a
                href="#register"
                className="nav-item btn-primary px-6 py-2.5 rounded-full text-sm font-semibold inline-block"
              >
                Register Now
              </a>
            </div>


            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-titanium-silver hover:text-titanium-white transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-titanium-black/98 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-3xl font-light text-titanium-light hover:text-titanium-white transition-colors duration-300"
              style={{
                transitionDelay: isMobileMenuOpen ? `${index * 50}ms` : "0ms",
                transform: isMobileMenuOpen ? "translateY(0)" : "translateY(20px)",
                opacity: isMobileMenuOpen ? 1 : 0,
              }}
            >
              {link.name}
            </a>
          ))}
          <a
            href="#register"
            className="btn-primary px-8 py-3 rounded-full text-lg font-semibold mt-4"
          >
            Register Now
          </a>
        </div>
      </div>
    </>
  );
}
