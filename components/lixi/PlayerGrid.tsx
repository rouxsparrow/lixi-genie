"use client";

import { Player } from "@/lib/lixi/mockData";
import { PlayerCard } from "./PlayerCard";

interface PlayerGridProps {
  players: Player[];
  selectedId: string | null;
  drawnIds: string[];
  onSelect: (playerId: string) => void;
}

export function PlayerGrid({
  players,
  selectedId,
  drawnIds,
  onSelect,
}: PlayerGridProps) {
  return (
    <div
      className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 sm:p-3 
                    shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
    >
      <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span>👥</span> Players ({players.length})
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isSelected={selectedId === player.id}
            isDisabled={drawnIds.includes(player.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
