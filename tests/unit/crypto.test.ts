import { test } from "node:test";
import assert from "node:assert/strict";
import { computeChainRowHash, computeProofHash, hmacSha256Hex, sha256Hex } from "../../lib/server/crypto";

test("sha256 is deterministic", () => {
  assert.equal(sha256Hex("abc"), sha256Hex("abc"));
  assert.notEqual(sha256Hex("abc"), sha256Hex("abcd"));
});

test("hmac is deterministic", () => {
  assert.equal(hmacSha256Hex("k", "m"), hmacSha256Hex("k", "m"));
});

test("proof and row hash produce stable values", () => {
  const proof = computeProofHash("ticket", "prize", "2026-01-01T00:00:00.000Z");
  const row = computeChainRowHash("GENESIS", "ticket", "prize", "2026-01-01T00:00:00.000Z");
  assert.equal(proof.length, 64);
  assert.equal(row.length, 64);
});
