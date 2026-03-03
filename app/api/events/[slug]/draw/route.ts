import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { DrawRequest } from "@/lib/types/contracts";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { AppError, performDraw } from "@/lib/server/event-service";

function getRateKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "local";
  return `draw:${forwarded.split(",")[0]?.trim() ?? "unknown"}`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const requestId = randomUUID().slice(0, 8);
  let logSlug = "unknown";
  let logParticipantId: string | null = null;
  let logClientSeed: [string, string, string] | null = null;
  const rateKey = getRateKey(request);

  try {
    const limiter = checkRateLimit(rateKey, 30, 60_000);
    if (!limiter.allowed) {
      console.warn("[draw-api] rate_limited", {
        requestId,
        rateKey,
        retryAfterMs: limiter.retryAfterMs,
      });
      return fail(429, "rate_limited", "Too many draw attempts", {
        retryAfterMs: limiter.retryAfterMs,
      });
    }

    const { slug } = await context.params;
    logSlug = slug;
    const payload = (await request.json()) as Partial<DrawRequest>;
    logParticipantId = payload.participantId ?? null;
    logClientSeed = Array.isArray(payload.clientSeed) && payload.clientSeed.length === 3
      ? (payload.clientSeed as [string, string, string])
      : null;

    console.info("[draw-api] request", {
      requestId,
      slug,
      participantId: logParticipantId,
      clientSeed: logClientSeed,
    });

    if (!payload.participantId || !Array.isArray(payload.clientSeed) || payload.clientSeed.length !== 3) {
      console.warn("[draw-api] invalid_request", {
        requestId,
        slug,
        participantId: logParticipantId,
        clientSeed: payload.clientSeed ?? null,
      });
      return fail(400, "invalid_request", "participantId and clientSeed[3] are required");
    }

    const includeHidden = await isAdminAuthenticated();
    const response = await performDraw(
      slug,
      {
        participantId: payload.participantId,
        clientSeed: payload.clientSeed as [string, string, string],
      },
      { includeHidden }
    );

    console.info("[draw-api] success", {
      requestId,
      slug,
      participantId: payload.participantId,
      drawId: response.drawId,
      prizeId: response.prize.id,
      status: response.status,
      proofHash: response.proofHash,
    });

    return ok(response);
  } catch (error) {
    if (error instanceof AppError) {
      console.warn("[draw-api] app_error", {
        requestId,
        slug: logSlug,
        participantId: logParticipantId,
        clientSeed: logClientSeed,
        status: error.status,
        code: error.code,
        message: error.message,
      });
    } else if (error instanceof Error) {
      console.error("[draw-api] internal_error", {
        requestId,
        slug: logSlug,
        participantId: logParticipantId,
        clientSeed: logClientSeed,
        message: error.message,
      });
    } else {
      console.error("[draw-api] unknown_error", {
        requestId,
        slug: logSlug,
        participantId: logParticipantId,
        clientSeed: logClientSeed,
      });
    }

    return handleRouteError(error);
  }
}
