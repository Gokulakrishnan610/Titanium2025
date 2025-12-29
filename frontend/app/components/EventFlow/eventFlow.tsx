"use client"

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'

gsap.registerPlugin(ScrollTrigger)

const timelineData = [
  {
    day: "Day 1",
    title: "The Awakening",
    items: ["09:00 AM - Registration", "10:00 AM - Opening Ceremony", "11:00 AM - Hacking Begins"],
    position: { top: "5%", left: "60%" },
    align: "right"
  },
  {
    day: "Day 1",
    title: "Deep Focus",
    items: ["02:00 PM - Lunch Break", "04:00 PM - Workshop: AI Agents", "08:00 PM - Dinner & Networking"],
    position: { top: "25%", left: "10%" },
    align: "left"
  },
  {
    day: "Day 2",
    title: "The Grind",
    items: ["12:00 AM - Midnight Snacks", "03:00 AM - Gaming Tournament", "09:00 AM - Breakfast"],
    position: { top: "45%", left: "60%" },
    align: "right"
  },
  {
    day: "Day 2",
    title: "Innovation Peak",
    items: ["02:00 PM - Mentorship Round", "06:00 PM - Tech Talk: Web3", "11:00 PM - Prototype Check"],
    position: { top: "70%", left: "10%" },
    align: "left"
  },
  {
    day: "Day 3",
    title: "Final Countdown",
    items: ["08:00 AM - Final Submissions", "10:00 AM - Pitching Round", "02:00 PM - Closing Ceremony"],
    position: { top: "90%", left: "60%" },
    align: "right"
  }
]

const EventFlow = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const lenis = useLenis()
  const [activeDay, setActiveDay] = useState("Day 1")

  const uniqueDays = Array.from(new Set(timelineData.map(d => d.day)))

  useEffect(() => {
    const container = containerRef.current
    const path = pathRef.current
    const sidebar = sidebarRef.current

    if (!container || !path) return

    // Sidebar visibility
    if (sidebar) {
      gsap.set(sidebar, { autoAlpha: 0, x: 50 })
      
      ScrollTrigger.create({
        trigger: container,
        start: "top center",
        end: "bottom center",
        onEnter: () => gsap.to(sidebar, { autoAlpha: 1, x: 0, duration: 0.5 }),
        onLeave: () => gsap.to(sidebar, { autoAlpha: 0, x: 50, duration: 0.5 }),
        onEnterBack: () => gsap.to(sidebar, { autoAlpha: 1, x: 0, duration: 0.5 }),
        onLeaveBack: () => gsap.to(sidebar, { autoAlpha: 0, x: 50, duration: 0.5 })
      })
    }

    const pathLength = path.getTotalLength()
    
    path.style.strokeDasharray = `${pathLength}`
    path.style.strokeDashoffset = `${pathLength}`

    gsap.to(path, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      }
    })

    itemsRef.current.forEach((item, index) => {
      if (!item) return
      
      gsap.fromTo(item, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      )
    })

    uniqueDays.forEach((day, i) => {
      const idx = timelineData.findIndex(d => d.day === day)
      const el = itemsRef.current[idx]
      if(!el) return

      ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          onEnter: () => setActiveDay(day),
          onLeaveBack: () => {
              if(i > 0) setActiveDay(uniqueDays[i-1])
          }
      })
    })


    ScrollTrigger.create({
        trigger: container,
        start: "bottom bottom",
        onEnter: () => setActiveDay(uniqueDays[uniqueDays.length - 1])
    })

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  const handleTabClick = (day: string) => {
    const index = timelineData.findIndex(d => d.day === day)
    if (index !== -1 && itemsRef.current[index] && lenis) {
        lenis.scrollTo(itemsRef.current[index], { offset: -100 })
    }
  }

  return (
    <div ref={containerRef} className="relative w-full mx-auto overflow-hidden pb-40">
       <div ref={sidebarRef} className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 hidden md:flex opacity-0 invisible">
          {uniqueDays.map(day => (
              <button 
                  key={day}
                  onClick={() => handleTabClick(day)}
                  className={`
                      px-6 py-3 font-bold text-lg border-4 border-black transition-all duration-200 rounded-xl
                      ${activeDay === day 
                          ? 'bg-[#bef264] text-black shadow-none translate-x-[4px] translate-y-[4px]' 
                          : 'bg-white text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]'
                      }
                  `}
              >
                  {day}
              </button>
          ))}
       </div>

       <div className="w-full pointer-events-none z-0">
          <svg 
            viewBox="0 0 1517 2316" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path 
              ref={pathRef}
              d="M1092.2 90.5191C1112.7 101.019 373.699 312.019 396.199 574.019C418.698 836.019 1248.39 698.906 1401.7 945.019C1555 1191.13 939.199 1698.52 631.699 1807.02C324.199 1915.52 -111.801 1664.02 195.199 1240.02C302.001 1092.51 569.829 992.542 815.699 1272.52C1061.57 1552.5 1247.7 2331.52 1227.2 2213.02" 
              stroke="#AD95CA" 
              strokeWidth="160" 
              strokeLinecap="round"
            />
          </svg>
       </div>

       {timelineData.map((item, index) => (
         <div 
           key={index}
           ref={el => { itemsRef.current[index] = el }}
           className={`absolute z-10 p-6 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl max-w-sm w-full ${item.align === 'right' ? 'text-right' : 'text-left'}`}
           style={{ top: item.position.top, left: item.position.left }}
         >
            <span className="text-lime-400 font-mono text-sm tracking-wider uppercase mb-2 block">{item.day}</span>
            <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
            <ul className={`space-y-2 ${item.align === 'right' ? 'items-end' : 'items-start'} flex flex-col`}>
              {item.items.map((subItem, i) => (
                <li key={i} className="text-zinc-400 text-sm flex items-center gap-2">
                  {item.align === 'left' && <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>}
                  {subItem}
                  {item.align === 'right' && <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>}
                </li>
              ))}
            </ul>
         </div>
       ))}
    </div>
  )
}

export default EventFlow