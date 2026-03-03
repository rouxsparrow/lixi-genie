import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { startLock } from "@/lib/server/event-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as { bossInput?: string };

    if (!body.bossInput?.trim()) {
      return fail(400, "invalid_request", "bossInput is required");
    }

    const result = await startLock(slug, body.bossInput.trim());
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
