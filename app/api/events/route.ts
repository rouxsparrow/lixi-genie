import { handleRouteError, ok } from "@/lib/server/api-response";
import { listPublicEvents } from "@/lib/server/event-service";

export async function GET() {
  try {
    const events = await listPublicEvents();
    return ok({ events });
  } catch (error) {
    return handleRouteError(error);
  }
}
