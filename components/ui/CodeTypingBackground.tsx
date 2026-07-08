"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const DEFAULT_CODE_SNIPPET = `
// Initialize hackathon protocol
import { NeuralInterface } from '@cursor/core';
import { RealityDistortion } from '@cursor/fx';

class CursorHackathon extends Event {
  constructor() {
    super({
      duration: '4h',
      mode: 'intense_focus',
      teams: 20
    });
    
    this.prizePool = 16000;
    this.status = 'READY_TO_LAUNCH';
  }

  async initialize() {
    // System booting...
    await this.connectNeuralNet();
    
    // Optimizing creative output
    const creativity = await this.boost({
      factor: 100,
      caffeine: true
    });
    
    return creativity.deploy();
  }
}

// Start the sequence
const event = new CursorHackathon();
event.initialize().then(() => {
  // Good luck, participants.
});
`;

interface CodeTypingBackgroundProps {
  code?: string;
  typingSpeed?: number; // ms per char
  loopPause?: number; // ms before restart
  className?: string;
}

export function CodeTypingBackground({
  code = DEFAULT_CODE_SNIPPET,
  typingSpeed = 30, // Faster typing for better effect
  loopPause = 5000,
  className = "",
}: CodeTypingBackgroundProps) {
  const [displayedText, setDisplayedText] = useState("");
  // const [isTyping, setIsTyping] = useState(true); // Removed unused state

  // Use refs for animation loop to avoid dependency issues
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    indexRef.current = 0;
    // Don't synchronously set state here if we can avoid it, or use a timeout
    // to push it to the next tick if a reset is strictly required on re-mount.
    // However, since we want to start fresh, we can just reset and start.

    // We rely on initial state "" and let the timeout loop handle updates.
    // This avoids the "synchronous setState in useEffect" warning.

    const typeScalar = () => {
      if (!isMountedRef.current) return;

      const currentCode = code.trim();
      const currentIndex = indexRef.current;

      if (currentIndex < currentCode.length) {
        setDisplayedText(currentCode.substring(0, currentIndex + 1));
        indexRef.current += 1;

        // Randomize speed slightly for realism
        const variance = Math.random() * 20 - 10;
        const speed = Math.max(10, typingSpeed + variance);

        // Pause longer on newlines
        const char = currentCode[currentIndex];
        const delay = char === "\\n" ? speed * 5 : speed;

        timeoutRef.current = setTimeout(typeScalar, delay);
      } else {
        // Finished typing
        // setIsTyping(false);
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            indexRef.current = 0;
            setDisplayedText("");
            // setIsTyping(true);
            typeScalar();
          }
        }, loopPause);
      }
    };

    typeScalar();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, typingSpeed, loopPause]);

  return (
    <div
      className={`font-mono text-sm leading-relaxed overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <pre className="whitespace-pre-wrap break-words">
        <code className="text-[var(--text-muted)] opacity-20">
          {displayedText}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-[var(--accent-blue)] ml-1 translate-y-1 align-middle"
          />
        </code>
      </pre>
    </div>
  );
}
