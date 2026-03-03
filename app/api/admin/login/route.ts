import { NextRequest } from "next/server";
import { setAdminSessionCookie } from "@/lib/server/auth";
import { timingSafeEqualString } from "@/lib/server/crypto";
import { requireEnvOrTestFallback } from "@/lib/server/env";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";

function getRateKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "local";
  return `admin-login:${forwarded.split(",")[0]?.trim() ?? "unknown"}`;
}

export async function POST(request: NextRequest) {
  try {
    const limiter = checkRateLimit(getRateKey(request), 10, 60_000);
    if (!limiter.allowed) {
      return fail(429, "rate_limited", "Too many login attempts", {
        retryAfterMs: limiter.retryAfterMs,
      });
    }

    const body = (await request.json()) as { passcode?: string };
    const passcode = body.passcode?.trim();

    if (!passcode) {
      return fail(400, "invalid_request", "Passcode is required");
    }

    const pass = timingSafeEqualString(
      passcode,
      requireEnvOrTestFallback("ADMIN_PASSCODE", "test-passcode")
    );
    if (!pass) {
      return fail(401, "invalid_passcode", "Invalid admin passcode");
    }

    const expiresAt = await setAdminSessionCookie();
    return ok({ ok: true, expiresAt });
  } catch (error) {
    return handleRouteError(error);
  }
}
