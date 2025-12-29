"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Shield, Brain, Cpu, Gamepad2, Rocket, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./radialevents.module.css";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const events = [
	{
		icon: Code,
		title: "HackTitan",
		category: "Hackathon",
		description: "48-hour coding marathon to build innovative solutions for real-world problems",
		prize: "₹5,00,000",
		featured: true,
		image: "https://images.unsplash.com/photo-1660644808219-1f103401bc85?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	},
	{
		icon: Shield,
		title: "CyberFortress",
		category: "CTF",
		description: "Capture the flag competition testing your security and hacking skills",
		prize: "₹2,50,000",
		featured: true,
		image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
	},
	{
		icon: Brain,
		title: "AI Arena",
		category: "AI Challenge",
		description: "Build and deploy machine learning models to solve complex challenges",
		prize: "₹3,00,000",
		featured: false,
		image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
	},
	{
		icon: Cpu,
		title: "RoboWars",
		category: "Robotics",
		description: "Design and program robots to compete in various challenging tasks",
		prize: "₹2,00,000",
		featured: false,
		image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
	},
	{
		icon: Gamepad2,
		title: "GameDev Jam",
		category: "Game Development",
		description: "Create an original game from scratch in just 24 hours",
		prize: "₹1,50,000",
		featured: false,
		image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
	},
	{
		icon: Rocket,
		title: "StartUp Pitch",
		category: "Entrepreneurship",
		description: "Pitch your startup idea to top VCs and industry leaders",
		prize: "₹10,00,000",
		featured: true,
		image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1000&auto=format&fit=crop",
	},
];

export default function RadialEvents() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
	const tabTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const rotationRef = useRef(0);
	const startXRef = useRef(0);
	const startRotationRef = useRef(0);
	const autoMoveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const radius = isMobile ? 350 : 900;
	const verticalScale = isMobile ? 0.25 : 0.3;
	const angleStep = 180 / events.length;
	const autoMoveDelay = 3000;


	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		handleResize();

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	function updateCardsPosition(animate = true) {
		const totalAngle = angleStep * events.length;

		cardsRef.current.forEach((card, index) => {
			if (!card) return;

			let rotationAngle = index * angleStep - rotationRef.current;

			rotationAngle = ((rotationAngle % totalAngle) + totalAngle) % totalAngle;

			if (rotationAngle > totalAngle / 2) {
				rotationAngle = rotationAngle - totalAngle;
			}

			const angle = rotationAngle * (Math.PI / 90);
			const x = Math.sin(angle) * (radius);
			const y = (-Math.cos(angle) * radius + radius) * verticalScale;

			const normalizedY = y / (radius * 2 * verticalScale);
			const scale = 1 - normalizedY * (isMobile ? 0.2 : 0.3); 
			let opacity = 0;
			const fadeRange = 25;
			const visibleRange = 25;

			const distanceFromCenter = Math.abs(rotationAngle);

			if (distanceFromCenter <= visibleRange) {
				opacity = 1;
			} else if (distanceFromCenter <= visibleRange + fadeRange) {
				const fadeProgress = (distanceFromCenter - visibleRange) / fadeRange;
				opacity = 1 - Math.pow(fadeProgress, 2);
			} else {
				opacity = 0;
			}

			const zIndex = Math.round(1000 - y);
			const cardRotation = Math.sin(angle) * (isMobile ? 10 : 20); 

			if (animate) {
				gsap.to(card, {
					x,
					y,
					scale,
					opacity,
					rotation: cardRotation,
					duration: 0.8,
					ease: "power2.out",
					onUpdate: () => {
						card.style.zIndex = zIndex.toString();
					},
				});
			} else {
				gsap.set(card, {
					x,
					y,
					scale,
					opacity,
					rotation: cardRotation,
				});
				card.style.zIndex = zIndex.toString();
			}
		});
	}

	const moveToNext = () => {
		const nextIndex = (currentIndex + 1) % events.length;
		const targetRotation = rotationRef.current + angleStep;

		gsap.to(rotationRef, {
			current: targetRotation,
			duration: 0.8,
			ease: "power2.out",
			onUpdate: () => {
				updateCardsPosition(false);
			},
		});

		setCurrentIndex(nextIndex);
	};


	useEffect(() => {
		updateCardsPosition(false);
	}, [isMobile]);

	useEffect(() => {
		const startAutoMove = () => {
			if (autoMoveIntervalRef.current) {
				clearInterval(autoMoveIntervalRef.current);
			}
			autoMoveIntervalRef.current = setInterval(() => {
				if (!isDragging) {
					moveToNext();
				}
			}, autoMoveDelay);
		};

		startAutoMove();

		return () => {
			if (autoMoveIntervalRef.current) {
				clearInterval(autoMoveIntervalRef.current);
			}
		};
	}, [isDragging, currentIndex]);

	useEffect(() => {
		updateCardsPosition(false);
	}, []);

	const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
		setIsDragging(true);
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		startXRef.current = clientX;
		startRotationRef.current = rotationRef.current;
	};

	const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
		if (!isDragging) return;

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const deltaX = clientX - startXRef.current;

		const sensitivity = isMobile ? -0.08 : -0.04;
		const rotationDelta = deltaX * sensitivity;

		rotationRef.current = startRotationRef.current + rotationDelta;

		updateCardsPosition(false);

		const totalRotation = angleStep * events.length;
		const normalizedRotation = ((rotationRef.current % totalRotation) + totalRotation) % totalRotation;
		const newIndex = Math.round(normalizedRotation / angleStep) % events.length;
		setCurrentIndex(newIndex);
	};

	const handleMouseUp = () => {
		if (!isDragging) return;
		setIsDragging(false);

		const nearestCardOffset = Math.round(rotationRef.current / angleStep);
		const targetRotation = nearestCardOffset * angleStep;

		gsap.to(rotationRef, {
			current: targetRotation,
			duration: 0.5,
			ease: "power2.out",
			onUpdate: () => {
				updateCardsPosition(false);
			},
		});

		const normalizedIndex = ((nearestCardOffset % events.length) + events.length) % events.length;
		setCurrentIndex(normalizedIndex);
	};

	const handleIndicatorClick = (index: number) => {
		const currentStep = Math.round(rotationRef.current / angleStep);
		const currentIndexAtStep = ((currentStep % events.length) + events.length) % events.length;

		let diff = index - currentIndexAtStep;

		if (diff > events.length / 2) {
			diff -= events.length;
		} else if (diff < -events.length / 2) {
			diff += events.length;
		}

		const targetRotation = (currentStep + diff) * angleStep;

		gsap.to(rotationRef, {
			current: targetRotation,
			duration: 0.8,
			ease: "power2.out",
			onUpdate: () => {
				updateCardsPosition(false);
			},
		});

		setCurrentIndex(index);
	};

	useEffect(() => {
		const tabText = tabTextRefs.current[currentIndex];
		if (tabText) {
			gsap.fromTo(
				tabText,
				{ scale: 0.9, opacity: 0.6 },
				{
					scale: 1,
					opacity: 1,
					duration: 0.4,
					ease: "back.out(1.7)",
				},
			);
		}
	}, [currentIndex]);

	useEffect(() => {
		const ctx = gsap.context(() => {
			gsap.fromTo(
				".events-header",
				{ opacity: 0, y: 50 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: "power3.out",
					scrollTrigger: {
						trigger: ".events-header",
						start: "top 80%",
						toggleActions: "play none none reverse",
					},
				}
			);
		}, sectionRef);

		return () => ctx.revert();
	}, []);

	return (
		<section
			ref={sectionRef}
			id="events"
			className="relative py-12 md:py-16 bg-titanium-black overflow-hidden min-h-screen"
		>
			<div className="absolute inset-0 grid-pattern opacity-30" />
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />

			<div className="relative z-10 w-full h-full flex flex-col">
				<div className="events-header text-center mb-8 pt-4 md:pt-8 px-4">
					<span className="inline-block text-xs md:text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-2 md:mb-4">
						Compete & Create
					</span>
					<h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
						<span className="text-titanium-gradient">Featured</span>{" "}
						<span className="text-titanium-light">Events</span>
					</h2>
					<p className="text-titanium-metallic text-sm md:text-lg max-w-2xl mx-auto">
						Participate in world-class competitions and win incredible prizes
					</p>
				</div>


				<div className="relative flex-1 flex flex-col min-h-[500px] md:min-h-[700px] mt-12 md:mt-28 overflow-visible">
					<div
						ref={containerRef}
						className={cn(
							styles["radial-carousel-container"],
							"relative w-full h-full min-h-[450px] md:min-h-[600px] select-none pointer-events-none",
						)}
					>
						<div
							className="absolute inset-0 flex items-center justify-center pointer-events-auto touch-pan-y"
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}
							onTouchStart={handleMouseDown}
							onTouchMove={handleMouseMove}
							onTouchEnd={handleMouseUp}
						>
							<div className="relative w-full h-full">
								{events.map((event, index) => (
									<div
										key={event.title}
										ref={(el) => {
											cardsRef.current[index] = el;
										}}
										className="absolute w-[280px] h-[380px] md:w-[571px] md:h-[744px] rounded-2xl md:rounded-3xl shadow-2xl flex flex-col items-center justify-end p-6 md:p-10 transition-shadow hover:shadow-3xl overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
										style={{
											backgroundImage: `url(${event.image})`,
											backgroundSize: "cover",
											backgroundPosition: "center",
										}}
									>
										<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />

										{event.featured && (
											<div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
												<span className="px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-mono bg-white/10 backdrop-blur-md text-white border border-white/20">
													Featured
												</span>
											</div>
										)}

										<div className="absolute top-5 left-5 md:top-8 md:left-8 z-10">
											<div className="w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
												<event.icon className="text-white w-5 h-5 md:w-8 md:h-8" />
											</div>
										</div>

										<div className="relative z-10 flex flex-col items-center text-center gap-2 md:gap-4 w-full">
											<span className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-lime-400">
												{event.category}
											</span>
											<h2 className="text-2xl md:text-4xl font-bold leading-tight text-white">{event.title}</h2>
											<p className="text-xs md:text-sm opacity-80 max-w-xs leading-relaxed line-clamp-2 text-white">
												{event.description}
											</p>

											<div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2 px-4 py-2 md:px-6 md:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
												<Trophy className="text-lime-400 w-4 h-4 md:w-5 md:h-5" />
												<div className="text-left">
													<span className="text-[10px] md:text-xs uppercase tracking-wider block text-white/70">
														Prize Pool
													</span>
													<span className="text-sm md:text-xl font-bold text-white">{event.prize}</span>
												</div>
											</div>

											<button className="mt-1 md:mt-2 px-4 py-1.5 md:px-6 md:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-xs md:text-sm font-medium transition-all duration-300">
												View Event
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="absolute -bottom-12 md:-bottom-36 left-1/2 -translate-x-1/2 z-[2000] pointer-events-auto scale-90 md:scale-100">
						<Link
							href="/programs/events"
							className="flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 bg-white text-black rounded-full font-bold text-xs md:text-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] whitespace-nowrap"
							style={{ cursor: 'pointer' }}
						>
							EXPLORE ALL EVENTS
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="md:w-4 md:h-4"
							>
								<path d="M5 12h14" />
								<path d="m12 5 7 7-7 7" />
							</svg>
						</Link>
					</div>
				</div>

				<div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-16">
					<div className="mt-40 md:mt-62 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
						{[
							{ icon: Trophy, value: "₹25L+", label: "Total Prizes" },
							{ icon: Users, value: "5000+", label: "Participants" },
							{ icon: Code, value: "50+", label: "Challenges" },
							{ icon: Rocket, value: "100+", label: "Mentors" },
						].map((stat) => (
							<div
								key={stat.label}
								className="text-center p-4 md:p-6 rounded-xl bg-titanium-charcoal/30 border border-titanium-silver/5"
							>
								<stat.icon className="text-titanium-silver mx-auto mb-2 md:mb-3 w-5 h-5 md:w-6 md:h-6" />
								<div className="text-xl md:text-2xl font-bold text-titanium-gradient">{stat.value}</div>
								<div className="text-xs md:text-sm text-titanium-metallic">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
		</section>
	);
}
