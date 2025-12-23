"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Clock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const scheduleData = {
  "Day 1": {
    date: "February 15, 2026",
    events: [
      { time: "08:00 AM", title: "Registration & Check-in", location: "Main Lobby", type: "general" },
      { time: "09:30 AM", title: "Opening Ceremony", location: "Grand Ballroom", type: "keynote" },
      { time: "10:30 AM", title: "Keynote: The Future of AI", location: "Grand Ballroom", type: "keynote" },
      { time: "12:00 PM", title: "Networking Lunch", location: "Garden Terrace", type: "break" },
      { time: "02:00 PM", title: "HackTitan Kickoff", location: "Innovation Hub", type: "event" },
      { time: "03:00 PM", title: "Workshop: AI Applications", location: "Room A1", type: "workshop" },
      { time: "05:00 PM", title: "Panel: Tech Leadership", location: "Conference Hall", type: "panel" },
      { time: "07:00 PM", title: "Welcome Dinner", location: "Rooftop Lounge", type: "social" },
    ],
  },
  "Day 2": {
    date: "February 16, 2026",
    events: [
      { time: "09:00 AM", title: "Morning Yoga & Wellness", location: "Garden", type: "social" },
      { time: "10:00 AM", title: "CyberFortress CTF Begins", location: "Security Wing", type: "event" },
      { time: "10:30 AM", title: "Workshop: Kubernetes Security", location: "Room B2", type: "workshop" },
      { time: "12:30 PM", title: "Lunch Break", location: "Food Court", type: "break" },
      { time: "02:00 PM", title: "Startup Pitch Competition", location: "Pitch Arena", type: "event" },
      { time: "04:00 PM", title: "Workshop: Web3 Development", location: "Room C3", type: "workshop" },
      { time: "06:00 PM", title: "Tech Talks: Lightning Round", location: "Main Stage", type: "keynote" },
      { time: "08:00 PM", title: "Gaming Night", location: "Gaming Zone", type: "social" },
    ],
  },
  "Day 3": {
    date: "February 17, 2026",
    events: [
      { time: "09:00 AM", title: "HackTitan Final Submissions", location: "Innovation Hub", type: "event" },
      { time: "10:00 AM", title: "Workshop: System Design", location: "Room A1", type: "workshop" },
      { time: "12:00 PM", title: "Farewell Lunch", location: "Grand Terrace", type: "break" },
      { time: "02:00 PM", title: "Project Demonstrations", location: "Expo Hall", type: "event" },
      { time: "04:00 PM", title: "Awards Ceremony", location: "Grand Ballroom", type: "keynote" },
      { time: "05:30 PM", title: "Closing Keynote", location: "Grand Ballroom", type: "keynote" },
      { time: "06:30 PM", title: "Closing Ceremony", location: "Grand Ballroom", type: "keynote" },
      { time: "08:00 PM", title: "After Party", location: "Sky Lounge", type: "social" },
    ],
  },
};

type DayKey = keyof typeof scheduleData;

export default function Schedule() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState<DayKey>("Day 1");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".schedule-header",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".schedule-header",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        ".timeline-item",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".timeline-container",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".timeline-item",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, stagger: 0.05, duration: 0.4, ease: "power3.out" }
    );
  }, [activeDay]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "keynote":
        return "bg-titanium-silver/20 text-titanium-white border-titanium-silver/40";
      case "workshop":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "event":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "panel":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      case "social":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "break":
        return "bg-titanium-charcoal text-titanium-metallic border-titanium-charcoal";
      default:
        return "bg-titanium-charcoal text-titanium-metallic border-titanium-charcoal";
    }
  };

  return (
    <section
      ref={sectionRef}
      id="schedule"
      className="relative py-32 bg-titanium-black overflow-hidden"
    >
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
        <div className="schedule-header text-center mb-16">
          <span className="inline-block text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
            Plan Your Experience
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-titanium-gradient">Event</span>{" "}
            <span className="text-titanium-light">Schedule</span>
          </h2>
          <p className="text-titanium-metallic text-lg max-w-2xl mx-auto">
            Three days of innovation, learning, and networking
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-12">
          {(Object.keys(scheduleData) as DayKey[]).map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeDay === day
                  ? "bg-titanium-silver text-titanium-black"
                  : "bg-titanium-charcoal text-titanium-metallic hover:bg-titanium-dark hover:text-titanium-white"
              }`}
            >
              <span className="block">{day}</span>
              <span className="text-xs opacity-70">{scheduleData[day].date}</span>
            </button>
          ))}
        </div>

        <div className="timeline-container relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-titanium-silver/50 via-titanium-silver/30 to-transparent" />
          <div className="space-y-6">
            {scheduleData[activeDay].events.map((event, index) => (
              <div
                key={`${activeDay}-${index}`}
                className={`timeline-item relative flex gap-6 md:gap-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="absolute left-6 md:left-1/2 w-3 h-3 rounded-full bg-titanium-silver border-4 border-titanium-black transform -translate-x-1/2 mt-6" />

                <div
                  className={`ml-12 md:ml-0 md:w-[calc(50%-3rem)] titanium-card rounded-xl p-5 ${
                    index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  }`}
                >

                  <div className="flex items-center gap-2 text-titanium-silver text-sm font-mono mb-2">
                    <Clock size={14} />
                    {event.time}
                  </div>

                  <h3 className="text-lg font-semibold text-titanium-white mb-2">
                    {event.title}
                  </h3>


                  <div className="flex items-center gap-2 text-titanium-metallic text-sm mb-3">
                    <MapPin size={14} />
                    {event.location}
                  </div>

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTypeStyles(
                      event.type
                    )}`}
                  >
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="text-center mt-16">
          <a
            href="#"
            className="btn-secondary px-8 py-4 rounded-full text-base font-semibold inline-block"
          >
            Download Full Schedule
          </a>
        </div>
      </div>


      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}
