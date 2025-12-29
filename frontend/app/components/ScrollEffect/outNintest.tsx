"use client";
import React, { use, useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from  './outNin.module.css';


gsap.registerPlugin(ScrollTrigger);

const OutNin = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const containerRef2 = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const textRef2 = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger:{
                    trigger: containerRef.current,
                    start:"top top",
                    end:"+=300%",
                    scrub: 1,
                    pin: true,
                }
            });

            tl.fromTo(textRef.current,
                {
                    scale: 1,
                    opacity: 1,
                },
                {
                    scale: 90,
                    ease: "power3.in",
                }
            );

        }, containerRef);

        return () => ctx.revert();
    }, [])

    return (
        <>
        <ReactLenis root>
            <div ref={containerRef} className="h-screen w-full flex items-center justify-center overflow-hidden bg-black relative">
                <h1 ref={textRef} className="text-[15vw] font-black text-transparent uppercase leading-none tracking-tighter" style={{ WebkitTextStroke: "2px #c0c0c0" }}>
                    TITANIUM
                </h1>
            </div>
            <div className="h-screen w-full bg-black flex items-flex-start justify-flex-start">
                <section>
                    <p className={styles.aboutTitanium}>About TITANIUM</p>
                    <p className={styles.paraAboutTitanium}>
                        TITANIUM 2025 is the flagship national-level technical symposium organized by Rajalakshmi Engineering College, Chennai. Now in its landmark edition, TITANIUM brings together the brightest minds from across the nation to compete, collaborate, and innovate.
                        Over three action-packed days, participants will experience cutting-edge workshops, 
                        intense competitions, inspiring talks from industry leaders, and unparalleled networking opportunities. 
                        From hackathons to robotics, from AI challenges to gaming tournaments — TITANIUM offers something for every tech enthusiast.
                        Join us in March 2025 for an extraordinary celebration of technology, creativity, and the spirit of innovation. 
                        This is not just an event — it's an experience that will shape your future.
                    </p>
                </section>
            </div>
        </ReactLenis>
    
        </>
    );
};

export default OutNin;
