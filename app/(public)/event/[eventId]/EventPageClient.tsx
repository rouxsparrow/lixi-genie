"use client";

import { EventHeader } from "@/components/lixi/EventHeader";
import { PlayerGrid } from "@/components/lixi/PlayerGrid";
import { SlotMachineSeed } from "@/components/lixi/SlotMachineSeed";
import { DrawButton } from "@/components/lixi/DrawButton";
import { PrizeRevealPanel } from "@/components/lixi/PrizeRevealPanel";
import { CommitmentCard } from "@/components/lixi/CommitmentCard";
import { SeedRevealPanel } from "@/components/lixi/SeedRevealPanel";
import { ChainIntegrityCard } from "@/components/lixi/ChainIntegrityCard";
import { LiveAuditLog } from "@/components/lixi/LiveAuditLog";
import { useEventState } from "@/lib/lixi/useEventState";

interface EventPageClientProps {
  eventId: string;
}

export function EventPageClient({ eventId }: EventPageClientProps) {
  const state = useEventState(eventId);

  const isDrawDisabled = Boolean(
    !state.selectedPlayerId ||
      !state.isSeedLocked ||
      state.isDrawing ||
      (state.selectedPlayerId && state.drawnPlayerIds.includes(state.selectedPlayerId))
  );

  const isPostReveal = state.uiState === "seedRevealed" || state.uiState === "verifiedPass";

  return (
    <div className="min-h-dvh bg-lixi-cream overflow-x-hidden lg:h-dvh lg:overflow-hidden flex flex-col">
      <EventHeader status={state.uiState} remainingSlots={state.remainingSlots} eventId={eventId} />

      <main className="flex-1 pt-14 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        <section className="w-full lg:w-[65%] h-full p-2 sm:p-3 lg:p-4 flex flex-col gap-2 lg:gap-3 min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex-shrink-0">
            <PlayerGrid
              players={state.players.map((player) => ({
                id: player.id,
                name: player.name,
                avatar: player.avatar,
              }))}
              selectedId={state.selectedPlayerId}
              drawnIds={state.drawnPlayerIds}
              onSelect={state.selectPlayer}
            />
          </div>

          <div className="flex-shrink-0">
            <SlotMachineSeed
              seed={state.currentSeed}
              isSpinning={state.isSpinning}
              onLock={state.lockSeed}
              onSpin={state.spinSeed}
              onStopSpin={state.stopSpinning}
              isLocked={state.isSeedLocked}
              canRoll={Boolean(state.selectedPlayerId)}
            />
          </div>

          <div className="flex-shrink-0">
            <DrawButton onClick={state.startDraw} isDisabled={isDrawDisabled} isDrawing={state.isDrawing} />
          </div>

          {state.showPrizePanel && (
            <div className="flex-shrink-0">
              <PrizeRevealPanel prize={state.currentPrize} isVisible={state.showPrizePanel} isVoid={state.isVoid} />
            </div>
          )}

          {state.error && (
            <div className="clay-card p-3 text-sm text-red-700 bg-red-50 border border-red-200">
              {state.error}
            </div>
          )}
        </section>

        <section className="w-full lg:w-[35%] h-full p-2 sm:p-3 lg:p-4 flex flex-col gap-2 lg:gap-3 min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex-shrink-0">
            <CommitmentCard
              hash={state.commitmentHash || "(not locked yet)"}
              serverSeed={isPostReveal ? state.serverSeed : null}
              isRevealed={isPostReveal}
            />
          </div>

          {isPostReveal && state.serverSeed && (
            <div className="flex-shrink-0">
              <SeedRevealPanel
                serverSeed={state.serverSeed}
                commitmentHash={state.commitmentHash}
                isValid={state.commitmentValid}
              />
            </div>
          )}

          <div className="flex-shrink-0">
            <ChainIntegrityCard
              isIntact={state.chainIntact}
              chainLength={state.auditEntries.length}
              verifyStatus={state.verifySummary}
            />
          </div>

          <div className="flex-1 min-h-[220px] lg:min-h-0 overflow-hidden">
            <LiveAuditLog
              entries={state.auditEntries.map((entry) => ({
                id: entry.id,
                playerId: entry.participantId,
                playerName: entry.participantName,
                playerAvatar: entry.participantAvatar,
                prizeId: entry.prizeId ?? "void",
                prizeName: entry.prizeName,
                prizeAmount: entry.prizeAmount,
                time: entry.time,
                proofHash: entry.proofHash,
                status: entry.status,
                verification: entry.verification,
                seed: entry.seed,
              }))}
              showVerification={isPostReveal}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
