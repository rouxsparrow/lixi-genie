import { clearAdminSessionCookie } from "@/lib/server/auth";
import { handleRouteError, ok } from "@/lib/server/api-response";

export async function POST() {
  try {
    await clearAdminSessionCookie();
    return ok({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
