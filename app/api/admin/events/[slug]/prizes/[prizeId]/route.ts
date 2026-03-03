import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { deletePrize, updatePrize } from "@/lib/server/event-service";
import { handleRouteError, ok } from "@/lib/server/api-response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; prizeId: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug, prizeId } = await context.params;
    const body = await request.json();
    const prize = await updatePrize(slug, prizeId, body);
    return ok({ prize });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; prizeId: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug, prizeId } = await context.params;
    const result = await deletePrize(slug, prizeId);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
