"use client";
import React, { useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from  './outNin.module.css';


gsap.registerPlugin(ScrollTrigger);

const OutNin = () => {
    const mainRef = useRef<HTMLDivElement>(null);
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

            const tl2 = gsap.timeline({
                scrollTrigger:{
                    trigger: containerRef2.current,
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

            tl2.fromTo(textRef2.current,
                {
                    scale: 20,
                    opacity: 0,
                },
                {
                    scale: 1,
                    opacity: 1,
                    ease: "power3.out",
                }
            );
        }, mainRef);

        return () => ctx.revert();
    }, [])

    return (
        <ReactLenis root>
            <div ref={mainRef}>
                <div ref={containerRef} className="h-screen w-full flex items-center justify-center overflow-hidden bg-black relative">
                    <h1 ref={textRef} className="text-[15vw] font-black text-transparent uppercase leading-none tracking-tighter" style={{ WebkitTextStroke: "2px #c0c0c0" }}>
                        TITANIUM
                    </h1>
                </div>
                <div className="min-h-screen w-full bg-[#c0c0c0]">
                    <section className="pb-20">
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
                    <section ref={containerRef2} className="h-screen w-full flex items-center justify-center overflow-hidden relative">
                        <p ref={textRef2} className='text-[15vw] font-black text-black'>WOW</p>
                    </section>
                </div>
            </div>
        </ReactLenis>
    );
};

export default OutNin;
