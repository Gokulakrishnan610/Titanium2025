'use client'

import { useRef, useLayoutEffect, useState, useEffect } from 'react'
import styles from './experienceZone.module.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const vrArContent = [
    { icon: "🥽", title: "Virtual Worlds", desc: "Fully immersive VR environments" },
    { icon: "📱", title: "Augmented Reality", desc: "Digital overlays on reality" },
    { icon: "🌐", title: "Mixed Reality", desc: "Blend of virtual and physical" }
]

const gamingContent = [
    { icon: "🎮", title: "Esports Arena", desc: "Pro-grade gaming setups" },
    { icon: "📺", title: "Streaming Hub", desc: "Content creator stations" },
    { icon: "⚡", title: "RTX Experience", desc: "Next-gen ray tracing demos" }
]

const arcadeContent = [
    { icon: "👾", title: "Retro Classics", desc: "Pac-Man, Space Invaders, Galaga" },
    { icon: "🥊", title: "Fighting Games", desc: "Street Fighter, Tekken cabinets" },
    { icon: "🏎️", title: "Racing Sims", desc: "Full motion racing rigs" }
]

const ExperienceZone = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const vrEntryRef = useRef<HTMLDivElement>(null)
    const vrImageRef = useRef<HTMLDivElement>(null)
    const introTextRef = useRef<HTMLDivElement>(null)
    const retroWorldRef = useRef<HTMLDivElement>(null)
    const vrExitRef = useRef<HTMLDivElement>(null)
    const vrExitImageRef = useRef<HTMLDivElement>(null)
    const exitTextRef = useRef<HTMLDivElement>(null)
    const landingRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const retroBgRef = useRef<HTMLDivElement>(null)
    const retroBgExitRef = useRef<HTMLDivElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isLaptop, setIsLaptop] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const checkScreenSize = () => {
            const width = window.innerWidth
            setIsMobile(width <= 768)
            setIsLaptop(width > 768 && width <= 1440)
        }
        checkScreenSize()
        window.addEventListener("resize", checkScreenSize)
        return () => window.removeEventListener("resize", checkScreenSize)
    }, [])

    useLayoutEffect(() => {
        if (!isMounted) return

        const ctx = gsap.context(() => {
            const entryTl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    scrub: 1,
                    pin: true,
                    start: "top top",
                    end: "+=4500",
                    anticipatePin: 1,
                },
            })

            entryTl.set(vrImageRef.current, {
                scale: isMobile ? 1 : isLaptop ? 1.3 : 1.5,
                transformOrigin: isMobile ? "center 52%" : "center center"
            })
            entryTl.set(retroWorldRef.current, { opacity: 0, visibility: "hidden" })

            entryTl.to(introTextRef.current, { opacity: 0, duration: 0.5 })

            entryTl.to(vrImageRef.current, {
                scale: isMobile ? 6 : 10,
                duration: 2,
                ease: "power2.inOut"
            })

            const maskCenter = isMobile ? "center 52%" : "center";
            const maskStart = isMobile
                ? `radial-gradient(circle at ${maskCenter}, black 15%, black 16%, transparent 40%)`
                : `radial-gradient(circle at center, black 25%, black 26%, transparent 80%)`;
            const maskEnd = `radial-gradient(circle at ${maskCenter}, black 95%, black 96%, transparent 100%)`;

            entryTl.fromTo(retroBgRef.current, {
                maskImage: maskStart,
                webkitMaskImage: maskStart
            }, {
                maskImage: maskEnd,
                webkitMaskImage: maskEnd,
                duration: 2,
                ease: "power2.inOut"
            }, "<")

            entryTl.to(vrImageRef.current, {
                opacity: 0,
                duration: 0.5,
            }, "<+=1.5")

            entryTl.set(retroWorldRef.current, { visibility: "visible" })
            entryTl.to(retroWorldRef.current, { opacity: 1, duration: 1 }, "<")

            entryTl.fromTo(".vr-ar-section",
                { opacity: 0, y: 100 },
                { opacity: 1, y: 0, duration: 1.5 }
            )

            entryTl.fromTo(".vr-card",
                { opacity: 0, y: 50, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2 },
                "<+=0.3"
            )

            entryTl.to({}, { duration: 0.5 })

            entryTl.to(".vr-ar-section", { opacity: 0, y: -50, duration: 1 })

            entryTl.fromTo(".gaming-section",
                { opacity: 0, y: 100 },
                { opacity: 1, y: 0, duration: 1.5 }
            )

            entryTl.fromTo(".gaming-card",
                { opacity: 0, y: 50, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2 },
                "<+=0.3"
            )

            entryTl.to({}, { duration: 0.5 })

            entryTl.to(".gaming-section", { opacity: 0, y: -50, duration: 1 })

            entryTl.fromTo(".arcade-section",
                { opacity: 0, y: 100 },
                { opacity: 1, y: 0, duration: 1.5 }
            )

            entryTl.fromTo(".arcade-card",
                { opacity: 0, y: 50, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2 },
                "<+=0.3"
            )

            entryTl.to({}, { duration: 0.5 })

            entryTl.to(".arcade-section", { opacity: 0, y: -50, duration: 1 })

            entryTl.set(vrExitRef.current, { autoAlpha: 1 })
            entryTl.set(vrExitImageRef.current, {
                scale: isMobile ? 8 : 12,
                opacity: 0,
                transformOrigin: isMobile ? "center 52%" : "center center"
            })

            const exitMaskCenter = isMobile ? "center 52%" : "center";
            entryTl.set(retroBgExitRef.current, {
                maskImage: `radial-gradient(circle at ${exitMaskCenter}, black 95%, black 96%, transparent 97%)`
            })

            entryTl.to(vrExitImageRef.current, {
                scale: isMobile ? 1 : isLaptop ? 1.3 : 1.5,
                duration: 2,
                ease: "power2.inOut",
                transformOrigin: isMobile ? "center 52%" : "center center"
            })

            const exitMaskShrink = isMobile
                ? `radial-gradient(circle at center 52%, black 15%, black 16%, transparent 40%)`
                : `radial-gradient(circle at center, black 25%, black 26%, transparent 80%)`;

            entryTl.to(retroBgExitRef.current, {
                maskImage: exitMaskShrink,
                duration: 2,
                ease: "power2.inOut"
            }, "<+=0.4")


            entryTl.to(vrExitImageRef.current, {
                opacity: 1,
                duration: 1,
                ease: "power2.inOut"
            }, "<")


            entryTl.to(retroWorldRef.current, { opacity: 0, duration: 1 }, "<")


            entryTl.fromTo(vrExitRef.current,
                { maskImage: `radial-gradient(circle at ${isMobile ? "center 52%" : "50% 50%"}, rgb(0, 0, 0) 15%, rgba(0, 0, 0, 0) 40%)` },
                { maskImage: `radial-gradient(circle at ${isMobile ? "center 52%" : "50% 50%"}, rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0) 100%)`, duration: 1 },
                "<"
            )

            entryTl.to(exitTextRef.current, { opacity: 1, duration: 1 }, "<+=0.5")

        }, containerRef)

        return () => ctx.revert()
    }, [isMobile, isLaptop, isMounted])

    if (!isMounted) return null

    return (
        <div ref={wrapperRef}>
            <div className={styles.headerSpacer} />

            <div ref={containerRef} className={styles.pinnedContainer}>
                <div ref={vrEntryRef} className={styles.vrEntryContainer}>
                    <div className={styles.darkBase} />
                    <div ref={retroBgRef} className={styles.retroBgPreview}>
                        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                            <source src="/TitaniumBg.mp4" type="video/mp4" />
                        </video>
                    </div>
                    <div ref={vrImageRef} className={styles.vrImage} />
                    <div ref={introTextRef} className={styles.introText}>
                        <span className={styles.introLabel}>Experience & Gaming</span>
                        <h2 className={styles.introTitle}>Enter The Virtual Realm</h2>
                        <p className={styles.introSubtitle}>Scroll to dive into immersive experiences</p>
                    </div>
                </div>
                <div ref={retroWorldRef} className={styles.retroWorld}>
                    <div className={styles.retroBackground}>
                        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                            <source src="/TitaniumBg.mp4" type="video/mp4" />
                        </video>
                    </div>
                    <div className={`${styles.contentSection} vr-ar-section`}>
                        <h2 className={styles.sectionTitle}>VR & AR Experiences</h2>
                        <div className={styles.cardsGrid}>
                            {vrArContent.map((item, i) => (
                                <div key={i} className={`${styles.card} vr-card`}>
                                    <div className={styles.constructionText}>Coming Soon </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`${styles.contentSection} gaming-section`}>
                        <h2 className={styles.sectionTitle}>Gaming PC Zone</h2>
                        <div className={styles.cardsGrid}>
                            {gamingContent.map((item, i) => (
                                <div key={i} className={`${styles.card} gaming-card`}>
                                    <div className={styles.constructionText}>Coming Soon </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`${styles.contentSection} arcade-section`}>
                        <h2 className={styles.sectionTitle}>Arcade Zone</h2>
                        <div className={styles.cardsGrid}>
                            {arcadeContent.map((item, i) => (
                                <div key={i} className={`${styles.card} arcade-card`}>
                                    <div className={styles.constructionText}>Coming Soon </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div ref={vrExitRef} className={styles.vrExitContainer}>
                    <div className={styles.darkBase} />
                    <div ref={retroBgExitRef} className={styles.retroBgPreview}>
                        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                            <source src="/TitaniumBg.mp4" type="video/mp4" />
                        </video>
                    </div>
                    <div ref={vrExitImageRef} className={styles.vrImage} />
                    <div ref={exitTextRef} className={styles.exitText}>
                        <h2 className={styles.exitMainTitle}>Continue Exploring Titanium</h2>
                    </div>
                </div>
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
            <div className={styles.footerSpacer} />
        </div>
    )
}

export default ExperienceZone
