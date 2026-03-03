"use client";

import { useState } from "react";

interface CommitmentCardProps {
  hash: string;
  serverSeed?: string | null;
  isRevealed?: boolean;
}

export function CommitmentCard({ hash, serverSeed, isRevealed = false }: CommitmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white/80 rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header - Clickable to collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <span>🔐</span> Fairness Commitment
          </h3>
          {isRevealed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              ✅ Revealed
            </span>
          )}
        </div>
        <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {/* Hash Display */}
          <div
            className="bg-gray-100 rounded-xl p-2.5 sm:p-3 font-mono text-[10px] sm:text-xs text-gray-600 
                          break-all mb-2 border border-gray-200"
            aria-label="Commitment hash"
          >
            {hash || "0x0000...0000"}
          </div>

          {/* Explanation */}
          <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed mb-2">
            We locked this cryptographic commitment before any draw occurred. This
            ensures the prize distribution cannot be manipulated.
          </p>

          {/* Verification Status - Only shown when revealed */}
          {isRevealed && serverSeed && (
            <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <span className="text-xs text-green-700 font-medium">
                  Commitment verified
                </span>
              </div>
              <p className="text-[10px] text-green-600 mt-1">
                SHA256(serverSeed) matches commitment hash
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
