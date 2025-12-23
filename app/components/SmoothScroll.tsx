"use client"

import { ReactLenis } from 'lenis/react'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null)

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }

    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
 
    const lenis = lenisRef.current?.lenis
    if (!lenis) return () => gsap.ticker.remove(update)

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // Wire ScrollTrigger to Lenis scroller
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (typeof value === 'number') {
          lenis.scrollTo(value, { immediate: true })
        }
        return lenis.scroll?.current ?? window.scrollY
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
      },
      pinType: document.documentElement.style.transform ? 'transform' : 'fixed',
    })

    // Keep ScrollTrigger in sync after layout shifts/resizes
    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)

    // Initial refresh once Lenis is ready
    ScrollTrigger.refresh()

    return () => {
      lenis.off('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      gsap.ticker.remove(update)
    }
  }, [])

  return (
    <ReactLenis 
      root 
      ref={lenisRef} 
      autoRaf={false} 
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
      }}
    >
      {children}
    </ReactLenis>
  )
}
