"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import styles from "./radialevents.module.css"

const carouselData = [
	{
		id: 1,
		title: "Hackathon",
		subtitle: "24-Hour Coding Sprint",
		description: "Collaborate, innovate, and build amazing solutions in our flagship hackathon event.",
		image: "https://images.unsplash.com/photo-1660644808219-1f103401bc85?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		textColor: "text-white",
	},
	{
		id: 2,
		title: "RoboWars",
		subtitle: "Battle of Bots",
		description: "Witness the ultimate clash of metal and code as robots fight for supremacy.",
		image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
		textColor: "text-white",
	},
	{
		id: 3,
		title: "Code Clash",
		subtitle: "Competitive Programming",
		description: "Test your algorithmic skills against the best coders in intense programming challenges.",
		image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
		textColor: "text-white",
	},
	{
		id: 4,
		title: "Tech Quiz",
		subtitle: "Trivia Challenge",
		description: "Prove your knowledge across various tech domains in our exciting quiz competition.",
		image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=1000&auto=format&fit=crop",
		textColor: "text-white",
	},
	{
		id: 5,
		title: "Gaming",
		subtitle: "E-Sports Tournament",
		description: "Compete in popular titles and show off your gaming prowess to win big prizes.",
		image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
		textColor: "text-white",
	},
]

export default function RadialEvents() {
	const containerRef = useRef<HTMLDivElement>(null)
	const cardsRef = useRef<(HTMLDivElement | null)[]>([])
	const tabTextRefs = useRef<(HTMLSpanElement | null)[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isDragging, setIsDragging] = useState(false)
	const rotationRef = useRef(0)
	const startXRef = useRef(0)
	const startRotationRef = useRef(0)

	const radius = 750
	const verticalScale = 0.6
	const angleStep = 180 / carouselData.length

	function updateCardsPosition(animate = true) {
		cardsRef.current.forEach((card, index) => {
			if (!card) return

			const rotationAngle = index * angleStep - rotationRef.current
			const angle = rotationAngle * (Math.PI / 90)
			const x = Math.sin(angle) * radius
			const y = (-Math.cos(angle) * radius + radius) * verticalScale

			const normalizedY = y / (radius * 2 * verticalScale)
			const scale = 1 - normalizedY * 0.3

			const opacity = 1

			const zIndex = Math.round(1000 - y)
			const cardRotation = Math.sin(angle) * 20

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
						card.style.zIndex = zIndex.toString()
					},
				})
			} else {
				gsap.set(card, {
					x,
					y,
					scale,
					opacity,
					rotation: cardRotation,
				})
				card.style.zIndex = zIndex.toString()
			}
		})
	}

	useEffect(() => {
		updateCardsPosition(false)
	}, [])

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true)
		startXRef.current = e.clientX
		startRotationRef.current = rotationRef.current
	}

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return

		const deltaX = e.clientX - startXRef.current
		const rotationDelta = deltaX * -0.04
		rotationRef.current = startRotationRef.current + rotationDelta

		updateCardsPosition(false)

		const totalRotation = angleStep * carouselData.length
		const normalizedRotation = ((rotationRef.current % totalRotation) + totalRotation) % totalRotation
		const newIndex = Math.round(normalizedRotation / angleStep) % carouselData.length
		setCurrentIndex(newIndex)
	}

	const handleMouseUp = () => {
		if (!isDragging) return
		setIsDragging(false)

		const nearestCardOffset = Math.round(rotationRef.current / angleStep)
		const targetRotation = nearestCardOffset * angleStep

		gsap.to(rotationRef, {
			current: targetRotation,
			duration: 0.5,
			ease: "power2.out",
			onUpdate: () => {
				updateCardsPosition(false)
			},
		})

		const normalizedIndex = ((nearestCardOffset % carouselData.length) + carouselData.length) % carouselData.length
		setCurrentIndex(normalizedIndex)
	}

	const handleIndicatorClick = (index: number) => {
		const currentStep = Math.round(rotationRef.current / angleStep)
		const currentIndexAtStep = ((currentStep % carouselData.length) + carouselData.length) % carouselData.length

		let diff = index - currentIndexAtStep

		if (diff > carouselData.length / 2) {
			diff -= carouselData.length
		} else if (diff < -carouselData.length / 2) {
			diff += carouselData.length
		}

		const targetRotation = (currentStep + diff) * angleStep

		gsap.to(rotationRef, {
			current: targetRotation,
			duration: 0.8,
			ease: "power2.out",
			onUpdate: () => {
				updateCardsPosition(false)
			},
		})

		setCurrentIndex(index)
	}

	useEffect(() => {
		const tabText = tabTextRefs.current[currentIndex]
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
			)
		}
	}, [currentIndex])

	return (
		<div className="w-full h-screen flex flex-col overflow-hidden relative">
			<div className="w-full flex justify-center pl-12 pt-12  z-20">
				<h1 className={cn("text-6xl md:text-8xl", styles["cartoon-heading"])}>
					MAJOR EVENTS
				</h1>
			</div>
			{/* <nav className="flex justify-center gap-2 pb-80 z-10"> */}
            <nav className="flex flex-col gap-3 z-30 absolute left-6 top-80 -translate-y-1/2">
				{carouselData.map((item, index) => (
					<button
						key={item.id}
						onClick={() => handleIndicatorClick(index)}
						className={cn(
							"px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 relative overflow-hidden",
							currentIndex === index
								? cn("shadow-lg scale-105 bg-white text-black")
								: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
						)}
						aria-label={`Go to ${item.title}`}
					>
						<span
							ref={(el) => {
								tabTextRefs.current[index] = el
							}}
							className="block"
						>
							{item.title}
						</span>
					</button>
				))}
			</nav>

			<div
				ref={containerRef}
				className={cn(
					styles["radial-carousel-container"],
					"relative w-full flex-1 select-none overflow-hidden",
				)}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				<div className="absolute inset-0 flex items-center justify-center">
					{carouselData.map((item, index) => (
						<div
							key={item.id}
							ref={(el) => {
								cardsRef.current[index] = el
							}}
							className={cn(
								"absolute w-[28rem] h-[32rem] rounded-3xl shadow-2xl flex flex-col items-center justify-end p-8 transition-shadow hover:shadow-3xl overflow-hidden",
								item.textColor,
							)}
							style={{
								backgroundImage: `url(${item.image})`,
								backgroundSize: 'cover',
								backgroundPosition: 'center',
							}}
						>
							<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />
							
							<div className="relative z-10 flex flex-col items-center text-center gap-4 w-full">
								<span className="text-xs font-mono uppercase tracking-wider opacity-80 text-lime-400">{item.subtitle}</span>
								<h2 className="text-4xl font-bold leading-tight">{item.title}</h2>
								<p className="text-sm opacity-80 max-w-xs leading-relaxed line-clamp-2">{item.description}</p>
								
								<button className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium transition-all duration-300 group">
									View Event
								</button>
							</div>
						</div>
					))}
				</div>
				
				<div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
					<button className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
						VIEW ALL EVENTS
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	)
}
