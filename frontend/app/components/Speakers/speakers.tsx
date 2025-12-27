"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./speakers.module.css";

gsap.registerPlugin(ScrollTrigger);

interface EmientSpeaker {
  id: string;
  date: string;
  dateFormatted: string;
  mainText: string;
  accentText: string;
  image: string;
  imageSize?: 'normal' | 'medium' | 'large';
}

const eminentSpeakers: EmientSpeaker[] = [
  {
    id: "speaker1",
    date: "12/2/2026",
    dateFormatted: "12 FEB",
    mainText: "SPEED",
    accentText: "REDEFINED",
    image: "/f1.png",
    imageSize: 'large',
  },
  {
    id: "speaker2",
    date: "13/2/2026",
    dateFormatted: "13 FEB",
    mainText: "BEYOND",
    accentText: "EARTH",
    image: "/astronaut.png",
    imageSize: 'medium',
  },
  {
    id: "speaker3",
    date: "14/2/2026",
    dateFormatted: "14 FEB",
    mainText: "EVOLVE",
    accentText: "HUMANITY",
    image: "/person.png",
  },
];

export default function Speakers() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const blockRef = useRef<HTMLDivElement>(null);

  const playBlockAnimation = () => {
    if (!blockRef.current) return;

    gsap.killTweensOf(blockRef.current);

    gsap.timeline()
      .set(blockRef.current, { left: "-100%", right: "auto", width: "100%" })
      .to(blockRef.current, {
        left: "0%",
        duration: 0.5,
        ease: "power2.inOut"
      })
      .to(blockRef.current, {
        left: "100%",
        duration: 0.5,
        ease: "power2.inOut"
      });
  };

  const handleDateClick = (index: number) => {
    if (index === activeIndex) return;

    gsap.killTweensOf(blockRef.current);

    gsap.timeline()
      .set(blockRef.current, { left: "-100%", right: "auto", width: "100%" })
      .to(blockRef.current, {
        left: "0%",
        duration: 0.3,
        ease: "power2.in"
      })
      .call(() => {
        setDisplayIndex(index);
        setActiveIndex(index);
      })
      .to(blockRef.current, {
        left: "100%",
        duration: 0.3,
        ease: "power2.out"
      });
  };

  useEffect(() => {
    const timer = setTimeout(playBlockAnimation, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".speakers-header",
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: ".speakers-header", start: "top 85%" },
        }
      );

      gsap.fromTo(".date-tab",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out",
          scrollTrigger: { trigger: ".date-tabs", start: "top 90%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const currentSpeaker = eminentSpeakers[displayIndex];

  return (
    <section ref={sectionRef} id="speakers" className={styles.speakersSection}>
      <div className={styles.gridPattern} />
      <div
        className={`${styles.speakerImage} ${currentSpeaker.imageSize === 'large' ? styles.speakerImageLarge : ''} ${currentSpeaker.imageSize === 'medium' ? styles.speakerImageMedium : ''}`}
        style={{ backgroundImage: `url(${currentSpeaker.image})` }}
      />

      {displayIndex === 0 && (
        <div className={styles.speedLines}>
          <div className={styles.speedLine} />
          <div className={styles.speedLine} />
          <div className={styles.speedLine} />
          <div className={styles.speedLine} />
          <div className={styles.speedLine} />
        </div>
      )}

      {displayIndex === 1 && (
        <div className={styles.starsContainer}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={styles.star}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {displayIndex === 2 && (
        <div className={styles.greenAura} />
      )}

      <div className={styles.container}>
        <div className="speakers-header text-center mb-12 md:mb-20">
          <span className="inline-block text-xs md:text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
            Mystery Guests
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold">
            <span className="text-titanium-gradient">Eminent</span>{" "}
            <span className="text-titanium-light">Speakers</span>
          </h2>
        </div>

        <div className={styles.slideContainer}>
          <div className={styles.textContainer}>
            <div className={styles.textWrapper}>
              <span className={styles.mainText}>{currentSpeaker.mainText}</span>
              <span className={styles.accentText}>{currentSpeaker.accentText}</span>
            </div>
            <div ref={blockRef} className={styles.sweepBlock} />
          </div>

          <div className={styles.dateTag}>
            {currentSpeaker.date}
          </div>

          <div className={styles.badge}>
            Revealing Soon
          </div>
        </div>

        <div className={`date-tabs ${styles.dateTabs}`}>
          {eminentSpeakers.map((speaker, index) => (
            <button
              key={speaker.id}
              onClick={() => handleDateClick(index)}
              className={`date-tab ${styles.dateTab} ${index === activeIndex ? styles.active : ""}`}
            >
              <span className={styles.tabDay}>{speaker.dateFormatted}</span>
              <span className={styles.tabYear}>2026</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
