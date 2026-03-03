import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/auth";
import { getEventState } from "@/lib/server/event-service";
import { handleRouteError, ok } from "@/lib/server/api-response";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const includeHidden = await isAdminAuthenticated();
    const data = await getEventState(slug, { includeHidden });
    return ok(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
