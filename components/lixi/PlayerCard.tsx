"use client";

import { Player } from "@/lib/lixi/mockData";

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (playerId: string) => void;
}

export function PlayerCard({
  player,
  isSelected,
  isDisabled,
  onSelect,
}: PlayerCardProps) {
  return (
    <button
      onClick={() => !isDisabled && onSelect(player.id)}
      disabled={isDisabled}
      aria-label={`Select player ${player.name}`}
      aria-pressed={isSelected}
      className={`
        relative p-1.5 sm:p-2 rounded-xl border-2 transition-all duration-200
        shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.08)]
        focus:outline-none focus:ring-2 focus:ring-lixi-gold focus:ring-offset-1
        ${
          isSelected
            ? "bg-lixi-red/10 border-lixi-red shadow-lg scale-105"
            : "bg-white border-transparent hover:border-lixi-gold/50"
        }
        ${
          isDisabled
            ? "opacity-50 cursor-not-allowed grayscale"
            : "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
        }
      `}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 rounded-full bg-gradient-to-br 
                      from-lixi-gold to-amber-600 flex items-center justify-center
                      text-base sm:text-lg shadow-inner"
      >
        {player.avatar}
      </div>

      {/* Name */}
      <p className="text-[10px] sm:text-xs font-medium text-center text-gray-800 truncate">
        {player.name}
      </p>

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-lixi-red rounded-full 
                        flex items-center justify-center text-white text-[10px] shadow-md"
          aria-hidden="true"
        >
          ✓
        </div>
      )}

      {/* Drawn overlay */}
      {isDisabled && (
        <div
          className="absolute inset-0 flex items-center justify-center 
                        bg-gray-100/80 rounded-xl"
          aria-label="Already drawn"
        >
          <span className="text-lg sm:text-xl">✓</span>
        </div>
      )}
    </button>
  );
}
