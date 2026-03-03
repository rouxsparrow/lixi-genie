import { isAdminAuthenticated } from "@/lib/server/auth";
import { buildAuditPackage } from "@/lib/server/event-service";
import { handleRouteError } from "@/lib/server/api-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const includeHidden = await isAdminAuthenticated();
    const audit = await buildAuditPackage(slug, false, includeHidden);
    return new Response(JSON.stringify(audit, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=\"audit-${slug}.json\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
