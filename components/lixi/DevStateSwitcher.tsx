"use client";

import { UIState, UseMockStateReturn } from "@/lib/lixi/useMockState";
import { useState } from "react";
import { mockAuditEntries, mockCommitmentHash, mockServerSeed } from "@/lib/lixi/mockData";

interface DevStateSwitcherProps {
  state: UseMockStateReturn;
}

const states: { value: UIState; label: string; description: string }[] = [
  {
    value: "beforeStart",
    label: "Before Start",
    description: "Initial state, no selection",
  },
  {
    value: "locked",
    label: "Fairness Locked",
    description: "Seed locked, ready to draw",
  },
  {
    value: "drawing",
    label: "Drawing",
    description: "Animation in progress",
  },
  {
    value: "prizeRevealed",
    label: "Prize Revealed",
    description: "Winner announced",
  },
  {
    value: "seedRevealed",
    label: "Seed Revealed",
    description: "Post-draw verification",
  },
  {
    value: "verifiedPass",
    label: "Verified Pass",
    description: "All green, confirmed",
  },
  {
    value: "void",
    label: "VOID",
    description: "Cancelled draw",
  },
];

export function DevStateSwitcher({ state }: DevStateSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStateChange = (newState: UIState) => {
    // Configure state based on selection
    switch (newState) {
      case "beforeStart":
        state.forceState({
          uiState: "beforeStart",
          selectedPlayerId: null,
          isSeedLocked: false,
          currentSeed: ["?", "?", "?"],
          showPrizePanel: false,
          isVoid: false,
          serverSeed: "",
          commitmentValid: true,
          verifyStatus: null,
        });
        break;
      case "locked":
        state.forceState({
          uiState: "locked",
          selectedPlayerId: state.players[0]?.id || null,
          isSeedLocked: true,
          currentSeed: ["🎉", "✨", "🧧"],
          showPrizePanel: false,
          isVoid: false,
          serverSeed: "",
          commitmentValid: true,
          verifyStatus: null,
        });
        break;
      case "drawing":
        state.forceState({
          uiState: "drawing",
          selectedPlayerId: state.players[0]?.id || null,
          isSeedLocked: true,
          isSpinning: true,
          showPrizePanel: false,
          isVoid: false,
          serverSeed: "",
          commitmentValid: true,
          verifyStatus: null,
        });
        break;
      case "prizeRevealed":
        state.forceState({
          uiState: "prizeRevealed",
          selectedPlayerId: state.players[0]?.id || null,
          isSeedLocked: true,
          currentSeed: ["🎉", "✨", "🧧"],
          showPrizePanel: true,
          currentPrize: state.prizes[0] || null,
          isVoid: false,
          serverSeed: "",
          commitmentValid: true,
          verifyStatus: null,
        });
        break;
      case "seedRevealed":
        state.forceState({
          uiState: "seedRevealed",
          selectedPlayerId: state.players[0]?.id || null,
          isSeedLocked: true,
          currentSeed: ["🎉", "✨", "🧧"],
          showPrizePanel: true,
          currentPrize: state.prizes[0] || null,
          isVoid: false,
          serverSeed: mockServerSeed,
          commitmentValid: true,
          verifyStatus: { total: 5, passed: 4, failed: 0 },
          auditEntries: mockAuditEntries.map(e => ({ ...e, status: "verified" as const, verification: e.status === "void" ? "pending" : "pass" })),
        });
        break;
      case "verifiedPass":
        state.forceState({
          uiState: "verifiedPass",
          selectedPlayerId: state.players[0]?.id || null,
          isSeedLocked: true,
          currentSeed: ["🎉", "✨", "🧧"],
          showPrizePanel: true,
          currentPrize: state.prizes[0] || null,
          chainIntact: true,
          isVoid: false,
          serverSeed: mockServerSeed,
          commitmentValid: true,
          verifyStatus: { total: 5, passed: 5, failed: 0 },
          auditEntries: mockAuditEntries.map(e => ({ ...e, status: "verified" as const, verification: e.status === "void" ? "pending" : "pass" })),
        });
        break;
      case "void":
        state.forceState({
          uiState: "void",
          selectedPlayerId: state.players[0]?.id || null,
          isSeedLocked: false,
          showPrizePanel: true,
          isVoid: true,
          serverSeed: "",
          commitmentValid: true,
          verifyStatus: null,
        });
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium
                   shadow-lg hover:bg-gray-800 transition-colors
                   flex items-center gap-2"
      >
        <span>🎛️</span>
        {isOpen ? "Close" : "Dev State"}
      </button>

      {/* State Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl p-4 w-72 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">UI State Switcher</h3>
          <div className="space-y-2">
            {states.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStateChange(s.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors
                  ${
                    state.uiState === s.value
                      ? "bg-lixi-red text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <div className="font-medium">{s.label}</div>
                <div
                  className={`text-xs ${
                    state.uiState === s.value
                      ? "text-white/80"
                      : "text-gray-500"
                  }`}
                >
                  {s.description}
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 mb-2">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => state.resetDraw()}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs
                           hover:bg-gray-200 transition-colors"
              >
                Reset Draw
              </button>
              <button
                onClick={() =>
                  state.forceState({ chainIntact: !state.chainIntact })
                }
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs
                           hover:bg-gray-200 transition-colors"
              >
                Toggle Chain
              </button>
              <button
                onClick={() =>
                  state.forceState({ commitmentValid: !state.commitmentValid })
                }
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs
                           hover:bg-gray-200 transition-colors"
              >
                Toggle Commit
              </button>
              <button
                onClick={() =>
                  state.forceState({ 
                    verifyStatus: state.verifyStatus ? null : { total: 5, passed: 4, failed: 1 }
                  })
                }
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs
                           hover:bg-gray-200 transition-colors"
              >
                Toggle Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
