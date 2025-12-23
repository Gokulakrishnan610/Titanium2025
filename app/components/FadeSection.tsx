"use client"

import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface FadeSectionProps {
  children: React.ReactNode
  className?: string
}

const FadeSection = ({ children, className = "" }: FadeSectionProps) => {
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      // Entry Animation (stable window)
      gsap.fromTo(el, 
        { 
          opacity: 0,
          y: 60,
          filter: "blur(12px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "top 30%",
            scrub: 0.6,
            fastScrollEnd: true,
            invalidateOnRefresh: true,
            immediateRender: false,
          }
        }
      )

      // Exit Animation (keep visible until near exit)
      gsap.to(el, {
        opacity: 0,
        y: -60,
        filter: "blur(12px)",
        duration: 1,
        ease: "power2.in",
        scrollTrigger: {
          trigger: el,
          start: "bottom 80%",
          end: "bottom 10%",
          scrub: 0.6,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          immediateRender: false,
        }
      })
    }, elRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={elRef} className={className}>
      {children}
    </div>
  )
}

export default FadeSection
