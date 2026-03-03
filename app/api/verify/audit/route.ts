import { handleRouteError, ok } from "@/lib/server/api-response";
import { verifyAuditPayload } from "@/lib/server/event-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await verifyAuditPayload(body);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
