import { assertAdminAuthenticated } from "@/lib/server/auth";
import { handleRouteError, ok } from "@/lib/server/api-response";
import { revealEvent } from "@/lib/server/event-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const result = await revealEvent(slug);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
