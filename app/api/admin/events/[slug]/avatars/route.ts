import { assertAdminAuthenticated } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { fail, handleRouteError, ok } from "@/lib/server/api-response";

const AVATAR_BUCKET = "participant-avatars";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await assertAdminAuthenticated();
    const { slug } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail(400, "invalid_request", "file is required");
    }

    const ext = file.name.split(".").pop() || "png";
    const path = `${slug}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const supabase = createServiceRoleClient();
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return fail(500, "upload_failed", uploadError.message);
    }

    const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

    return ok({
      path,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
