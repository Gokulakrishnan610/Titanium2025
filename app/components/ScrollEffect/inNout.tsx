"use client";
import React, { useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const InNout = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=200%",
                    scrub: 1,
                    pin: true,
                }
            });

            tl.fromTo(textRef.current,
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
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <ReactLenis root>
            <div ref={containerRef} className="h-screen w-full flex items-center justify-center overflow-hidden bg-black relative">
                <h1 ref={textRef} className="text-[15vw] font-black text-white uppercase leading-none tracking-tighter">
                    Register Now
                </h1>
            </div>
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <p className="text-white text-2xl">Next Section</p>
            </div>
        </ReactLenis>
    );
};

export default InNout;