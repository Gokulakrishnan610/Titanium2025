"use client";
import React, { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

interface TypingLine {
  text: string;
  isComplete: boolean;
  showPrefix: boolean;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [lines, setLines] = useState<TypingLine[]>([]);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const bootSequence = [
      "Starting DEVS REC Radium system...",
      "Loading user authentication...",
      "Connecting to event database...",
      "Setting up membership services...",
      "Initializing payment gateway...",
      "Configuring email notifications...",
      "Preparing user dashboard...",
      "System check complete!",
      "Welcome to Radium Platform!",
    ];

    let lineIndex = 0;
    let charIndex = 0;
    let currentLine = '';
    let phase = 'show_prefix';

    const typeNext = () => {
      if (lineIndex >= bootSequence.length) {
        setTimeout(() => {
          setShowCursor(false);
          setTimeout(() => onComplete(), 800);
        }, 1500);
        return;
      }

      const fullLine = bootSequence[lineIndex];

      if (phase === 'show_prefix') {
        setLines(prev => {
          const newLines = [...prev];
          for (let i = 0; i < newLines.length; i++) {
            if (!newLines[i].isComplete) {
              newLines[i] = { ...newLines[i], isComplete: true, showPrefix: false };
            }
          }
          newLines.push({ text: '', isComplete: false, showPrefix: true });
          return newLines;
        });
        phase = 'pause';
        setTimeout(typeNext, 600);
      } else if (phase === 'pause') {
        phase = 'typing';
        setTimeout(typeNext, 75);
      } else if (phase === 'typing') {
        if (charIndex < fullLine.length) {
          currentLine += fullLine[charIndex];
          charIndex++;
          
          setLines(prev => {
            const newLines = [...prev];
            const currentLineIndex = newLines.length - 1;
            newLines[currentLineIndex] = { text: currentLine, isComplete: false, showPrefix: true };
            return newLines;
          });
          setTimeout(typeNext, 25);
        } else {
          setLines(prev => {
            const newLines = [...prev];
            const currentLineIndex = newLines.length - 1;
            newLines[currentLineIndex] = { text: fullLine, isComplete: true, showPrefix: false };
            return newLines;
          });
          charIndex = 0;
          currentLine = '';
          phase = 'show_prefix';
          lineIndex++;
          setTimeout(typeNext, 150);
        }
      }
    };

    setTimeout(typeNext, 400);

    return () => {
    };
  }, [onComplete]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white font-mono text-sm z-50 terminal-screen">
      <div className="p-6 h-screen flex flex-col relative z-10 terminal-content">
        {/* Header */}
        <div className="mb-4 text-green-400 terminal-header-glow">
          <p className="tracking-wider">DEVS REC Radium System Boot</p>
          <p className="text-xs mt-1">© 2025 Rajalakshmi Engineering College</p>
          <p className="mt-2 text-green-600">-------------------------------------------</p>
        </div>

        {/* Boot lines */}
        <div className="flex-1 terminal-content">
          {lines.map((line, idx) => (
            <p key={idx} className="text-green-400 mb-1 terminal-text-glow font-mono">
              {line.isComplete ? (
                <span>{line.text}</span>
              ) : (
                <>
                  <span className="text-green-500 font-bold">root@devsrec:~#</span> <span>{line.text}</span>
                  {idx === lines.length - 1 && showCursor && <span className="animate-pulse text-green-300">▮</span>}
                </>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}