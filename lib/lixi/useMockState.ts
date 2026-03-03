"use client";

import { useState, useCallback, useMemo } from "react";
import {
  mockPlayers,
  mockPrizes,
  mockAuditEntries,
  mockCommitmentHash,
  mockServerSeed,
  generateRandomSeed,
  Player,
  Prize,
  AuditEntry,
} from "./mockData";

export type UIState =
  | "beforeStart"
  | "locked"
  | "drawing"
  | "prizeRevealed"
  | "seedRevealed"
  | "verifiedPass"
  | "void";

export type VerifyStatus = {
  total: number;
  passed: number;
  failed: number;
};

export interface MockState {
  // Data
  players: Player[];
  prizes: Prize[];
  auditEntries: AuditEntry[];
  commitmentHash: string;
  serverSeed: string;

  // UI State
  uiState: UIState;

  // Selection State
  selectedPlayerId: string | null;
  drawnPlayerIds: string[];

  // Seed State
  currentSeed: string[];
  isSeedLocked: boolean;
  isSpinning: boolean;

  // Draw State
  currentPrize: Prize | null;
  isDrawing: boolean;
  showPrizePanel: boolean;
  isVoid: boolean;

  // Chain Integrity
  chainIntact: boolean;
  commitmentValid: boolean;
  verifyStatus: VerifyStatus | null;
}

export interface MockActions {
  // Player Actions
  selectPlayer: (playerId: string) => void;
  deselectPlayer: () => void;

  // Seed Actions
  lockSeed: () => void;
  spinSeed: () => void;
  stopSpinning: () => void;

  // Draw Actions
  startDraw: () => void;
  completeDraw: () => void;
  voidDraw: () => void;
  resetDraw: () => void;

  // Admin Actions
  addPlayer: (name: string, avatar: string) => void;
  removePlayer: (playerId: string) => void;
  updatePrize: (prizeId: string, updates: Partial<Prize>) => void;
  addPrize: (prize: Omit<Prize, "id">) => void;
  removePrize: (prizeId: string) => void;

  // State Switcher (for dev)
  setUIState: (state: UIState) => void;
  forceState: (state: Partial<MockState>) => void;
}

export function useMockState() {
  // Data states
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [prizes, setPrizes] = useState<Prize[]>(mockPrizes);
  const [auditEntries, setAuditEntries] =
    useState<AuditEntry[]>(mockAuditEntries);

  // UI states
  const [uiState, setUIState] = useState<UIState>("beforeStart");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [drawnPlayerIds, setDrawnPlayerIds] = useState<string[]>([
    "p5",
    "p2",
    "p3",
    "p4",
    "p7",
  ]);

  // Seed states
  const [currentSeed, setCurrentSeed] = useState<string[]>(["?", "?", "?"]);
  const [isSeedLocked, setIsSeedLocked] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Draw states
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPrizePanel, setShowPrizePanel] = useState(false);
  const [isVoid, setIsVoid] = useState(false);

  // Chain and verification states
  const [chainIntact, setChainIntact] = useState(true);
  const [commitmentValid, setCommitmentValid] = useState(true);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus | null>(null);

  // Computed values
  const remainingSlots = useMemo(() => {
    return prizes.reduce((acc, p) => acc + p.stock, 0);
  }, [prizes]);

  // Player Actions
  const selectPlayer = useCallback((playerId: string) => {
    if (!drawnPlayerIds.includes(playerId)) {
      setSelectedPlayerId(playerId);
    }
  }, [drawnPlayerIds]);

  const deselectPlayer = useCallback(() => {
    setSelectedPlayerId(null);
  }, []);

  // Seed Actions
  const lockSeed = useCallback(() => {
    setIsSeedLocked(true);
    setIsSpinning(false);
    setUIState("locked");
  }, []);

  const spinSeed = useCallback(() => {
    if (!isSeedLocked) {
      // Generate a new random seed when rolling
      const seed = generateRandomSeed();
      setCurrentSeed(seed);
      setIsSpinning(true);
    }
  }, [isSeedLocked]);

  const stopSpinning = useCallback(() => {
    setIsSpinning(false);
  }, []);

  // Draw Actions
  const startDraw = useCallback(() => {
    if (selectedPlayerId && isSeedLocked && !isDrawing) {
      setIsDrawing(true);
      setShowPrizePanel(false);
      setUIState("drawing");

      // Simulate draw delay
      setTimeout(() => {
        completeDraw();
      }, 2000);
    }
  }, [selectedPlayerId, isSeedLocked, isDrawing]);

  const completeDraw = useCallback(() => {
    // Pick a random prize that has stock
    const availablePrizes = prizes.filter((p) => p.stock > 0);
    if (availablePrizes.length === 0) return;

    const prize =
      availablePrizes[Math.floor(Math.random() * availablePrizes.length)];

    // Update prize stock
    setPrizes((prev) =>
      prev.map((p) => (p.id === prize.id ? { ...p, stock: p.stock - 1 } : p))
    );

    // Get player
    const player = players.find((p) => p.id === selectedPlayerId);
    if (!player) return;

    // Create audit entry
    const newEntry: AuditEntry = {
      id: `a${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar,
      prizeId: prize.id,
      prizeName: prize.name,
      prizeAmount: prize.amount,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      proofHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random()
        .toString(16)
        .slice(2, 6)}`,
      status: "locked",
      seed: currentSeed,
      verification: "pending",
    };

    setAuditEntries((prev) => [newEntry, ...prev]);
    setDrawnPlayerIds((prev) =>
      selectedPlayerId ? [...prev, selectedPlayerId] : prev
    );
    setCurrentPrize(prize);
    setIsDrawing(false);
    setShowPrizePanel(true);
    setIsVoid(false);
    setUIState("prizeRevealed");

    // Auto transition to seedRevealed with verification
    setTimeout(() => {
      setUIState("seedRevealed");
      // Verify all entries
      const verified = Math.random() > 0.1; // 90% pass rate for demo
      setAuditEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          status: entry.status === "void" ? "void" : "verified",
          verification: entry.status === "void" ? "pending" : (verified ? "pass" : "fail"),
        }))
      );
      setVerifyStatus({
        total: auditEntries.length + 1,
        passed: verified ? auditEntries.length + 1 : auditEntries.length,
        failed: verified ? 0 : 1,
      });
    }, 1500);
  }, [selectedPlayerId, prizes, players, currentSeed, auditEntries.length]);

  const voidDraw = useCallback(() => {
    setIsVoid(true);
    setShowPrizePanel(true);
    setIsDrawing(false);
    setUIState("void");

    // Add void entry to audit log
    const player = players.find((p) => p.id === selectedPlayerId);
    if (player) {
      const voidEntry: AuditEntry = {
        id: `a${Date.now()}`,
        playerId: player.id,
        playerName: player.name,
        playerAvatar: player.avatar,
        prizeId: "void",
        prizeName: "VOID",
        prizeAmount: 0,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        proofHash: "0x0000...0000",
        status: "void",
        seed: ["🚫", "⛔", "❌"],
        verification: "pending",
      };
      setAuditEntries((prev) => [voidEntry, ...prev]);
    }
  }, [selectedPlayerId, players]);

  const resetDraw = useCallback(() => {
    setSelectedPlayerId(null);
    setCurrentSeed(["?", "?", "?"]);
    setIsSeedLocked(false);
    setIsSpinning(false);
    setCurrentPrize(null);
    setIsDrawing(false);
    setShowPrizePanel(false);
    setIsVoid(false);
    setCommitmentValid(true);
    setVerifyStatus(null);
    setUIState("beforeStart");
  }, []);

  // Admin Actions
  const addPlayer = useCallback((name: string, avatar: string) => {
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name,
      avatar,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  const updatePrize = useCallback(
    (prizeId: string, updates: Partial<Prize>) => {
      setPrizes((prev) =>
        prev.map((p) => (p.id === prizeId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const addPrize = useCallback((prize: Omit<Prize, "id">) => {
    const newPrize: Prize = {
      ...prize,
      id: `pr${Date.now()}`,
    };
    setPrizes((prev) => [...prev, newPrize]);
  }, []);

  const removePrize = useCallback((prizeId: string) => {
    setPrizes((prev) => prev.filter((p) => p.id !== prizeId));
  }, []);

  // Force state for dev
  const forceState = useCallback((state: Partial<MockState>) => {
    if (state.players) setPlayers(state.players);
    if (state.prizes) setPrizes(state.prizes);
    if (state.auditEntries) setAuditEntries(state.auditEntries);
    if (state.uiState) setUIState(state.uiState);
    if (state.selectedPlayerId !== undefined)
      setSelectedPlayerId(state.selectedPlayerId);
    if (state.drawnPlayerIds) setDrawnPlayerIds(state.drawnPlayerIds);
    if (state.currentSeed) setCurrentSeed(state.currentSeed);
    if (state.isSeedLocked !== undefined) setIsSeedLocked(state.isSeedLocked);
    if (state.isSpinning !== undefined) setIsSpinning(state.isSpinning);
    if (state.currentPrize) setCurrentPrize(state.currentPrize);
    if (state.isDrawing !== undefined) setIsDrawing(state.isDrawing);
    if (state.showPrizePanel !== undefined)
      setShowPrizePanel(state.showPrizePanel);
    if (state.isVoid !== undefined) setIsVoid(state.isVoid);
    if (state.chainIntact !== undefined) setChainIntact(state.chainIntact);
    if (state.commitmentValid !== undefined) setCommitmentValid(state.commitmentValid);
    if (state.verifyStatus !== undefined) setVerifyStatus(state.verifyStatus);
  }, []);

  return {
    // State
    players,
    prizes,
    auditEntries,
    commitmentHash: mockCommitmentHash,
    serverSeed: mockServerSeed,
    uiState,
    selectedPlayerId,
    drawnPlayerIds,
    currentSeed,
    isSeedLocked,
    isSpinning,
    currentPrize,
    isDrawing,
    showPrizePanel,
    isVoid,
    chainIntact,
    commitmentValid,
    verifyStatus,
    remainingSlots,

    // Actions
    selectPlayer,
    deselectPlayer,
    lockSeed,
    spinSeed,
    stopSpinning,
    startDraw,
    completeDraw,
    voidDraw,
    resetDraw,
    addPlayer,
    removePlayer,
    updatePrize,
    addPrize,
    removePrize,
    setUIState,
    forceState,
  };
}

export type UseMockStateReturn = ReturnType<typeof useMockState>;
