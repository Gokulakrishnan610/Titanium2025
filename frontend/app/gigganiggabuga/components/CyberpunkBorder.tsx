"use client";

interface CyberpunkBorderProps {
  className?: string;
  glowColor?: string;
  animated?: boolean;
}

export default function CyberpunkBorder({ 
  className = "", 
  glowColor = "#C0C0C0",
  animated = true 
}: CyberpunkBorderProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 400 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {animated && (
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0">
              <animate
                attributeName="offset"
                values="0;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={glowColor} stopOpacity="1">
              <animate
                attributeName="offset"
                values="0;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={glowColor} stopOpacity="0">
              <animate
                attributeName="offset"
                values="0;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}
      </defs>

      <path
        d="M 30 0 L 370 0 L 400 30 L 400 570 L 370 600 L 30 600 L 0 570 L 0 30 Z"
        stroke={animated ? "url(#scanGradient)" : glowColor}
        strokeWidth="2"
        fill="none"
        filter="url(#glow)"
        opacity="0.8"
      />

      <g opacity="0.6">
        <path d="M 10 30 L 30 30 L 30 10" stroke={glowColor} strokeWidth="1" />
        <circle cx="30" cy="30" r="2" fill={glowColor} />
        <path d="M 15 25 L 25 25 L 25 15" stroke={glowColor} strokeWidth="0.5" opacity="0.5" />
      </g>

      <g opacity="0.6">
        <path d="M 10 570 L 20 570 L 10 580" stroke={glowColor} strokeWidth="1" />
        <path d="M 15 570 L 20 575" stroke={glowColor} strokeWidth="0.5" opacity="0.5" />
      </g>

      <g opacity="0.6">
        <path d="M 390 580 L 380 590 L 370 590" stroke={glowColor} strokeWidth="1" />
        <circle cx="380" cy="585" r="2" fill={glowColor} />
      </g>

      <g stroke={glowColor} strokeWidth="1.5" opacity="0.5">
        <path d="M 40 15 L 25 15 L 15 25 L 15 40" />
        
        <path d="M 40 585 L 25 585 L 15 575 L 15 560" />
        
        <path d="M 360 585 L 375 585 L 385 575 L 385 560" />
      </g>

      <g stroke={glowColor} strokeWidth="0.5" opacity="0.3">
        <path d="M 50 20 L 100 20 L 105 15" />
        <circle cx="75" cy="20" r="1" fill={glowColor} />
      </g>

      <g opacity="0.4">
        <path
          d="M 200 10 L 205 15 L 205 20 L 200 25 L 195 20 L 195 15 Z"
          stroke={glowColor}
          strokeWidth="0.5"
          fill="none"
        />
      </g>
    </svg>
  );
}
