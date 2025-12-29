"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import styles from "./zone.module.css";

gsap.registerPlugin(ScrollTrigger);

interface DisplayZone {
    id: string;
    title: string;
    shortDesc: string;
    image: string;
    stats: { label: string; value: string }[];
    highlights: string[];
}

const zonesData: DisplayZone[] = [
    {
        id: "z1",
        title: "Turing Machine",
        shortDesc: "The birth of modern computing.",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
        stats: [
            { label: "Year", value: "1936" },
            { label: "Inventor", value: "A. Turing" },
        ],
        highlights: ["Computation Theory", "Algorithm Basis", "Historic Model"],
    },
    {
        id: "z2",
        title: "Saturn V Engine",
        shortDesc: "The powerhouse behind the Moon landing.",
        image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=400&h=400&fit=crop",
        stats: [
            { label: "Thrust", value: "7.5M lbf" },
            { label: "Stages", value: "3" },
        ],
        highlights: ["F-1 Engine", "Apollo Missions", "NASA Heritage"],
    },
    {
        id: "z3",
        title: "V8 Engine",
        shortDesc: "The iconic heart of muscle cars.",
        image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
        stats: [
            { label: "Cylinders", value: "8" },
            { label: "Power", value: "450 HP" },
        ],
        highlights: ["Ford Mustang", "Chevy Camaro", "Dodge Challenger"],
    },
    {
        id: "z4",
        title: "Wright Flyer",
        shortDesc: "The first powered flight in history.",
        image: "https://images.unsplash.com/photo-1559533905-d6fbbd04aa0f?w=400&h=400&fit=crop",
        stats: [
            { label: "Year", value: "1903" },
            { label: "Distance", value: "120 ft" },
        ],
        highlights: ["Kitty Hawk", "Wright Brothers", "Aviation Pioneer"],
    },
    {
        id: "z5",
        title: "Tesla Coil",
        shortDesc: "High-voltage electrical resonance.",
        image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=400&fit=crop",
        stats: [
            { label: "Voltage", value: "1M V" },
            { label: "Inventor", value: "N. Tesla" },
        ],
        highlights: ["Wireless Power", "AC Current", "Lightning Demo"],
    },
    {
        id: "z6",
        title: "Apollo 11 Capsule",
        shortDesc: "The spacecraft that carried astronauts to the Moon.",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop",
        stats: [
            { label: "Crew", value: "3" },
            { label: "Mission", value: "1969" },
        ],
        highlights: ["Neil Armstrong", "Moon Landing", "NASA Milestone"],
    },
    {
        id: "z7",
        title: "Steam Engine",
        shortDesc: "The machine that powered the Industrial Revolution.",
        image: "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=400&h=400&fit=crop",
        stats: [
            { label: "Year", value: "1712" },
            { label: "Inventor", value: "T. Newcomen" },
        ],
        highlights: ["James Watt", "Locomotives", "Factories"],
    },
    {
        id: "z8",
        title: "Hubble Telescope",
        shortDesc: "Our eye in the cosmos for over 30 years.",
        image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop",
        stats: [
            { label: "Orbit", value: "340 mi" },
            { label: "Launch", value: "1990" },
        ],
        highlights: ["Deep Field", "Nebulae", "Galaxy Images"],
    }
];

const ZoneCube = ({ data, index }: { data: DisplayZone; index: number }) => {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const velocity = useRef({ x: 0 });
    const rafId = useRef<number | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        velocity.current = { x: 0 };
        if (rafId.current) cancelAnimationFrame(rafId.current);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const deltaX = e.clientX - lastMousePos.current.x;
        velocity.current = { x: deltaX * 0.4 };

        setRotation((prev) => ({
            x: prev.x,
            y: prev.y + deltaX * 0.4,
        }));

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);

        const applyInertia = () => {
            if (Math.abs(velocity.current.x) < 0.1) return;

            setRotation((prev) => ({
                x: prev.x,
                y: prev.y + velocity.current.x
            }));

            velocity.current.x *= 0.92;
            rafId.current = requestAnimationFrame(applyInertia);
        };
        applyInertia();
    };

    return (
        <div
            className={cn("zone-card-entry", styles.cubeWrapper)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div className={styles.cubeScene}>
                <div
                    className={styles.cube}
                    style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
                >
                    <div className={cn(styles.cubeFace, styles.faceFront)}>
                        <div className="flex-1 flex flex-col justify-center">
                            <span className="text-[10px] font-mono text-titanium-metallic/50 mb-3 tracking-widest">
                                ZONE 0{index + 1}
                            </span>
                            <h3 className={styles.faceTitle}>{data.title}</h3>
                            <span className={styles.faceSubtitle}>{data.shortDesc}</span>
                        </div>
                        <div className="mt-auto flex justify-between items-end">
                            <div className="w-7 h-7 rounded-full border border-titanium-silver/20 flex items-center justify-center text-titanium-silver/40">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                            <div className="text-[9px] uppercase text-titanium-metallic/30 tracking-widest">Interactive</div>
                        </div>
                    </div>

                    <div className={cn(styles.cubeFace, styles.faceRight)}>
                        <div className={styles.sectionLabel}>Specifications</div>
                        <div className="flex flex-col">
                            {data.stats.map((stat, i) => (
                                <div key={i} className={styles.statRow}>
                                    <span className={styles.statLabel}>{stat.label}</span>
                                    <span className={styles.statValue}>{stat.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-4">
                            <div className="h-0.5 w-full bg-titanium-silver/10 rounded">
                                <div className="h-full w-3/5 bg-titanium-silver/40 rounded" />
                            </div>
                            <div className="text-[9px] text-titanium-metallic/30 mt-2 text-right">CAPACITY</div>
                        </div>
                    </div>

                    <div className={cn(styles.cubeFace, styles.faceBack, "p-0")}>
                        <img
                            src={data.image}
                            alt={data.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-titanium-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="text-[10px] text-titanium-silver/70 uppercase tracking-widest">
                                {data.title}
                            </div>
                        </div>
                    </div>

                    <div className={cn(styles.cubeFace, styles.faceLeft)}>
                        <div className={styles.sectionLabel}>Highlights</div>
                        <ul className={styles.highlightList}>
                            {data.highlights.map((item, i) => (
                                <li key={i} className={styles.highlightItem}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className={cn(styles.cubeFace, styles.faceTop)} />
                    <div className={cn(styles.cubeFace, styles.faceBottom)} />
                </div>
            </div>

            <div className={styles.dragHint}>← Drag to Rotate →</div>
        </div>
    );
};

export default function DisplayZones() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".zone-card-entry", {
                y: 60,
                opacity: 0,
                duration: 0.9,
                stagger: 0.12,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 85%",
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative w-full py-16 md:py-36 px-4 md:px-12 bg-titanium-black overflow-hidden">

            <div className="absolute inset-0 pointer-events-none opacity-15">
                <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-titanium-silver/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-titanium-silver/5 rounded-full blur-[80px]" />
            </div>

            <div className="w-full max-w-[1600px] mx-auto mb-6 md:mb-16 relative z-10 px-2 md:px-4">
                <span className="inline-block text-xs md:text-sm font-mono text-titanium-metallic uppercase tracking-[0.2em] mb-2 md:mb-4">
                    Interactive Zones
                </span>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-6">
                    <span className="text-titanium-gradient">Display</span>{" "}
                    <span className="text-titanium-light">Zones</span>
                </h2>
                <p className="text-titanium-metallic text-sm md:text-lg max-w-xl leading-relaxed">
                    Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum 
                </p>
            </div>

            <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-1 md:gap-10 lg:gap-14 px-0 md:px-4">
                {zonesData.map((zone, idx) => (
                    <ZoneCube key={zone.id} data={zone} index={idx} />
                ))}
            </div>
        </section>
    );
}
