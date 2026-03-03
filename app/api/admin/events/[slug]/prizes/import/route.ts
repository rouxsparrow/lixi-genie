import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { importPrizesFromEvent } from "@/lib/server/event-service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as {
      sourceSlug?: string;
      skipExistingByLabel?: boolean;
    };

    if (!body.sourceSlug?.trim()) {
      return fail(400, "invalid_request", "sourceSlug is required");
    }

    const result = await importPrizesFromEvent(slug, {
      sourceSlug: body.sourceSlug,
      skipExistingByLabel: body.skipExistingByLabel,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
