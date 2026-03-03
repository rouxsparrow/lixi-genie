import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { createPrize, listPrizes } from "@/lib/server/event-service";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const prizes = await listPrizes(slug);
    return ok({ prizes });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const body = (await request.json()) as {
      label?: string;
      description?: string;
      amountVnd?: number;
      totalStock?: number;
      displayOrder?: number;
    };

    if (!body.label?.trim() || !body.amountVnd || body.totalStock === undefined) {
      return fail(400, "invalid_request", "label, amountVnd, totalStock are required");
    }

    const prize = await createPrize(slug, {
      label: body.label.trim(),
      description: body.description?.trim(),
      amountVnd: Number(body.amountVnd),
      totalStock: Number(body.totalStock),
      displayOrder: Number(body.displayOrder ?? 0),
    });

    return ok({ prize });
  } catch (error) {
    return handleRouteError(error);
  }
}
