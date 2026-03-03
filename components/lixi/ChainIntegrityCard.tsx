"use client";

import { useState } from "react";
import { VerifyStatus } from "@/lib/lixi/useMockState";

interface ChainIntegrityCardProps {
  isIntact: boolean;
  chainLength?: number;
  verifyStatus?: VerifyStatus | null;
}

export function ChainIntegrityCard({ 
  isIntact, 
  chainLength = 0,
  verifyStatus 
}: ChainIntegrityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate visual chain blocks for expanded view
  const displayBlocks = Math.min(chainLength, 8);
  const hasMore = chainLength > 8;

  // Generate compact bar segments (always show up to 12 segments)
  const compactSegments = Math.min(chainLength, 12);
  const compactHasMore = chainLength > 12;

  return (
    <div
      className={`
        rounded-2xl shadow-md border-2 overflow-hidden transition-all
        ${
          isIntact
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }
      `}
    >
      {/* Header - Clickable to expand (Minimal View) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-4 hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg">⛓️</span>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight">
                Chain Integrity
              </h3>
              <p className="text-[10px] text-gray-500">
                {chainLength} blocks • {verifyStatus ? `${verifyStatus.passed}/${verifyStatus.total} ✓` : "Live"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact Chain Bar - Visual when collapsed */}
            {!isExpanded && chainLength > 0 && (
              <div className="hidden sm:flex items-center gap-0.5 mr-2">
                {Array.from({ length: compactSegments }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-5 rounded-sm ${
                      isIntact 
                        ? "bg-green-400" 
                        : i < compactSegments - 1 
                          ? "bg-green-400" 
                          : "bg-red-400"
                    }`}
                  />
                ))}
                {compactHasMore && (
                  <div className="w-1.5 h-5 rounded-sm bg-gray-300" />
                )}
              </div>
            )}

            {/* Status Badge */}
            <span
              className={`
                px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold
                ${
                  isIntact
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }
              `}
            >
              {isIntact ? "✅" : "❌"}
            </span>
            {/* Expand/Collapse Chevron */}
            <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>
        </div>

        {/* Mobile Compact Chain Bar */}
        {!isExpanded && chainLength > 0 && (
          <div className="flex sm:hidden items-center gap-0.5 mt-2 pl-8">
            {Array.from({ length: Math.min(compactSegments, 10) }).map((_, i) => (
              <div
                key={i}
                className={`w-1 h-4 rounded-sm ${
                  isIntact 
                    ? "bg-green-400" 
                    : i < compactSegments - 1 
                      ? "bg-green-400" 
                      : "bg-red-400"
                }`}
              />
            ))}
            {compactHasMore && (
              <div className="w-1 h-4 rounded-sm bg-gray-300" />
            )}
          </div>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {/* Explanation */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            Each draw cryptographically seals the previous one, creating an
            unbreakable chain of verifiable results.
          </p>

          {/* Verification Summary - if available */}
          {verifyStatus && (
            <div className="flex items-center justify-between text-xs mb-3 p-2 bg-white/60 rounded-lg">
              <span className="text-gray-600">Verification:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-600">
                  {verifyStatus.passed} ✅
                </span>
                {verifyStatus.failed > 0 && (
                  <span className="font-bold text-red-600">
                    {verifyStatus.failed} ❌
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Visual Chain Blocks */}
          <div className="relative">
            <div className="flex items-center gap-1 flex-wrap" aria-hidden="true">
              {displayBlocks > 0 ? (
                <>
                  {Array.from({ length: displayBlocks }).map((_, i) => (
                    <div
                      key={i}
                      className={`
                        w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs
                        border-2 shadow-sm
                        ${
                          isIntact
                            ? "bg-green-100 border-green-300 text-green-600"
                            : i < displayBlocks - 1
                            ? "bg-green-100 border-green-300 text-green-600"
                            : "bg-red-100 border-red-300 text-red-600"
                        }
                      `}
                      title={`Block #${chainLength - displayBlocks + i + 1}`}
                    >
                      {isIntact || i < displayBlocks - 1 ? "✓" : "✗"}
                    </div>
                  ))}
                  {hasMore && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs bg-gray-100 border-2 border-gray-200 text-gray-400">
                      +{chainLength - 8}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs bg-gray-100 border-2 border-gray-200 text-gray-300">
                  ○
                </div>
              )}
            </div>

            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm border border-gray-200 
                         text-gray-400 text-xs hover:bg-gray-50 hover:text-gray-600 transition-colors"
              aria-label="Learn more about chain integrity"
            >
              ?
            </button>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200 z-10 w-64">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-medium text-gray-800">How it works:</span>{" "}
                  Each draw seals the previous one by including its hash. 
                  Editing any record breaks the chain — making tampering visible to everyone.
                </p>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="mt-2 text-[10px] text-lixi-gold hover:text-amber-600 font-medium"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
