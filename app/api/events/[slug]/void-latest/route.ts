import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { voidLatestDraw } from "@/lib/server/event-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as { reason?: string };

    if (!body.reason?.trim()) {
      return fail(400, "invalid_request", "reason is required");
    }

    const result = await voidLatestDraw(slug, body.reason.trim());
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
