import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { setEventPhase } from "@/lib/server/event-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as { phase?: "office" | "remote" };

    if (body.phase !== "office" && body.phase !== "remote") {
      return fail(400, "invalid_request", "phase must be office or remote");
    }

    const result = await setEventPhase(slug, body.phase);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
