import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { requireEnvOrTestFallback } from "./env";

function normalizeAesKey(key: string): Buffer {
  const raw = Buffer.from(key, "base64");
  if (raw.length === 32) {
    return raw;
  }
  return createHash("sha256").update(key).digest();
}

let cachedAesKey: Buffer | null = null;

function getAesKey(): Buffer {
  if (cachedAesKey) return cachedAesKey;
  cachedAesKey = normalizeAesKey(requireEnvOrTestFallback("SERVER_SEED_ENC_KEY", "test-seed-key"));
  return cachedAesKey;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hmacSha256Hex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function generateServerSeed(bossInput: string): { serverSeed: string; commitmentHash: string; serverNonce: string; serverTime: string } {
  const serverNonce = randomBytes(16).toString("hex");
  const serverTime = new Date().toISOString();
  const serverSeed = sha256Hex(`${bossInput}|${serverTime}|${serverNonce}`);
  const commitmentHash = sha256Hex(serverSeed);
  return { serverSeed, commitmentHash, serverNonce, serverTime };
}

export function encryptSeed(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getAesKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSeed(ciphertext: string): string {
  const payload = Buffer.from(ciphertext, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getAesKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function shortProof(fullHex: string): string {
  return `${fullHex.slice(0, 8)}...${fullHex.slice(-8)}`;
}

export function computeChainRowHash(prevRowHash: string, ticket: string, prizeId: string, createdAt: string): string {
  return sha256Hex(`${prevRowHash}|${ticket}|${prizeId}|${createdAt}`);
}

export function computeProofHash(ticket: string, prizeId: string, createdAt: string): string {
  return sha256Hex(`${ticket}|${prizeId}|${createdAt}`);
}
