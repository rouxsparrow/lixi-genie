import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { createEvent, listEvents } from "@/lib/server/event-service";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";

export async function GET() {
  try {
    await assertAdminAuthenticated();
    const events = await listEvents();
    return ok({ events });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminAuthenticated();
    const body = (await request.json()) as { slug?: string; name?: string };

    const slug = body.slug?.trim();
    const name = body.name?.trim();

    if (!slug || !name) {
      return fail(400, "invalid_request", "slug and name are required");
    }

    const event = await createEvent({ slug, name });
    return ok({ event });
  } catch (error) {
    return handleRouteError(error);
  }
}
