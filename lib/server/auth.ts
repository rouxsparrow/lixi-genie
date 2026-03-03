import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { requireEnvOrTestFallback } from "./env";

export const ADMIN_COOKIE_NAME = "lixi_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  role: "admin";
  exp: number;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", requireEnvOrTestFallback("ADMIN_SESSION_SECRET", "test-session-secret"))
    .update(payloadB64)
    .digest("base64url");
}

function createToken(payload: AdminSessionPayload): string {
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

function verifyToken(token: string): AdminSessionPayload | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = signPayload(payloadB64);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;

  const payload = JSON.parse(decodeBase64Url(payloadB64)) as AdminSessionPayload;
  if (payload.exp < Date.now()) return null;
  if (payload.role !== "admin") return null;
  return payload;
}

export async function setAdminSessionCookie() {
  const exp = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const token = createToken({ role: "admin", exp });
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return new Date(exp).toISOString();
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return Boolean(verifyToken(token));
}

export async function assertAdminAuthenticated() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error("unauthorized");
  }
}
