import { isAdminAuthenticated } from "@/lib/server/auth";
import { handleRouteError, ok } from "@/lib/server/api-response";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    return ok({ authenticated });
  } catch (error) {
    return handleRouteError(error);
  }
}
