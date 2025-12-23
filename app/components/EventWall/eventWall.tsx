"use client"

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import styles from './eventWall.module.css'

gsap.registerPlugin(ScrollTrigger)

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const images = Array.from({ length: 75 }).map((_, i) => {
  const seed = i + 1;
  return {
    id: i,
    src: `https://images.unsplash.com/photo-${[
      '1540575467063-17e6fc3a62f8', 
      '1511578314322-379afb0725f0', 
      '1492684223066-81342ee5ff30', 
      '1501281668745-13bc6a60fe3d',
      '1531482615713-2afd69097998', 
      '1470225620780-dba8ba36b745', 
      '1514525253440-b393452e3383', 
      '1496337589254-7e19d01c9a5c', 
      '1523580494863-6f3031224c94',
      '1505373876426-413fe4619220'
    ][i % 10]}?auto=format&fit=crop&w=800&q=80`,
    alt: `Event Image ${i + 1}`,
    yOffset: ((seededRandom(seed * 123.45) * 700) - 350).toFixed(3),
    scale: (0.6 + (seededRandom(seed * 678.90) * 0.6)).toFixed(3),
    zIndex: Math.floor(seededRandom(seed * 321.54) * 10),
    marginRight: (50 + seededRandom(seed * 987.65) * 200).toFixed(3)
  }
})

const EventWall = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const wrapper = wrapperRef.current
    const svg = svgRef.current

    if (!container || !wrapper || !svg) return

    const totalWidth = wrapper.scrollWidth
    const viewportWidth = window.innerWidth

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${totalWidth}`, 
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    })

    tl.to(wrapper, {
      x: () => -(totalWidth - viewportWidth),
      ease: "none",
      duration: 1
    })

    tl.to(container, {
        backgroundColor: "#ffffff",
        ease: "none",
        duration: 0.4
    }, 0.1)
    .to(container, {
        backgroundColor: "#000000",
        ease: "none",
        duration: 0.4
    }, 0.6) 


    const paths = svg.querySelectorAll('path')
    tl.to(paths, {
        stroke: "#000000",
        ease: "none",
        duration: 0.4
    }, 0.1)
    .to(paths, {
        stroke: "#ffffff",
        ease: "none",
        duration: 0.4
    }, 0.6)

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <div ref={containerRef} className={styles.container}>
      <div 
        ref={wrapperRef} 
        className={styles.wrapper}
      >
        <div className={styles.introText}>
            <h2 className={styles.heading}>
                Event <br/>
                <span className={styles.subHeading}>Wall</span> <br/>
                2026
            </h2>
            <p className={styles.description}>
                A collection of events.
            </p>
        </div>

        {images.map((img) => (
            <div 
                key={img.id}
                className={styles.imageWrapper}
                style={{
                    transform: `translateY(${img.yOffset}px) scale(${img.scale})`, // Removed rotate
                    zIndex: img.zIndex,
                    marginRight: `${img.marginRight}px`
                }}
            >
                <div className={styles.card}>
                    <div className={styles.imageInner}>
                        <Image 
                            src={img.src} 
                            alt={img.alt}
                            fill
                            className={styles.image}
                        />
                    </div>
                </div>
                <span className={styles.label}>
                    EVENT_ID_{img.id.toString().padStart(3, '0')}
                </span>
            </div>
        ))}
        
         <div className={styles.outroText}>
            <h3 className={styles.outroHeading}>
                Join the next one.
            </h3>
        </div>
      </div>
      
      <div className={styles.background}>
         <svg ref={svgRef} className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 50 Q 25 25 50 50 T 100 50" stroke="white" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke"/>
            <path d="M0 30 Q 25 55 50 30 T 100 30" stroke="white" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke"/>
            <path d="M0 70 Q 25 45 50 70 T 100 70" stroke="white" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke"/>
         </svg>
      </div>
    </div>
  )
}

export default EventWall