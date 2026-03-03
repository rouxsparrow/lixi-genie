"use client";

import { useState } from "react";

interface SeedRevealPanelProps {
  serverSeed: string;
  commitmentHash: string;
  isValid: boolean;
}

export function SeedRevealPanel({
  serverSeed,
  commitmentHash,
  isValid,
}: SeedRevealPanelProps) {
  const [showSeed, setShowSeed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md border-2 border-green-200 overflow-hidden">
      {/* Header - Clickable to collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-green-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <span className="text-lg">🔓</span>
            <span>Server Seed Revealed</span>
          </h3>
          <span
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
              isValid
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isValid ? "✅ Verified" : "❌ Invalid"}
          </span>
        </div>
        <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {/* Server Seed Display */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                Server Seed (SHA256)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSeed(!showSeed);
                }}
                className="text-[10px] sm:text-xs text-lixi-gold hover:text-amber-600 font-medium transition-colors"
              >
                {showSeed ? "🙈 Hide" : "👁️ Show"}
              </button>
            </div>
            <div
              className={`font-mono text-[10px] sm:text-xs p-2 rounded-lg border break-all transition-all ${
                showSeed
                  ? "bg-gray-800 text-green-400 border-gray-700"
                  : "bg-gray-100 text-gray-400 border-gray-200"
              }`}
            >
              {showSeed
                ? serverSeed
                : "••••••••••••••••••••••••••••••••••••••••••••••••••"}
            </div>
          </div>

          {/* Commitment Check */}
          <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                isValid ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {isValid ? "✓" : "✗"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600">
                <span className="font-medium">Commitment check:</span>{" "}
                <span className="font-mono text-gray-500">SHA256(seed)</span> =={" "}
                <span className="font-mono text-gray-500">commitment</span>
              </p>
            </div>
          </div>

          {/* Hint */}
          <p className="mt-2 text-[10px] text-gray-500 italic">
            Anyone can verify: SHA256({showSeed ? serverSeed.slice(0, 16) + "..." : "••••••"}) = {commitmentHash.slice(0, 20)}...
          </p>
        </div>
      )}
    </div>
  );
}
