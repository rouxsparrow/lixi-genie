"use client";

import { formatSGD } from "@/lib/format/currency";

interface PrizeRevealPanelProps {
  prize: {
    id: string;
    name: string;
    amount: number;
  } | null;
  isVisible: boolean;
  isVoid: boolean;
}

export function PrizeRevealPanel({
  prize,
  isVisible,
  isVoid,
}: PrizeRevealPanelProps) {
  if (!isVisible) return null;

  return (
    <div
      className={`
        relative rounded-2xl p-3 sm:p-4 text-center overflow-hidden
        animate-fade-in-up
        ${
          isVoid
            ? "bg-gray-100 border-2 border-gray-300"
            : "bg-gradient-to-br from-lixi-gold/20 to-lixi-red/10 border-2 border-lixi-gold"
        }
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Confetti decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <span className="absolute top-1 left-3 text-base">🎉</span>
        <span className="absolute top-2 right-4 text-base">✨</span>
        <span className="absolute bottom-1 left-6 text-base">🎊</span>
        <span className="absolute bottom-2 right-6 text-base">🎁</span>
      </div>

      {isVoid ? (
        <div className="relative">
          <div
            className="text-3xl sm:text-4xl mb-1 grayscale"
            aria-hidden="true"
          >
            🚫
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
              VOID
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-700">Draw Cancelled</h3>
          <p className="text-xs text-gray-500">Seed was not locked before draw</p>
        </div>
      ) : (
        <div className="relative">
          <div
            className="text-3xl sm:text-4xl mb-1 animate-bounce"
            aria-hidden="true"
          >
            🧧
          </div>
          <h3 className="text-sm sm:text-base text-gray-600 mb-1">
            Congratulations!
          </h3>
          <p className="text-xl sm:text-2xl font-black text-lixi-red">
            {formatSGD(prize?.amount ?? 0)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{prize?.name}</p>
        </div>
      )}
    </div>
  );
}
