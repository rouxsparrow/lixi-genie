"use client";

interface DrawButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isDrawing: boolean;
}

export function DrawButton({ onClick, isDisabled, isDrawing }: DrawButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isDrawing}
      aria-label={isDrawing ? "Drawing in progress" : "Draw now"}
      className={`
        relative w-full py-3 sm:py-4 rounded-xl font-black text-base sm:text-lg text-white
        transition-all duration-200 overflow-hidden
        focus:outline-none focus:ring-4 focus:ring-lixi-red/30 focus:ring-offset-2
        ${
          isDisabled || isDrawing
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gradient-to-b from-lixi-red to-lixi-red-dark shadow-[0_6px_0_#B71C1C,0_10px_16px_rgba(229,57,53,0.4)] hover:shadow-[0_4px_0_#B71C1C,0_6px_12px_rgba(229,57,53,0.4)] hover:translate-y-0.5 active:shadow-[0_2px_0_#B71C1C,0_4px_6px_rgba(229,57,53,0.4)] active:translate-y-1"
        }
      `}
    >
      {/* Clay highlight */}
      <span
        className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b 
                       from-white/20 to-transparent rounded-t-xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {isDrawing ? (
          <>
            <span className="animate-spin inline-block">🎲</span>{" "}
            <span className="hidden sm:inline">Drawing...</span>
            <span className="sm:hidden">Draw...</span>
          </>
        ) : (
          <>
            <span className="text-xl">🧧</span>{" "}
            <span className="hidden sm:inline">DRAW NOW!</span>
            <span className="sm:hidden">DRAW!</span>
          </>
        )}
      </span>
    </button>
  );
}
