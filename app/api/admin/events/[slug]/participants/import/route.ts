import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { importParticipantsFromEvent } from "@/lib/server/event-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as {
      sourceSlug?: string;
      skipExistingByName?: boolean;
    };

    if (!body.sourceSlug?.trim()) {
      return fail(400, "invalid_request", "sourceSlug is required");
    }

    const result = await importParticipantsFromEvent(slug, {
      sourceSlug: body.sourceSlug,
      skipExistingByName: body.skipExistingByName,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
