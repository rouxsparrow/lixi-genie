import { NextRequest } from "next/server";
import { assertAdminAuthenticated } from "@/lib/server/auth";
import { createParticipant, listParticipants } from "@/lib/server/event-service";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const participants = await listParticipants(slug);
    return ok({ participants });
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
      displayName?: string;
      avatarType?: "emoji" | "image";
      avatarEmoji?: string;
      avatarImagePath?: string;
      participationMode?: "office" | "remote";
      drawEnabled?: boolean;
      sortOrder?: number;
    };

    if (!body.displayName?.trim()) {
      return fail(400, "invalid_request", "displayName is required");
    }

    const participant = await createParticipant(slug, {
      displayName: body.displayName.trim(),
      avatarType: body.avatarType ?? "emoji",
      avatarEmoji: body.avatarEmoji,
      avatarImagePath: body.avatarImagePath,
      participationMode: body.participationMode ?? "office",
      drawEnabled: body.drawEnabled,
      sortOrder: body.sortOrder,
    });

    return ok({ participant });
  } catch (error) {
    return handleRouteError(error);
  }
}
