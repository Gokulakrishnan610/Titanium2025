'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import styles from './CountdownTimer.module.css';

interface CountdownTimerProps {
    targetDate: Date;
}


const digitPatterns: Record<number, Record<number, string>> = {
    0: { 5: '-1em', 8: '-1em', 11: '-1em' },
    1: { 1: '2em', 4: '2em', 7: '2em', 10: '2em', 13: '2em', 2: '1em', 5: '1em', 8: '1em', 11: '1em', 14: '1em' },
    2: { 4: '2em', 5: '1em', 11: '-1em', 12: '-2em' },
    3: { 4: '2em', 10: '2em', 5: '1em', 11: '1em' },
    4: { 2: '-1em', 5: '-1em', 10: '2em', 13: '2em', 11: '1em', 14: '1em' },
    5: { 5: '-1em', 6: '-2em', 10: '2em', 11: '1em' },
    6: { 5: '-1em', 6: '-2em', 11: '1em' },
    7: { 4: '2em', 7: '2em', 10: '2em', 13: '2em', 5: '1em', 8: '1em', 11: '1em', 14: '1em' },
    8: { 5: '1em', 11: '1em' },
    9: { 5: '1em', 11: '1em', 10: '2em' }
};

const digitBlockOffsets = [0, 15, 32, 47, 64, 79, 96, 111];

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
    const [timeRemaining, setTimeRemaining] = useState({
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00'
    });

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const target = targetDate.getTime();
            const difference = target - now;

            if (difference <= 0) {
                return { days: '00', hours: '00', minutes: '00', seconds: '00' };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            return {
                days: days.toString().padStart(2, '0'),
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0')
            };
        };

        const update = () => {
            setTimeRemaining(calculateTimeRemaining());
        };

        update();
        const interval = setInterval(update, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const timeStr = `${timeRemaining.days}${timeRemaining.hours}${timeRemaining.minutes}${timeRemaining.seconds}`;
    const digits = timeStr.split('').map(d => parseInt(d, 10));

    const getBlockTransform = useCallback((blockIndex: number): string | undefined => {
        for (let digitPos = 0; digitPos < 8; digitPos++) {
            const offset = digitBlockOffsets[digitPos];
            const localBlockIndex = blockIndex - offset;
            if (localBlockIndex >= 1 && localBlockIndex <= 15) {
                const digit = digits[digitPos];
                const pattern = digitPatterns[digit];
                if (pattern && pattern[localBlockIndex]) {
                    return `translate3d(${pattern[localBlockIndex]}, 0, 0)`;
                }
            }
        }
        return undefined;
    }, [digits]);

    const blocks = useMemo(() => {
        const blockElements = [];
        for (let i = 1; i <= 126; i++) {
            const transform = getBlockTransform(i);
            blockElements.push(
                <div key={i} className={`${styles.block} ${styles[`b${i}`]}`}>
                    <div
                        className={styles.blockOuter}
                        style={transform ? { transform } : undefined}
                    >
                        <div className={styles.blockInner}>
                            <div className={styles.bottom}></div>
                            <div className={styles.front}></div>
                            <div className={styles.left}></div>
                            <div className={styles.right}></div>
                        </div>
                    </div>
                </div>
            );
        }
        return blockElements;
    }, [getBlockTransform]);

    return (
        <div className={styles.countdownWrapper}>
            <div className={styles.container}>
                <div className={styles.surface}>
                    {blocks}
                </div>
            </div>

            <div className={styles.timeLabels}>
                <span>DAYS</span>
                <span>HOURS</span>
                <span>MINUTES</span>
                <span>SECONDS</span>
            </div>
        </div>
    );
};

export default CountdownTimer;
