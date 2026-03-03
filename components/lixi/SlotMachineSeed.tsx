"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SlotMachineSeedProps {
  seed: string[];
  isSpinning: boolean;
  onLock: () => void;
  onSpin?: () => void;
  onStopSpin?: () => void;
  isLocked: boolean;
  canRoll?: boolean;
}

const emojiPool = [
  "🧧", "🎉", "✨", "🎊", "🎁", "🎯", "🌟", "💎", "🔥", "⚡", "🎀", "🌸", "🍀", "🎲",
];

// Generate a random seed
const generateRandomSeed = (): string[] => [
  emojiPool[Math.floor(Math.random() * emojiPool.length)],
  emojiPool[Math.floor(Math.random() * emojiPool.length)],
  emojiPool[Math.floor(Math.random() * emojiPool.length)],
];

export function SlotMachineSeed({
  seed,
  isSpinning,
  onLock,
  onSpin,
  onStopSpin,
  isLocked,
  canRoll = true,
}: SlotMachineSeedProps) {
  const [displaySeed, setDisplaySeed] = useState<string[]>(["?", "?", "?"]);
  const [hasRolled, setHasRolled] = useState(false);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  // Handle spin state changes from parent
  useEffect(() => {
    if (isSpinning) {
      // Start spinning animation
      setDisplaySeed(generateRandomSeed());
      spinIntervalRef.current = setInterval(() => {
        setDisplaySeed(generateRandomSeed());
      }, 80);
      
      // Auto-stop after 0.5 seconds
      spinTimeoutRef.current = setTimeout(() => {
        if (onStopSpin) {
          onStopSpin();
        }
      }, 500);
    } else {
      // Stop spinning animation
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }
      
      // Show final result when stopped
      if (seed.length === 3) {
        setDisplaySeed(seed);
      }
    }
  }, [isSpinning, onStopSpin, seed]);

  // Update display when seed changes from parent (e.g., when locked)
  useEffect(() => {
    if (!isSpinning && seed.length === 3) {
      setDisplaySeed(seed);
      if (seed[0] !== "?") {
        setHasRolled(true);
      }
    }
  }, [seed, isSpinning]);

  const handleRoll = () => {
    if (!canRoll) return;
    if (!isLocked && !isSpinning && onSpin) {
      setHasRolled(true);
      onSpin();
    }
  };

  return (
    <div className="bg-white/80 rounded-2xl p-3 shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
          <span>🎰</span> Random Seed
        </h3>
        {isLocked && (
          <span
            className="text-[10px] font-medium text-green-600 bg-green-100 
                           px-2 py-0.5 rounded-full"
          >
            🔒 Locked
          </span>
        )}
      </div>

      {/* Emoji Reel Display */}
      <div className="flex justify-center gap-2 mb-3">
        {displaySeed.map((emoji, i) => (
          <div
            key={i}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100
              border-2 flex items-center justify-center text-xl sm:text-2xl
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
              transition-all duration-150
              ${isSpinning 
                ? "border-blue-300 animate-pulse" 
                : hasRolled && !isLocked
                  ? "border-green-300 bg-green-50/50"
                  : "border-gray-200"
              }
            `}
            style={{ animationDelay: `${i * 50}ms` }}
            aria-label={`Seed position ${i + 1}: ${emoji}`}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Roll Button - Click to roll, auto-stops with result */}
        <button
          onClick={handleRoll}
          disabled={isLocked || isSpinning || !canRoll}
          aria-label="Roll the slot machine"
          className={`
            py-2 rounded-xl font-bold text-white text-sm transition-all
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
            ${
              isLocked
                ? "bg-gray-300 cursor-not-allowed"
                : !canRoll
                  ? "bg-gray-300 cursor-not-allowed"
                : isSpinning
                  ? "bg-gradient-to-r from-blue-400 to-blue-500 cursor-wait"
                  : hasRolled
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            }
          `}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className={isSpinning ? "animate-spin" : ""}>🎲</span>
            <span>{isSpinning ? "Rolling..." : hasRolled ? "Roll Again" : "Roll"}</span>
          </span>
        </button>

        {/* Lock Button */}
        <button
          onClick={onLock}
          disabled={isLocked || isSpinning || !hasRolled}
          aria-label={isLocked ? "Seed already locked" : "Lock random seed"}
          className={`
            py-2 rounded-xl font-bold text-white text-sm transition-all
            focus:outline-none focus:ring-2 focus:ring-lixi-gold focus:ring-offset-2
            ${
              isLocked
                ? "bg-gray-400 cursor-not-allowed"
                : isSpinning || !hasRolled
                  ? "bg-amber-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-lixi-gold to-amber-500 hover:from-amber-400 hover:to-amber-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            }
          `}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span>{isLocked ? "🔒" : "🔐"}</span>
            <span>{isLocked ? "Locked" : "Lock"}</span>
          </span>
        </button>
      </div>

      {/* Hint */}
      <p className="mt-2 text-[10px] text-gray-400 text-center">
        {!canRoll
          ? "Select a participant first"
          : isSpinning 
          ? "Rolling..." 
          : hasRolled && !isLocked 
            ? "Not happy? Roll again!" 
            : "Click Roll to start"}
      </p>
    </div>
  );
}
