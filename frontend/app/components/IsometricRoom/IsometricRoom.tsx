"use client";

import { useEffect, useRef } from "react";
import "./isometricRoom.css";

export default function IsometricRoom() {
    const containerRef = useRef<HTMLDivElement>(null);
    const houseRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        houseRef.current = containerRef.current.querySelector("#h") as HTMLDivElement;

        const handlePointerMove = (e: PointerEvent) => {
            if (!houseRef.current) return;
            const x = e.pageX / window.innerWidth - 0.5;
            const y = e.pageY / window.innerHeight - 0.5;
            houseRef.current.style.transform = `
                perspective(90vw)
                rotateX(${y * 10 + 75}deg)
                rotateZ(${-x * 25 + 45}deg)
                translateZ(-9vw)
            `;
        };

        document.body.addEventListener("pointermove", handlePointerMove);
        return () => {
            document.body.removeEventListener("pointermove", handlePointerMove);
        };
    }, []);

    return (
        <div ref={containerRef} className="isometric-room-container">
            <style>{`
                .isometric-room-container,
                .isometric-room-container *,
                .isometric-room-container *::after,
                .isometric-room-container *::before {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    user-select: none;
                    transform-style: preserve-3d;
                    -webkit-tap-highlight-color: transparent;
                }
                .isometric-room-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100vh;
                    overflow: hidden;
                    cursor: default;
                    background-image: radial-gradient(circle, #171424, black);
                }
                .face { position: absolute; }
                .house { position: absolute; width: 28vw; height: 28vw; transform: perspective(90vw) rotateX(75deg) rotateZ(45deg) translateZ(-9vw); }
                .h-shadow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; box-shadow: 1.5vw -3vw 3vw black, 1.5vw 0.5vw 1.5vw black; }
                .h-lights { position: absolute; top: 50%; left: 50%; transform: translateX(-50%) translateY(-50%); width: 45vw; height: 45vw; }
                .h-light { position: absolute; }
                .h-light:nth-of-type(1) { bottom: 5vw; right: 0; width: 14vw; height: 14vw; border-radius: 50%; background-image: radial-gradient(#1b182a, transparent); filter: blur(1vw); }
                .h-light:nth-of-type(2) { bottom: 18vw; right: -1vw; width: 2vw; height: 12vw; border-radius: 50%; transform: rotateZ(-50deg); background-image: radial-gradient(rgba(81, 137, 251, 0.45) 50%, rgba(40, 125, 210, 0.45), transparent); box-shadow: -1vw -1vw 2vw 1vw rgba(131, 171, 252, 0.1); filter: blur(1vw); }
                .h-light:nth-of-type(3) { bottom: -2vw; right: 17vw; width: 5vw; height: 12vw; border-radius: 50%; transform: rotateZ(-50deg); background-image: radial-gradient(rgba(81, 137, 251, 0.5) 50%, rgba(40, 125, 210, 0.5), transparent); filter: blur(2vw); }
                .h-light:nth-of-type(3)::before, .h-light:nth-of-type(3)::after { content: ""; position: absolute; width: 200%; top: -6vw; height: 400%; background-image: linear-gradient(to bottom, rgba(40, 125, 210, 0.1), rgba(81, 137, 251, 0.1), transparent); border-top-left-radius: 10vw; border-top-right-radius: 10vw; filter: blur(1.5vw); }
                .h-light:nth-of-type(3)::before { right: -50%; transform-origin: top right; transform: rotateZ(15deg); box-shadow: -2vw -2vw 0 rgba(81, 137, 251, 0.075); }
                .h-light:nth-of-type(3)::after { left: -50%; transform-origin: top left; transform: rotateZ(-15deg); box-shadow: 2vw -2vw 0 rgba(81, 137, 251, 0.075); }
                .h-light:nth-of-type(4) { bottom: 5vw; left: 8vw; width: 28vw; height: 4vw; transform-origin: top left; transform: skewX(58deg); background-image: linear-gradient(to right, rgba(81, 137, 251, 0.075) 10%, transparent 25%, transparent, rgba(0, 0, 0, 0.15)); filter: blur(0.25vw); }
                .h-light:nth-of-type(6) { bottom: 14vw; right: 2vw; width: 8vw; height: 16vw; transform-origin: bottom left; transform: skewY(49deg); background-image: linear-gradient(to left, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.7)); filter: blur(0.35vw); }
                .alt { position: absolute; left: 0; top: 0; width: 27vw; height: 27vw; }
                .alt__front { width: 27vw; height: 0.5vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(26.5vw); background-color: #9E99C1; }
                .alt__back { width: 27vw; height: 0.5vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-27vw) translateY(-0.5vw); background-color: #383358; }
                .alt__right { width: 27vw; height: 0.5vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(27vw) translateX(-27vw) translateY(-0.5vw); background-color: #383358; }
                .alt__left { width: 27vw; height: 0.5vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-0.5vw); background-color: #FBFAFE; }
                .alt__top { width: 27vw; height: 27vw; transform-origin: top left; transform: translateZ(0.5vw); background-image: linear-gradient(to bottom, #0b0c1f, #383358, #9E99C1); }
                .alt__bottom { width: 27vw; height: 27vw; transform-origin: top left; transform: rotateY(180deg) translateX(-27vw); background-color: #383358; }
                .alt__top .light:nth-of-type(1) { position: absolute; height: 100%; width: 100%; background-image: linear-gradient(to bottom, rgba(20, 61, 103, 0.75), rgba(81, 137, 251, 0.75), transparent); }
                .alt__top .light:nth-of-type(2) { position: absolute; left: 4vw; height: 100%; width: 6vw; background-image: linear-gradient(to bottom, transparent 20%, rgba(40, 125, 210, 0.75), rgba(81, 137, 251, 0.25) 80%); filter: blur(0.1vw); }
                .alt__top .light:nth-of-type(3) { position: absolute; bottom: 10vw; left: 5vw; width: 6vw; height: 3vw; border-radius: 50%; transform: rotateZ(42deg); background-image: radial-gradient(rgba(131, 171, 252, 0.75) 50%, rgba(32, 99, 167, 0.75)); filter: blur(0.55vw); }
                .alt__top .light:nth-of-type(4) { position: absolute; bottom: 7vw; left: 4vw; width: 8.5vw; height: 2vw; border-radius: 50%; transform: rotateZ(40deg); background-image: radial-gradient(rgba(131, 171, 252, 0.75) 50%, rgba(32, 99, 167, 0.75)); filter: blur(0.55vw); }
                .alt__top .light:nth-of-type(5) { position: absolute; bottom: 3.5vw; left: 4.5vw; width: 6vw; height: 2vw; border-radius: 50%; transform: rotateZ(40deg); background-image: radial-gradient(rgba(141, 178, 252, 0.75) 50%, rgba(32, 99, 167, 0.75)); filter: blur(0.75vw); }
                .alt__top .light:nth-of-type(6) { position: absolute; bottom: 3vw; left: 0.5vw; width: 4vw; height: 2vw; border-radius: 50%; transform: rotateZ(40deg); background-image: radial-gradient(rgba(141, 178, 252, 0.75) 50%, rgba(32, 99, 167, 0.75)); filter: blur(0.35vw); }
                .alt__top .light:nth-of-type(7) { position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(to right, black, #5189fb 10%, transparent 20%); }
                .alt__top .light:nth-of-type(7)::before { content: ""; position: absolute; width: 20%; height: 100%; background-image: linear-gradient(to right, rgba(5, 70, 199, 0.6), transparent 60%); }
                .alt__top .light:nth-of-type(7)::after { content: ""; position: absolute; width: 100%; height: 20%; background-image: linear-gradient(to bottom, rgba(6, 78, 224, 0.5), transparent 60%); }
                .alt__top .light:nth-of-type(8) { position: absolute; bottom: 5vw; left: 10vw; width: 6vw; height: 4vw; border-radius: 50%; transform: rotateZ(40deg); background-image: radial-gradient(rgba(255, 255, 255, 0.1) 50%, rgba(128, 121, 174, 0.1)); filter: blur(0.8vw); }
                .alb { position: absolute; left: 0; bottom: 0; width: 27vw; height: 1vw; }
                .alb__front { width: 27vw; height: 2vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(-1vw); background-image: url("/rec.png"), linear-gradient(to right, #9E99C1 40%, #8f89b7); background-size: contain, cover; background-repeat: no-repeat; background-position: left 10px center, 0 0; }
                .alb__back { width: 27vw; height: 2vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-27vw) translateY(-2vw); background-color: #383358; }
                .alb__right { width: 1vw; height: 2vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(27vw) translateX(-1vw) translateY(-2vw); background-color: #383358; }
                .alb__left { width: 1vw; height: 2vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-2vw); background-color: #FBFAFE; }
                .alb__top { width: 27vw; height: 1vw; transform-origin: top left; transform: translateZ(2vw); background-image: linear-gradient(to right, #FBFAFE 40%, #eae5fa); }
                .alb__bottom { width: 27vw; height: 1vw; transform-origin: top left; transform: rotateY(180deg) translateX(-27vw); background-color: #383358; }
                .arb { position: absolute; right: 0; bottom: 0; width: 1vw; height: 28vw; }
                .arb__front { width: 1vw; height: 2vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(26vw); background-color: #8f89b7; }
                .arb__back { width: 1vw; height: 2vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-1vw) translateY(-2vw); background-color: #383358; }
                .arb__right { width: 28vw; height: 2vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(1vw) translateX(-28vw) translateY(-2vw); background-image: linear-gradient(to right, #282347 40%, #0f0e17); }
                .arb__left { width: 28vw; height: 2vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-2vw); background-color: #9E99C1; }
                .arb__top { width: 1vw; height: 28vw; transform-origin: top left; transform: translateZ(2vw); background-image: linear-gradient(to top, #FBFAFE, #3b3469 25%, #2e2a48 75%, #9E99C1); }
                .arb__top::before { content: ""; position: absolute; width: 100%; height: 30%; top: 0; background-image: linear-gradient(to bottom, transparent, rgba(81, 137, 251, 0.85), transparent); }
                .arb__bottom { width: 1vw; height: 28vw; transform-origin: top left; transform: rotateY(180deg) translateX(-1vw); background-color: #383358; }
                .blt { position: absolute; left: 0; top: 0; width: 1vw; height: 27vw; transform: translateZ(0.5vw); }
                .blt__front { width: 1vw; height: 20vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(7vw); background-image: linear-gradient(to bottom, #383358, #9E99C1); }
                .blt__back { width: 1vw; height: 20vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-1vw) translateY(-20vw); background-color: #383358; }
                .blt__right { width: 27vw; height: 20vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(1vw) translateX(-27vw) translateY(-20vw); background-image: linear-gradient(to bottom, #151225, #383358, #383358 90%, #242040); }
                .blt__right::before { content: ""; position: absolute; bottom: 0; width: 100%; height: 0.75vw; background-image: linear-gradient(to bottom, #8f89b7, #287dd2); border-top: 0.1vw solid #282347; border-bottom: 0.1vw solid #282347; }
                .blt__right::after { content: ""; position: absolute; width: 100%; height: 100%; background-image: linear-gradient(to bottom, rgba(6, 78, 224, 0.35), transparent 30%, transparent 70%, rgba(40, 125, 210, 0.35)); }
                .blt__left { width: 27vw; height: 20vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-20vw); background-color: #FBFAFE; }
                .blt__top { width: 1vw; height: 27vw; transform-origin: top left; transform: translateZ(20vw); }
                .blt__bottom { width: 1vw; height: 27vw; transform-origin: top left; transform: rotateY(180deg) translateX(-1vw); background-color: #383358; }
                .blt2 { position: absolute; left: 0; top: 0; width: 2vw; height: 27vw; transform: translateZ(20.5vw); }
                .blt2__front { width: 2vw; height: 0.75vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(26.25vw); background-color: #383358; }
                .blt2__back { width: 2vw; height: 0.75vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-2vw) translateY(-0.75vw); background-color: #383358; }
                .blt2__right { width: 27vw; height: 0.75vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(2vw) translateX(-27vw) translateY(-0.75vw); background-image: linear-gradient(to right, #8f89b7, #9E99C1, #7169a4); }
                .blt2__right::before { content: ""; position: absolute; width: 100%; height: 100%; bottom: 0; border-bottom: 0.1vw solid rgba(251, 250, 254, 0.75); background-image: linear-gradient(to top, rgba(81, 137, 251, 0.35), transparent); }
                .blt2__left { width: 27vw; height: 0.75vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-0.75vw); background-color: #FBFAFE; }
                .blt2__top { width: 2vw; height: 27vw; transform-origin: top left; transform: translateZ(0.75vw); background-image: linear-gradient(to top, #9E99C1, #FBFAFE); }
                .blt2__bottom { width: 2vw; height: 27vw; transform-origin: top left; transform: rotateY(180deg) translateX(-2vw); background-color: #383358; }
                .blb { position: absolute; left: 1vw; top: 0; width: 26vw; height: 1vw; transform: translateZ(0.5vw); }
                .blb__front { width: 26vw; height: 20vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(-19vw); background-image: linear-gradient(to bottom, #4b4572, #595388 20%, #4b4572); }
                .blb__front::before { content: ""; position: absolute; width: 100%; height: 100%; background-image: linear-gradient(to bottom, rgba(40, 125, 210, 0.25), transparent 20%, transparent 80%, rgba(40, 125, 210, 0.5)), linear-gradient(to right, rgba(31, 33, 88, 0.35), transparent), linear-gradient(to bottom, rgba(31, 33, 88, 0.35), transparent), linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent 20%, transparent 80%, rgba(40, 125, 210, 0.25)); }
                .blb__front::after { content: ""; position: absolute; bottom: 0; width: 100%; height: 0.75vw; background-image: linear-gradient(to bottom, #8f89b7, #287dd2); border-top: 0.1vw solid #282347; border-bottom: 0.1vw solid #282347; }
                .blb__back { width: 26vw; height: 20vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-26vw) translateY(-20vw); background-color: #383358; }
                .blb__right { width: 1vw; height: 20vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(26vw) translateX(-1vw) translateY(-20vw); background-image: linear-gradient(to bottom, #151225, #0f0e17 80%, #151225); }
                .blb__top { width: 26vw; height: 1vw; transform-origin: top left; transform: translateZ(20vw); }
                .blb__bottom { width: 26vw; height: 1vw; transform-origin: top left; transform: rotateY(180deg) translateX(-26vw); background-color: #383358; }
                .blb2 { position: absolute; left: 2vw; top: 0; width: 25vw; height: 1vw; transform: translateZ(20.5vw); }
                .blb2__front { width: 25vw; height: 0.75vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(1.25vw); background-image: linear-gradient(to right, #7169a4, #9E99C1, #8f89b7); }
                .blb2__front::before { content: ""; position: absolute; width: 100%; height: 100%; bottom: 0; border-bottom: 0.1vw solid rgba(251, 250, 254, 0.75); background-image: linear-gradient(to top, rgba(40, 125, 210, 0.25), transparent); }
                .blb2__back { width: 25vw; height: 0.75vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-25vw) translateY(-0.75vw); background-color: #383358; }
                .blb2__right { width: 2vw; height: 0.75vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(25vw) translateX(-2vw) translateY(-0.75vw); background-color: #151225; }
                .blb2__left { width: 2vw; height: 0.75vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-0.75vw); background-color: #9E99C1; }
                .blb2__top { width: 25vw; height: 2vw; transform-origin: top left; transform: translateZ(0.75vw); background-image: linear-gradient(to left, #9E99C1, #FBFAFE); }
                .blb2__bottom { width: 25vw; height: 2vw; transform-origin: top left; transform: rotateY(180deg) translateX(-25vw); background-color: #383358; }
                .puerta-c { position: absolute; left: 3vw; top: 1vw; width: 8vw; height: 0.5vw; transform: translateZ(0.5vw); }
                .puerta-c::before { content: ""; position: absolute; width: 100%; height: 200%; background-color: rgba(0, 0, 0, 0.65); filter: blur(0.5vw); }
                .puerta { position: absolute; left: 0.5vw; top: 0; width: 7vw; height: 0.5vw; }
                .puerta__front { width: 7vw; height: 16vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(-15.75vw); background-image: linear-gradient(to bottom, #0F1110, #121332); border: 0.125vw solid #5189fb; }
                .puerta__front::before { content: ""; position: absolute; width: 100%; height: 100%; background-image: radial-gradient(transparent 50%, rgba(4, 61, 174, 0.25)); box-shadow: 0.65vw 0.65vw 0.5vw rgba(81, 137, 251, 0.6), -0.65vw 0.65vw 0.5vw rgba(81, 137, 251, 0.6), -0.65vw -0.65vw 0.5vw rgba(81, 137, 251, 0.6), 0.65vw -0.65vw 0.5vw rgba(81, 137, 251, 0.6); }
                .puerta__front::after { content: ""; position: absolute; top: 50%; right: 0.75vw; width: 1vw; height: 0.25vw; background-color: #9E99C1; box-shadow: 0.125vw 0.125vw 0.25vw rgba(81, 137, 251, 0.6), -0.125vw 0.125vw 0.25vw rgba(81, 137, 251, 0.6), -0.125vw -0.125vw 0.25vw rgba(81, 137, 251, 0.6), 0.125vw -0.125vw 0.25vw rgba(81, 137, 251, 0.6); }
                .puerta__back { width: 7vw; height: 16vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-7vw) translateY(-16vw); }
                .puerta__right { width: 0.25vw; height: 16vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(7vw) translateX(-0.25vw) translateY(-16vw); }
                .puerta__left { width: 0.25vw; height: 16vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-16vw); }
                .puerta__top { width: 7vw; height: 0.25vw; transform-origin: top left; transform: translateZ(16vw); }
                .puerta__bottom { width: 7vw; height: 0.25vw; transform-origin: top left; transform: rotateY(180deg) translateX(-7vw); }
                .puerta-l, .puerta-r { position: absolute; left: 0; top: 0; width: 0.5vw; height: 0.5vw; }
                .puerta-l__front, .puerta-r__front { width: 0.5vw; height: 16vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(-15.5vw); background-color: #121332; }
                .puerta-l__back, .puerta-r__back { width: 0.5vw; height: 16vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-0.5vw) translateY(-16vw); background-color: #0b0c1f; }
                .puerta-l__right, .puerta-r__right { width: 0.5vw; height: 16vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(0.5vw) translateX(-0.5vw) translateY(-16vw); background-color: #0b0c1f; }
                .puerta-l__left, .puerta-r__left { width: 0.5vw; height: 16vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-16vw); background-color: #121332; }
                .puerta-l__top, .puerta-r__top { width: 0.5vw; height: 0.5vw; transform-origin: top left; transform: translateZ(16vw); }
                .puerta-l__bottom, .puerta-r__bottom { width: 0.5vw; height: 0.5vw; transform-origin: top left; transform: rotateY(180deg) translateX(-0.5vw); background-color: #0b0c1f; }
                .puerta-r { left: calc(100% - .5vw); }
                .puerta-t { left: 0; top: 0; width: 8vw; height: 0.5vw; transform: translateZ(16vw); }
                .puerta-t__front { width: 8vw; height: 0.5vw; transform-origin: bottom left; transform: rotateX(-90deg) translateZ(0vw); background-color: #121332; }
                .puerta-t__back { width: 8vw; height: 0.5vw; transform-origin: top left; transform: rotateX(-90deg) rotateY(180deg) translateX(-8vw) translateY(-0.5vw); background-color: #0b0c1f; }
                .puerta-t__right { width: 0.5vw; height: 0.5vw; transform-origin: top left; transform: rotateY(90deg) rotateZ(-90deg) translateZ(8vw) translateX(-0.5vw) translateY(-0.5vw); background-color: #0b0c1f; }
                .puerta-t__left { width: 0.5vw; height: 0.5vw; transform-origin: top left; transform: rotateY(-90deg) rotateZ(90deg) translateY(-0.5vw); background-color: #121332; }
                .puerta-t__top { width: 8vw; height: 0.5vw; transform-origin: top left; transform: translateZ(0.5vw); background-color: #1f2158; }
                .puerta-t__bottom { width: 8vw; height: 0.5vw; transform-origin: top left; transform: rotateY(180deg) translateX(-8vw); background-color: #0b0c1f; }
                
                /* Mobile Responsive - Use zoom to scale up while keeping proper alignment */
                @media (max-width: 768px) {
                    .isometric-room-container { 
                        padding-top: 10vh;
                    }
                    .house {
                        zoom: 1.8;
                    }
                }
                @media (max-width: 480px) {
                    .isometric-room-container { 
                        padding-top: 15vh;
                    }
                    .house {
                        zoom: 2.3;
                    }
                }
                @media (max-width: 360px) {
                    .house {
                        zoom: 2.5;
                    }
                }
            `}</style>
            <div className="house" id="h">
                <div className="h-lights">
                    <div className="h-light"></div>
                    <div className="h-light"></div>
                    <div className="h-light"></div>
                    <div className="h-light"></div>
                    <div className="h-light"></div>
                    <div className="h-light"></div>
                </div>
                <div className="h-shadow"></div>
                <div className="alt">
                    <div className="alt__front face"></div>
                    <div className="alt__back face"></div>
                    <div className="alt__right face"></div>
                    <div className="alt__left face"></div>
                    <div className="alt__top face">
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                        <div className="light"></div>
                    </div>
                    <div className="alt__bottom face"></div>
                </div>
                <div className="alb">
                    <div className="alb__front face"></div>
                    <div className="alb__back face"></div>
                    <div className="alb__right face"></div>
                    <div className="alb__left face"></div>
                    <div className="alb__top face"></div>
                    <div className="alb__bottom face"></div>
                </div>
                <div className="arb">
                    <div className="arb__front face"></div>
                    <div className="arb__back face"></div>
                    <div className="arb__right face"></div>
                    <div className="arb__left face"></div>
                    <div className="arb__top face"></div>
                    <div className="arb__bottom face"></div>
                </div>
                <div className="blt">
                    <div className="blt__front face"></div>
                    <div className="blt__back face"></div>
                    <div className="blt__right face"></div>
                    <div className="blt__left face"></div>
                    <div className="blt__top face"></div>
                    <div className="blt__bottom face"></div>
                </div>
                <div className="blt2">
                    <div className="blt2__front face"></div>
                    <div className="blt2__back face"></div>
                    <div className="blt2__right face"></div>
                    <div className="blt2__left face"></div>
                    <div className="blt2__top face"></div>
                    <div className="blt2__bottom face"></div>
                </div>
                <div className="blb">
                    <div className="blb__front face"></div>
                    <div className="blb__back face"></div>
                    <div className="blb__right face"></div>
                    <div className="blb__left face"></div>
                    <div className="blb__top face"></div>
                    <div className="blb__bottom face"></div>
                </div>
                <div className="blb2">
                    <div className="blb2__front face"></div>
                    <div className="blb2__back face"></div>
                    <div className="blb2__right face"></div>
                    <div className="blb2__left face"></div>
                    <div className="blb2__top face"></div>
                    <div className="blb2__bottom face"></div>
                </div>
                <div className="puerta-c">
                    <div className="puerta">
                        <div className="puerta__front face"></div>
                        <div className="puerta__back face"></div>
                        <div className="puerta__right face"></div>
                        <div className="puerta__left face"></div>
                        <div className="puerta__top face"></div>
                        <div className="puerta__bottom face"></div>
                    </div>
                    <div className="puerta-l">
                        <div className="puerta-l__front face"></div>
                        <div className="puerta-l__back face"></div>
                        <div className="puerta-l__right face"></div>
                        <div className="puerta-l__left face"></div>
                        <div className="puerta-l__top face"></div>
                        <div className="puerta-l__bottom face"></div>
                    </div>
                    <div className="puerta-r">
                        <div className="puerta-r__front face"></div>
                        <div className="puerta-r__back face"></div>
                        <div className="puerta-r__right face"></div>
                        <div className="puerta-r__left face"></div>
                        <div className="puerta-r__top face"></div>
                        <div className="puerta-r__bottom face"></div>
                    </div>
                    <div className="puerta-t">
                        <div className="puerta-t__front face"></div>
                        <div className="puerta-t__back face"></div>
                        <div className="puerta-t__right face"></div>
                        <div className="puerta-t__left face"></div>
                        <div className="puerta-t__top face"></div>
                        <div className="puerta-t__bottom face"></div>
                    </div>
                </div>

                <div className="cuadro-l">
                    <div className="cuadro-l__front face"></div>
                    <div className="cuadro-l__back face"></div>
                    <div className="cuadro-l__right face"></div>
                    <div className="cuadro-l__left face"></div>
                    <div className="cuadro-l__top face"></div>
                    <div className="cuadro-l__bottom face"></div>
                </div>
                <div className="cuadro-r">
                    <div className="cuadro-r__front face"></div>
                    <div className="cuadro-r__back face"></div>
                    <div className="cuadro-r__right face"></div>
                    <div className="cuadro-r__left face"></div>
                    <div className="cuadro-r__top face"></div>
                    <div className="cuadro-r__bottom face"></div>
                </div>

                <div className="librero">
                    <div className="librero__front face"></div>
                    <div className="librero__back face"></div>
                    <div className="librero__right face"></div>
                    <div className="librero__left face"></div>
                    <div className="librero__top face"></div>
                    <div className="librero__bottom face"></div>
                </div>

                <div className="libros">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="libro">
                            <div className="libro__front face"></div>
                            <div className="libro__back face"></div>
                            <div className="libro__right face"></div>
                            <div className="libro__left face"></div>
                            <div className="libro__top face"></div>
                            <div className="libro__bottom face"></div>
                        </div>
                    ))}
                </div>

                <div className="fotos">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="foto">
                            <div className="foto__front face"></div>
                            <div className="foto__back face"></div>
                            <div className="foto__right face"></div>
                            <div className="foto__left face"></div>
                            <div className="foto__top face"></div>
                            <div className="foto__bottom face"></div>
                        </div>
                    ))}
                </div>

                <div className="cajas">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="caja">
                            <div className="caja__front face"></div>
                            <div className="caja__back face"></div>
                            <div className="caja__right face"></div>
                            <div className="caja__left face"></div>
                            <div className="caja__top face"></div>
                            <div className="caja__bottom face"></div>
                        </div>
                    ))}
                </div>

                <a href="/easter1ez" target="_blank" rel="noopener noreferrer" className="tv-link">
                    <div className="tv">
                        <div className="tv__front face"></div>
                        <div className="tv__back face"></div>
                        <div className="tv__right face"></div>
                        <div className="tv__left face"></div>
                        <div className="tv__top face"></div>
                        <div className="tv__bottom face"></div>
                    </div>
                </a>

                <div className="repisa-t">
                    <div className="repisa-t__front face"></div>
                    <div className="repisa-t__back face"></div>
                    <div className="repisa-t__right face"></div>
                    <div className="repisa-t__left face"></div>
                    <div className="repisa-t__top face"></div>
                    <div className="repisa-t__bottom face"></div>
                </div>
                <div className="repisa-b">
                    <div className="repisa-b__front face"></div>
                    <div className="repisa-b__back face"></div>
                    <div className="repisa-b__right face"></div>
                    <div className="repisa-b__left face"></div>
                    <div className="repisa-b__top face"></div>
                    <div className="repisa-b__bottom face"></div>
                </div>

                <div className="bocina-l">
                    <div className="bocina-l__front face"></div>
                    <div className="bocina-l__back face"></div>
                    <div className="bocina-l__right face"></div>
                    <div className="bocina-l__left face"></div>
                    <div className="bocina-l__top face"></div>
                    <div className="bocina-l__bottom face"></div>
                </div>
                <div className="bocina-r">
                    <div className="bocina-r__front face"></div>
                    <div className="bocina-r__back face"></div>
                    <div className="bocina-r__right face"></div>
                    <div className="bocina-r__left face"></div>
                    <div className="bocina-r__top face"></div>
                    <div className="bocina-r__bottom face"></div>
                </div>

                <div className="muro">
                    <div className="muro__front face"></div>
                    <div className="muro__back face"></div>
                    <div className="muro__right face"></div>
                    <div className="muro__left face"></div>
                    <div className="muro__top face"></div>
                    <div className="muro__bottom face"></div>
                </div>

                <div className="sillon-c">
                    <div className="sillon-b">
                        <div className="sillon-b__front face"></div>
                        <div className="sillon-b__back face"></div>
                        <div className="sillon-b__right face"></div>
                        <div className="sillon-b__left face"></div>
                        <div className="sillon-b__top face"></div>
                        <div className="sillon-b__bottom face"></div>
                    </div>
                    <div className="sillon-t">
                        <div className="sillon-t__front face"></div>
                        <div className="sillon-t__back face"></div>
                        <div className="sillon-t__right face"></div>
                        <div className="sillon-t__left face"></div>
                        <div className="sillon-t__top face"></div>
                        <div className="sillon-t__bottom face"></div>
                    </div>
                    <div className="sillon-l">
                        <div className="sillon-l__front face"></div>
                        <div className="sillon-l__back face"></div>
                        <div className="sillon-l__right face"></div>
                        <div className="sillon-l__left face"></div>
                        <div className="sillon-l__top face"></div>
                        <div className="sillon-l__bottom face"></div>
                    </div>
                    <div className="sillon-r">
                        <div className="sillon-r__front face"></div>
                        <div className="sillon-r__back face"></div>
                        <div className="sillon-r__right face"></div>
                        <div className="sillon-r__left face"></div>
                        <div className="sillon-r__top face"></div>
                        <div className="sillon-r__bottom face"></div>
                    </div>
                </div>

                <div className="mesa-c">
                    <div className="mesa">
                        <div className="mesa__front face"></div>
                        <div className="mesa__back face"></div>
                        <div className="mesa__right face"></div>
                        <div className="mesa__left face"></div>
                        <div className="mesa__top face"></div>
                        <div className="mesa__bottom face"></div>
                    </div>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="mesa-p">
                            <div className="mesa-p__front face"></div>
                            <div className="mesa-p__back face"></div>
                            <div className="mesa-p__right face"></div>
                            <div className="mesa-p__left face"></div>
                            <div className="mesa-p__top face"></div>
                            <div className="mesa-p__bottom face"></div>
                        </div>
                    ))}
                    <div className="mesa-shadow"></div>
                </div>

                <div className="tablet">
                    <div className="tablet__front face"></div>
                    <div className="tablet__back face"></div>
                    <div className="tablet__right face"></div>
                    <div className="tablet__left face"></div>
                    <div className="tablet__top face"></div>
                    <div className="tablet__bottom face"></div>
                </div>
            </div>
        </div>
    );
}
