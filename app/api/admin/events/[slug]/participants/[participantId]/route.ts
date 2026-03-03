import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { deleteParticipant, updateParticipant } from "@/lib/server/event-service";
import { handleRouteError, ok } from "@/lib/server/api-response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; participantId: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug, participantId } = await context.params;
    const body = await request.json();
    const participant = await updateParticipant(slug, participantId, body);
    return ok({ participant });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; participantId: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug, participantId } = await context.params;
    const result = await deleteParticipant(slug, participantId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
