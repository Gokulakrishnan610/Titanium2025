'use client'

import { useRef, useLayoutEffect, useState, useEffect } from 'react'
import styles from './scrollMask.module.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from '../Hero/hero'

gsap.registerPlugin(ScrollTrigger)

const ScrollMask = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroMainRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const hero1ContainerRef = useRef<HTMLDivElement>(null)
  const textLogoRef = useRef<HTMLDivElement>(null)
  const heroTextRef = useRef<HTMLHeadingElement>(null)
  const hero2ContainerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Initial animation on load
      gsap.from(heroMainRef.current, {
        scale: 1.45,
        duration: 2.8,
        ease: "power3.out",
      })

      // Main scroll timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          scrub: 2,
          pin: true,
          start: "top top",
          end: "+=3000",
        },
      })

      // Set initial scale
      tl.set(heroMainRef.current, { scale: 1.25 })

      // Scale down the main container
      tl.to(heroMainRef.current, { scale: 1, duration: 1 })

      // Fade out hero content
      tl.to(heroContentRef.current, { opacity: 0, duration: 0.9 }, "<")

      // Shrink background logo size - only on desktop
      if (!isMobile) {
        tl.to(heroMainRef.current, { backgroundSize: "35vh", duration: 1.5 }, "<+=0.2")
      }

      // On mobile, fade in the textLogo earlier and smoother
      if (isMobile) {
        tl.fromTo(textLogoRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.5 },
          "<+=0.5"
        )
      }

      // Animate the "Coming" text gradient
      tl.fromTo(heroTextRef.current,
        {
          backgroundImage: `radial-gradient(
            circle at 50% 200vh,
            rgba(255, 212, 129, 0) 0,
            rgba(238, 70, 106, 0.5) 90vh,
            rgba(126, 35, 103, 0.8) 120vh,
            rgba(32, 31, 66, 0) 150vh
          )`,
        },
        {
          backgroundImage: `radial-gradient(
            circle at 50% 56.9247vh, 
            rgb(255, 212, 129) 0vh,
            rgb(238, 70, 106) 50vh,
            rgb(126, 35, 103) 90vh,
            rgba(32, 31, 66, 0) 125.854vh
          )`,
          duration: 3,
        },
        isMobile ? "<0.5" : "<1.2"
      )

      // Fade in the logo overlay - desktop only (mobile already handled above)
      if (!isMobile) {
        tl.fromTo(textLogoRef.current,
          {
            opacity: 0,
            maskImage: `radial-gradient(circle at 50% 145.835%, rgb(0, 0, 0) 36.11%, rgba(0, 0, 0, 0) 68.055%)`,
          },
          {
            opacity: 1,
            maskImage: `radial-gradient(circle at 50% 105.594%, rgb(0, 0, 0) 62.9372%, rgba(0, 0, 0, 0) 81.4686%)`,
            duration: 3,
          },
          "<0.2"
        )
      }

      // Hide main container
      tl.set(heroMainRef.current, { opacity: 0 })

      // Scale down hero-1-container
      tl.to(hero1ContainerRef.current, { scale: 0.85, duration: 3 }, "<-=3")

      // Set mask for transition
      tl.set(hero1ContainerRef.current, {
        maskImage: `radial-gradient(circle at 50% 16.1137vh, rgb(0, 0, 0) 96.1949vh, rgba(0, 0, 0, 0) 112.065vh)`,
      }, "<+=2.1")

      // Animate mask out
      tl.to(hero1ContainerRef.current, {
        maskImage: `radial-gradient(circle at 50% -40vh, rgb(0, 0, 0) 0vh, rgba(0, 0, 0, 0) 80vh)`,
        duration: 2,
      }, "<+=0.2")

      // Fade out logo
      tl.to(textLogoRef.current, { opacity: 0, duration: 2 }, "<1.5")

      // Hide hero-1 and show hero-2
      tl.set(hero1ContainerRef.current, { opacity: 0 })
      tl.set(hero2ContainerRef.current, { visibility: "visible" })

      // Fade in hero-2
      tl.to(hero2ContainerRef.current, { opacity: 1, duration: 3 }, "<+=0.2")

      // Animate hero-2 gradient
      tl.fromTo(hero2ContainerRef.current,
        {
          backgroundImage: `radial-gradient(
            circle at 50% 200vh,
            rgba(197, 197, 196, 0) 0,
            rgba(138, 138, 138, 0.5) 90vh,
            rgba(138, 138, 138, 0.8) 120vh,
            rgba(0, 0, 0, 0) 150vh
          )`,
        },
        {
          backgroundImage: `radial-gradient(
            circle at 50% 3.9575vh, 
            rgb(255, 255, 255) 0vh,
            rgb(197, 197, 196) 50.011vh,
            rgb(138, 138, 138) 90.0183vh,
            rgba(0, 0, 0, 0) 140.599vh
          )`,
          duration: 3,
        },
        "<1.2"
      )
    }, containerRef)

    return () => ctx.revert()
  }, [isMobile])

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Hero 1 Container */}
      <div ref={hero1ContainerRef} className={styles.hero1Container}>
        {/* Main container with logo background */}
        <div ref={heroMainRef} className={styles.heroMainContainer}>
          {/* Hero content overlay */}
          <div ref={heroContentRef} className={styles.heroContent}>
            <Hero />
          </div>
        </div>

        {/* Text and Logo overlay */}
        <div className={styles.heroTextLogoContainer}>
          {/* <div ref={textLogoRef} className={styles.heroTextLogo}></div> */}
          <div>
            <h3 ref={heroTextRef} className={styles.heroText}>
              Coming
              <br />
              FEBRUARY 12
              <br />
              2026
            </h3>
          </div>
        </div>
      </div>

      {/* Hero 2 Container - Tagline */}
      <div ref={hero2ContainerRef} className={styles.hero2Container}>
        <h3>&ldquo;It isn&apos;t just a symposium&rdquo;</h3>
        <p>
          It&apos;s a <span className={styles.highlight}>Revolution</span> — where innovation meets inspiration,
          and the brightest minds come together to shape the future of technology.
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className={styles.scrollIndicator}>
        <svg width="34" height="14" viewBox="0 0 34 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M33.5609 1.54346C34.0381 2.5875 33.6881 3.87821 32.7791 4.42633L17.0387 13.9181L1.48663 4.42115C0.580153 3.86761 0.235986 2.57483 0.717909 1.53365C1.19983 0.492464 2.32535 0.097152 3.23182 0.650692L17.0497 9.08858L31.051 0.64551C31.96 0.0973872 33.0837 0.499411 33.5609 1.54346Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  )
}

export default ScrollMask
