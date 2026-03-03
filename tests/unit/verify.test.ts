import { test } from "node:test";
import assert from "node:assert/strict";
import { AuditPackage } from "../../lib/types/contracts";
import { verifyAuditPackage } from "../../lib/server/verify";
import { computeChainRowHash, computeProofHash, hmacSha256Hex, sha256Hex } from "../../lib/server/crypto";
import { verifyAuditPayload } from "../../lib/server/event-service";

function slotFromHmacHex(hmacHex: string, totalStock: number): number {
  const first48BitsHex = hmacHex.slice(0, 12);
  const value = Number(BigInt(`0x${first48BitsHex}`) % BigInt(totalStock));
  return value + 1;
}

function pickPrizeIdBySlot(
  stocks: Array<{ id: string; remaining: number }>,
  slot: number
): string {
  let running = 0;
  for (const stock of stocks) {
    if (stock.remaining <= 0) continue;
    running += stock.remaining;
    if (running >= slot) return stock.id;
  }
  throw new Error("Unable to map slot to prize");
}

function buildSampleAudit(): AuditPackage {
  const serverSeed = "seed123";
  const commitmentHash = sha256Hex(serverSeed);
  const ticket = "event|p1|ABC|0";
  const prizeId = "pr1";
  const createdAt = "2026-01-01T00:00:00.000Z";

  const proofHash = computeProofHash(ticket, prizeId, createdAt);
  const rowHash = computeChainRowHash("GENESIS", ticket, prizeId, createdAt);

  return {
    schemaVersion: "1.0.0",
    event: {
      id: "e1",
      slug: "demo",
      name: "Demo",
      phase: "office",
      state: "revealed",
      seedRevealedAt: createdAt,
    },
    commitmentHash,
    serverSeed,
    prizeSnapshot: [
      { id: "pr1", label: "Prize", description: "Sample prize", amountVnd: 100000, totalStock: 1, displayOrder: 0 },
    ],
    drawRecords: [
      {
        id: "d1",
        participantId: "p1",
        participantName: "Player",
        participantAvatar: "👤",
        participantMode: "office",
        prizeId,
        prizeLabel: "Prize",
        prizeAmountVnd: 100000,
        status: "locked",
        verificationStatus: "pending",
        verificationReason: null,
        ticket,
        clientSeed: ["A", "B", "C"],
        drawNonce: 0,
        proofHash,
        prevRowHash: "GENESIS",
        rowHash,
        isEffective: true,
        voidOfDrawId: null,
        voidReason: null,
        createdAt,
      },
    ],
    chainSummary: { intact: true, chainLength: 1 },
    verifySummary: { total: 0, passed: 0, failed: 0 },
    exportedAt: createdAt,
  };
}

test("verify audit passes for valid package", () => {
  const audit = buildSampleAudit();
  const result = verifyAuditPackage(audit);
  assert.equal(result.commitment.pass, true);
  assert.equal(result.chain.pass, true);
  assert.equal(result.summary.failed, 0);
  assert.equal(hmacSha256Hex(audit.serverSeed, audit.drawRecords[0].ticket).length, 64);
});

test("verify detects commitment tampering", () => {
  const audit = buildSampleAudit();
  audit.commitmentHash = "deadbeef";
  const result = verifyAuditPackage(audit);
  assert.equal(result.commitment.pass, false);
});

test("verify supports hashCreatedAtText for proof and row hash replay", () => {
  const audit = buildSampleAudit();
  const hashCreatedAtText = "2026-01-01 00:00:00+00";
  const draw = audit.drawRecords[0];
  draw.hashCreatedAtText = hashCreatedAtText;
  draw.proofHash = computeProofHash(draw.ticket, draw.prizeId!, hashCreatedAtText);
  draw.rowHash = computeChainRowHash(draw.prevRowHash, draw.ticket, draw.prizeId!, hashCreatedAtText);

  const result = verifyAuditPackage(audit);
  assert.equal(result.chain.pass, true);
  assert.equal(result.summary.failed, 0);
});

test("verify replays effective draws in drawNonce order regardless of payload order", () => {
  const serverSeed = "seed-ordering";
  const commitmentHash = sha256Hex(serverSeed);
  const prizes = [
    { id: "pr1", label: "Prize 1", amountVnd: 100000, totalStock: 1, displayOrder: 0 },
    { id: "pr2", label: "Prize 2", amountVnd: 200000, totalStock: 1, displayOrder: 1 },
  ];

  const findSlotOneTicket = (prefix: string) => {
    for (let i = 0; i < 20000; i += 1) {
      const ticket = `${prefix}|${i}`;
      const slot = slotFromHmacHex(hmacSha256Hex(serverSeed, ticket), 2);
      if (slot === 1) return ticket;
    }
    throw new Error("Unable to find slot=1 ticket");
  };

  const ticket1 = findSlotOneTicket("event|p1|S|0");
  const ticket2 = findSlotOneTicket("event|p2|S|1");

  const stocks = [
    { id: "pr1", remaining: 1 },
    { id: "pr2", remaining: 1 },
  ];
  const slot1 = slotFromHmacHex(hmacSha256Hex(serverSeed, ticket1), 2);
  const prizeId1 = pickPrizeIdBySlot(stocks, slot1);
  stocks.find((s) => s.id === prizeId1)!.remaining -= 1;
  const slot2 = slotFromHmacHex(hmacSha256Hex(serverSeed, ticket2), 1);
  const prizeId2 = pickPrizeIdBySlot(stocks, slot2);

  const hashText1 = "2026-01-01 00:00:00+00";
  const hashText2 = "2026-01-01 00:01:00+00";
  const rowHash1 = computeChainRowHash("GENESIS", ticket1, prizeId1, hashText1);
  const rowHash2 = computeChainRowHash(rowHash1, ticket2, prizeId2, hashText2);

  const draw1 = {
    id: "d1",
    participantId: "p1",
    participantName: "Player 1",
    participantAvatar: "👤",
    participantMode: "office" as const,
    prizeId: prizeId1,
    prizeLabel: "Prize 1",
    prizeAmountVnd: 100000,
    status: "locked" as const,
    verificationStatus: "pending" as const,
    verificationReason: null,
    ticket: ticket1,
    clientSeed: ["A", "B", "C"] as [string, string, string],
    drawNonce: 0,
    proofHash: computeProofHash(ticket1, prizeId1, hashText1),
    prevRowHash: "GENESIS",
    rowHash: rowHash1,
    isEffective: true,
    voidOfDrawId: null,
    voidReason: null,
    hashCreatedAtText: hashText1,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const draw2 = {
    id: "d2",
    participantId: "p2",
    participantName: "Player 2",
    participantAvatar: "👤",
    participantMode: "office" as const,
    prizeId: prizeId2,
    prizeLabel: "Prize 2",
    prizeAmountVnd: 200000,
    status: "locked" as const,
    verificationStatus: "pending" as const,
    verificationReason: null,
    ticket: ticket2,
    clientSeed: ["D", "E", "F"] as [string, string, string],
    drawNonce: 1,
    proofHash: computeProofHash(ticket2, prizeId2, hashText2),
    prevRowHash: rowHash1,
    rowHash: rowHash2,
    isEffective: true,
    voidOfDrawId: null,
    voidReason: null,
    hashCreatedAtText: hashText2,
    createdAt: "2026-01-01T00:01:00.000Z",
  };

  const audit: AuditPackage = {
    schemaVersion: "1.1.0",
    event: {
      id: "e1",
      slug: "demo",
      name: "Demo",
      phase: "office",
      state: "revealed",
      seedRevealedAt: "2026-01-01T00:01:00.000Z",
    },
    commitmentHash,
    serverSeed,
    prizeSnapshot: [
      { ...prizes[0], description: null },
      { ...prizes[1], description: null },
    ],
    drawRecords: [draw2, draw1],
    chainSummary: { intact: true, chainLength: 2 },
    verifySummary: { total: 0, passed: 0, failed: 0 },
    exportedAt: "2026-01-01T00:02:00.000Z",
  };

  const result = verifyAuditPackage(audit);
  assert.equal(result.chain.pass, true);
  assert.equal(result.summary.failed, 0);
});

test("verifyAuditPayload rejects malformed payload with invalid_audit_payload", async () => {
  await assert.rejects(
    async () => verifyAuditPayload({}),
    (error: unknown) => {
      assert.equal(typeof error, "object");
      const err = error as { code?: string };
      assert.equal(err.code, "invalid_audit_payload");
      return true;
    }
  );
});

test("verify chain accepts VOID marker records hashed with voided draw prize key", () => {
  const serverSeed = "seed-void";
  const commitmentHash = sha256Hex(serverSeed);
  const activeTicket = "event|p1|ABC|0";
  const activePrizeId = "pr1";
  const activeHashText = "2026-01-01 00:00:00+00";
  const activeProof = computeProofHash(activeTicket, activePrizeId, activeHashText);
  const activeRow = computeChainRowHash("GENESIS", activeTicket, activePrizeId, activeHashText);

  const voidTicket = "void|d1|2026-01-01 00:01:00+00";
  const voidHashText = "2026-01-01 00:01:00+00";
  const voidProof = sha256Hex(`${voidTicket}|${activePrizeId}`);
  const voidRow = sha256Hex(`${activeRow}|${voidTicket}|${activePrizeId}`);

  const audit: AuditPackage = {
    schemaVersion: "1.1.0",
    event: {
      id: "e1",
      slug: "demo",
      name: "Demo",
      phase: "office",
      state: "revealed",
      seedRevealedAt: "2026-01-01T00:01:00.000Z",
    },
    commitmentHash,
    serverSeed,
    prizeSnapshot: [
      {
        id: "pr1",
        label: "Prize",
        description: null,
        amountVnd: 100000,
        totalStock: 1,
        displayOrder: 0,
      },
    ],
    drawRecords: [
      {
        id: "d1",
        participantId: "p1",
        participantName: "Player",
        participantAvatar: "👤",
        participantMode: "office",
        prizeId: activePrizeId,
        prizeLabel: "Prize",
        prizeAmountVnd: 100000,
        status: "locked",
        verificationStatus: "pending",
        verificationReason: null,
        ticket: activeTicket,
        clientSeed: ["A", "B", "C"],
        drawNonce: 0,
        proofHash: activeProof,
        prevRowHash: "GENESIS",
        rowHash: activeRow,
        isEffective: false,
        voidOfDrawId: null,
        voidReason: null,
        hashCreatedAtText: activeHashText,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "d2",
        participantId: "p1",
        participantName: "Player",
        participantAvatar: "👤",
        participantMode: "office",
        prizeId: null,
        prizeLabel: null,
        prizeAmountVnd: 0,
        status: "void",
        verificationStatus: "pending",
        verificationReason: null,
        ticket: voidTicket,
        clientSeed: ["🚫", "⛔", "❌"],
        drawNonce: 0,
        proofHash: voidProof,
        prevRowHash: activeRow,
        rowHash: voidRow,
        isEffective: false,
        voidOfDrawId: "d1",
        voidReason: "Mistake",
        hashCreatedAtText: voidHashText,
        createdAt: "2026-01-01T00:01:00.000Z",
      },
    ],
    chainSummary: { intact: true, chainLength: 2 },
    verifySummary: { total: 0, passed: 0, failed: 0 },
    exportedAt: "2026-01-01T00:02:00.000Z",
  };

  const result = verifyAuditPackage(audit);
  assert.equal(result.chain.pass, true);
  assert.equal(result.chain.failures.length, 0);
});
