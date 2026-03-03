import { AuditPackage, VerifyAuditResponse } from "@/lib/types/contracts";
import { computeChainRowHash, computeProofHash, hmacSha256Hex, sha256Hex } from "./crypto";

function normalizeHex(input: string): string {
  return input.trim().toLowerCase();
}

function slotFromHmacHex(hmacHex: string, totalStock: number): number {
  const first48BitsHex = hmacHex.slice(0, 12);
  const value = Number(BigInt(`0x${first48BitsHex}`) % BigInt(totalStock));
  return value + 1;
}

type PrizeStock = {
  id: string;
  label: string;
  amountVnd: number;
  displayOrder: number;
  remaining: number;
};

function pickPrizeBySlot(prizes: PrizeStock[], slot: number): PrizeStock | null {
  let running = 0;
  for (const prize of prizes) {
    if (prize.remaining <= 0) continue;
    running += prize.remaining;
    if (running >= slot) {
      return prize;
    }
  }
  return null;
}

function chainPrizeKey(
  draw: AuditPackage["drawRecords"][number],
  drawById: Map<string, AuditPackage["drawRecords"][number]>
): string {
  if (draw.status !== "void") {
    return draw.prizeId ?? "none";
  }

  // VOID chain hashes are generated from the voided draw's prize id in DB.
  if (draw.voidOfDrawId) {
    const original = drawById.get(draw.voidOfDrawId);
    if (original?.prizeId) {
      return original.prizeId;
    }
  }

  return "none";
}

function computeExpectedProofHash(
  draw: AuditPackage["drawRecords"][number],
  prizeKey: string,
  hashTimestamp: string
): string {
  if (draw.status === "void") {
    // VOID records already embed timestamp in ticket: void|<void_of_draw_id>|<timestamp>
    return sha256Hex(`${draw.ticket}|${prizeKey}`);
  }
  return computeProofHash(draw.ticket, prizeKey, hashTimestamp);
}

function computeExpectedRowHash(
  draw: AuditPackage["drawRecords"][number],
  prizeKey: string,
  hashTimestamp: string
): string {
  if (draw.status === "void") {
    return sha256Hex(`${draw.prevRowHash}|${draw.ticket}|${prizeKey}`);
  }
  return computeChainRowHash(draw.prevRowHash, draw.ticket, prizeKey, hashTimestamp);
}

export function verifyAuditPackage(audit: AuditPackage): VerifyAuditResponse {
  const commitmentActual = sha256Hex(audit.serverSeed);
  const commitmentExpected = normalizeHex(audit.commitmentHash);
  const commitmentPass = normalizeHex(commitmentActual) === commitmentExpected;

  const chron = [...audit.drawRecords].sort((a, b) => {
    if (a.createdAt === b.createdAt) {
      return a.id.localeCompare(b.id);
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const chainFailures: string[] = [];
  let prevHash = "GENESIS";
  const drawById = new Map(audit.drawRecords.map((draw) => [draw.id, draw]));

  for (const draw of chron) {
    if (draw.prevRowHash !== prevHash) {
      chainFailures.push(`draw ${draw.id}: prev_row_hash mismatch`);
    }

    const prizeKey = chainPrizeKey(draw, drawById);
    const hashTimestamp = draw.hashCreatedAtText ?? draw.createdAt;
    const expectedProof = computeExpectedProofHash(draw, prizeKey, hashTimestamp);
    if (normalizeHex(draw.proofHash) !== normalizeHex(expectedProof)) {
      chainFailures.push(`draw ${draw.id}: proof_hash mismatch`);
    }

    const expectedRowHash = computeExpectedRowHash(draw, prizeKey, hashTimestamp);
    if (normalizeHex(draw.rowHash) !== normalizeHex(expectedRowHash)) {
      chainFailures.push(`draw ${draw.id}: row_hash mismatch`);
    }

    prevHash = draw.rowHash;
  }

  const stocks: PrizeStock[] = audit.prizeSnapshot
    .map((prize) => ({
      id: prize.id,
      label: prize.label,
      amountVnd: prize.amountVnd,
      displayOrder: prize.displayOrder,
      remaining: prize.totalStock,
    }))
    .sort((a, b) => (a.displayOrder - b.displayOrder) || a.id.localeCompare(b.id));

  const effectiveDraws = [...audit.drawRecords]
    .filter((draw) => draw.isEffective && draw.status !== "void")
    .sort((a, b) => (a.drawNonce - b.drawNonce) || a.id.localeCompare(b.id));

  const replayResults = new Map<string, { pass: boolean; reason: string }>();

  for (const draw of effectiveDraws) {
    const totalStock = stocks.reduce((acc, p) => acc + p.remaining, 0);
    if (totalStock <= 0) {
      replayResults.set(draw.id, { pass: false, reason: "No stock remained during replay" });
      continue;
    }

    const replayHmac = hmacSha256Hex(audit.serverSeed, draw.ticket);
    const slot = slotFromHmacHex(replayHmac, totalStock);
    const expectedPrize = pickPrizeBySlot(stocks, slot);

    if (!expectedPrize) {
      replayResults.set(draw.id, { pass: false, reason: "Prize mapping failed" });
      continue;
    }

    if (draw.prizeId !== expectedPrize.id) {
      replayResults.set(draw.id, {
        pass: false,
        reason: `Prize mismatch: expected ${expectedPrize.id}, got ${draw.prizeId}`,
      });
      continue;
    }

    expectedPrize.remaining -= 1;

    replayResults.set(draw.id, { pass: true, reason: "Replay matched" });
  }

  const drawResults: VerifyAuditResponse["draws"] = [];

  for (const draw of audit.drawRecords) {
    if (draw.status === "void") {
      drawResults.push({
        drawId: draw.id,
        pass: true,
        reason: "VOID marker record",
      });
      continue;
    }

    if (!draw.isEffective) {
      drawResults.push({
        drawId: draw.id,
        pass: true,
        reason: "Voided historical draw",
      });
      continue;
    }

    const replay = replayResults.get(draw.id);
    if (!replay) {
      drawResults.push({
        drawId: draw.id,
        pass: false,
        reason: "Replay result missing for effective draw",
      });
      continue;
    }

    drawResults.push({
      drawId: draw.id,
      pass: replay.pass,
      reason: replay.reason,
    });
  }

  const passed = drawResults.filter((d) => d.pass).length;
  const failed = drawResults.length - passed;

  const expectedEffectiveCount = effectiveDraws.length;

  return {
    commitment: {
      pass: commitmentPass,
      expected: commitmentExpected,
      actual: commitmentActual,
    },
    chain: {
      pass: chainFailures.length === 0,
      chainLength: chron.length,
      failures: chainFailures,
    },
    draws: drawResults,
    summary: {
      total: Math.max(drawResults.length, expectedEffectiveCount),
      passed,
      failed,
    },
  };
}
