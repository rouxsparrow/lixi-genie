import { assertAdminAuthenticated } from "@/lib/server/auth";
import { deleteEvent, setEventVisibility } from "@/lib/server/event-service";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as { isPublic?: boolean };
    if (typeof body.isPublic !== "boolean") {
      return fail(400, "invalid_request", "isPublic(boolean) is required");
    }

    const result = await setEventVisibility(slug, body.isPublic);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const result = await deleteEvent(slug);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
