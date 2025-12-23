"use client";

import { ArrowUp, Mail, MapPin, Phone, Twitter, Linkedin, Github, Youtube, Instagram } from "lucide-react";

const footerLinks = {
  "Quick Links": [
    { name: "About", href: "#about" },
    { name: "Speakers", href: "#speakers" },
    { name: "Events", href: "#events" },
    { name: "Workshops", href: "#workshops" },
    { name: "Schedule", href: "#schedule" },
    { name: "Sponsors", href: "#sponsors" },
  ],
  "Resources": [
    { name: "FAQs", href: "#" },
    { name: "Travel Info", href: "#" },
    { name: "Accommodation", href: "#" },
    { name: "Visa Support", href: "#" },
    { name: "Code of Conduct", href: "#" },
    { name: "Press Kit", href: "#" },
  ],
  "Legal": [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Refund Policy", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-titanium-black overflow-hidden">

      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

      <div className="border-b border-titanium-silver/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-titanium-white mb-2">
                Stay Updated
              </h3>
              <p className="text-titanium-metallic">
                Get the latest news, announcements, and exclusive offers.
              </p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 lg:w-80 px-5 py-3 rounded-full bg-titanium-charcoal border border-titanium-silver/20 text-titanium-white placeholder:text-titanium-metallic focus:outline-none focus:border-titanium-silver/50 transition-colors"
              />
              <button className="btn-primary px-6 py-3 rounded-full font-semibold whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
 
          <div className="lg:col-span-2">
            <div className="mb-6">
              <span className="text-3xl font-bold tracking-tight text-titanium-gradient">
                TITANIUM
              </span>
              <span className="text-sm font-mono text-titanium-metallic ml-2">2026</span>
            </div>
            <p className="text-titanium-metallic mb-6 max-w-sm leading-relaxed">
              The world&apos;s premier technology symposium bringing together innovators, 
              developers, and industry leaders from across the globe.
            </p>

            <div className="space-y-3">
              <a href="mailto:info@titanium2026.com" className="flex items-center gap-3 text-titanium-metallic hover:text-titanium-white transition-colors">
                <Mail size={16} />
                <span>info@titanium2026.com</span>
              </a>
              <a href="tel:+14155551234" className="flex items-center gap-3 text-titanium-metallic hover:text-titanium-white transition-colors">
                <Phone size={16} />
                <span>+1 (415) 555-1234</span>
              </a>
              <div className="flex items-start gap-3 text-titanium-metallic">
                <MapPin size={16} className="flex-shrink-0 mt-1" />
                <span>Rajalakshmi Engineering College, Thandalam, Chennai</span>
              </div>
            </div>

    
            <div className="flex gap-3 mt-8">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-titanium-charcoal border border-titanium-silver/10 flex items-center justify-center text-titanium-metallic hover:text-titanium-white hover:border-titanium-silver/30 transition-all duration-300"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>


          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-titanium-white font-semibold mb-6">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-titanium-metallic hover:text-titanium-white transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

 
      <div className="border-t border-titanium-silver/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-titanium-metallic text-sm text-center md:text-left">
              © 2026 TITANIUM. All rights reserved. Made with passion for tech.
            </p>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-titanium-metallic hover:text-titanium-white transition-colors duration-300"
            >
              <span className="text-sm">Back to top</span>
              <div className="w-8 h-8 rounded-full border border-titanium-silver/30 flex items-center justify-center hover:bg-titanium-silver/10 transition-colors">
                <ArrowUp size={16} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
