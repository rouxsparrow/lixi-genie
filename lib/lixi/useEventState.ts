"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EventStateResponse } from "@/lib/types/contracts";

export type UIState =
  | "beforeStart"
  | "locked"
  | "drawing"
  | "prizeRevealed"
  | "seedRevealed"
  | "verifiedPass"
  | "void";

export interface EventPlayer {
  id: string;
  name: string;
  avatar: string;
  drawn: boolean;
  mode: "office" | "remote";
}

export interface EventPrize {
  id: string;
  name: string;
  amount: number;
  stock: number;
}

const emojiPool = ["🧧", "🎉", "✨", "🎊", "🎁", "🎯", "🌟", "💎", "🔥", "⚡", "🎀", "🌸", "🍀", "🎲"];

function generateRandomSeed(): [string, string, string] {
  return [
    emojiPool[Math.floor(Math.random() * emojiPool.length)],
    emojiPool[Math.floor(Math.random() * emojiPool.length)],
    emojiPool[Math.floor(Math.random() * emojiPool.length)],
  ];
}

export function useEventState(slug: string) {
  const [state, setState] = useState<EventStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [currentSeed, setCurrentSeed] = useState<[string, string, string]>(["?", "?", "?"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSeedLocked, setIsSeedLocked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<EventPrize | null>(null);
  const [showPrizePanel, setShowPrizePanel] = useState(false);
  const [isVoid, setIsVoid] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}/state`, {
        cache: "no-store",
      });
      const json = (await res.json()) as EventStateResponse;
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message || "Failed to fetch state");
      }
      setState(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch event state");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchState();
    const interval = window.setInterval(fetchState, 2500);
    return () => window.clearInterval(interval);
  }, [fetchState]);

  const players = useMemo(
    () =>
      (state?.participants ?? []).map((participant) => ({
        id: participant.id,
        name: participant.name,
        avatar: participant.avatar,
        drawn: participant.drawn,
        mode: participant.mode,
      })),
    [state?.participants]
  );

  const prizes = useMemo(
    () =>
      (state?.prizes ?? []).map((prize) => ({
        id: prize.id,
        name: prize.label,
        amount: prize.amountVnd,
        stock: prize.remainingStock,
      })),
    [state?.prizes]
  );

  const drawnPlayerIds = useMemo(
    () => players.filter((p) => p.drawn).map((p) => p.id),
    [players]
  );

  const selectPlayer = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      if (state?.event.phase && player.mode !== state.event.phase) {
        setError(`This participant is ${player.mode}. Switch event phase to ${player.mode} before drawing.`);
        return;
      }
      if (drawnPlayerIds.includes(playerId)) return;
      setError(null);
      setSelectedPlayerId((prev) => (prev === playerId ? null : playerId));
    },
    [drawnPlayerIds, players, state?.event.phase]
  );

  const spinSeed = useCallback(() => {
    if (isSeedLocked) return;
    if (!selectedPlayerId) {
      setError("Please select a participant before rolling.");
      return;
    }
    setIsSpinning(true);
  }, [isSeedLocked, selectedPlayerId]);

  const stopSpinning = useCallback(() => {
    setCurrentSeed(generateRandomSeed());
    setIsSpinning(false);
  }, []);

  const lockSeed = useCallback(() => {
    if (currentSeed.includes("?")) {
      setCurrentSeed(generateRandomSeed());
    }
    setIsSeedLocked(true);
    setIsVoid(false);
  }, [currentSeed]);

  const resetDraw = useCallback(() => {
    setSelectedPlayerId(null);
    setCurrentSeed(["?", "?", "?"]);
    setIsSeedLocked(false);
    setIsSpinning(false);
    setIsDrawing(false);
    setCurrentPrize(null);
    setShowPrizePanel(false);
    setIsVoid(false);
  }, []);

  const startDraw = useCallback(async () => {
    if (!selectedPlayerId || !isSeedLocked || isDrawing) return;
    const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
    if (selectedPlayer && state?.event.phase && selectedPlayer.mode !== state.event.phase) {
      setError(`This participant is ${selectedPlayer.mode}. Switch event phase to ${selectedPlayer.mode} before drawing.`);
      return;
    }

    setIsDrawing(true);
    setIsVoid(false);
    setShowPrizePanel(false);

    try {
      console.info("[draw-ui] request", {
        slug,
        participantId: selectedPlayerId,
        clientSeed: currentSeed,
      });

      const res = await fetch(`/api/events/${slug}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: selectedPlayerId,
          clientSeed: currentSeed,
        }),
      });

      const json = (await res.json()) as {
        drawId?: string;
        prize?: { id: string; label: string; amountVnd: number };
        error?: { code?: string; message?: string };
      };

      if (!res.ok || !json.prize) {
        const apiCode = json.error?.code ?? "draw_failed";
        const apiMessage = json.error?.message ?? "Draw failed";
        console.error("[draw-ui] failed", {
          slug,
          participantId: selectedPlayerId,
          clientSeed: currentSeed,
          status: res.status,
          code: apiCode,
          message: apiMessage,
        });
        throw new Error(`[${apiCode}] ${apiMessage}`);
      }

      console.info("[draw-ui] success", {
        slug,
        participantId: selectedPlayerId,
        drawId: json.drawId,
        prizeId: json.prize.id,
        amountVnd: json.prize.amountVnd,
      });

      setCurrentPrize({
        id: json.prize.id,
        name: json.prize.label,
        amount: json.prize.amountVnd,
        stock: 0,
      });
      setShowPrizePanel(true);
      setIsSeedLocked(false);
      setSelectedPlayerId(null);
      setCurrentSeed(["?", "?", "?"]);
      await fetchState();
    } catch (e) {
      console.error("[draw-ui] exception", {
        slug,
        participantId: selectedPlayerId,
        message: e instanceof Error ? e.message : String(e),
      });
      setError(e instanceof Error ? e.message : "Draw failed");
    } finally {
      setIsDrawing(false);
    }
  }, [selectedPlayerId, isSeedLocked, isDrawing, players, state?.event.phase, slug, currentSeed, fetchState]);

  const voidDraw = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}/void-latest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual void from UI" }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message || "Void failed");
      }
      setIsVoid(true);
      setShowPrizePanel(true);
      setCurrentPrize(null);
      await fetchState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Void failed");
    }
  }, [slug, fetchState]);

  const revealSeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${slug}/reveal`, { method: "POST" });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message || "Reveal failed");
      }
      await fetchState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reveal failed");
    }
  }, [slug, fetchState]);

  const uiState: UIState = useMemo(() => {
    if (isVoid) return "void";
    if (isDrawing) return "drawing";

    if (state?.event.seedRevealed) {
      if (state.verifySummary && state.verifySummary.failed === 0) {
        return "verifiedPass";
      }
      return "seedRevealed";
    }

    if (showPrizePanel && currentPrize) {
      return "prizeRevealed";
    }

    if (isSeedLocked) {
      return "locked";
    }

    return "beforeStart";
  }, [isVoid, isDrawing, state?.event.seedRevealed, state?.verifySummary, showPrizePanel, currentPrize, isSeedLocked]);

  return {
    isLoading,
    error,
    refresh: fetchState,

    event: state?.event,
    uiState,
    players,
    prizes,
    selectedPlayerId,
    drawnPlayerIds,

    currentSeed,
    isSpinning,
    isSeedLocked,

    currentPrize,
    isDrawing,
    showPrizePanel,
    isVoid,

    chainIntact: state?.chainIntegrity.intact ?? true,
    verifySummary: state?.verifySummary ?? null,
    auditEntries: state?.auditEntries ?? [],
    remainingSlots: state?.remainingSlots ?? 0,
    commitmentHash: state?.event.commitmentHash ?? "",
    serverSeed: state?.event.serverSeed ?? null,
    commitmentValid: true,

    selectPlayer,
    spinSeed,
    lockSeed,
    startDraw,
    resetDraw,
    voidDraw,
    revealSeed,
    setCurrentSeed,
    setIsSpinning,
    stopSpinning,
  };
}
