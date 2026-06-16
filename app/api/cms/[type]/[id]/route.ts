import { z } from "zod";
import { assertTrustedOrigin, apiError, jsonOk, parseJson, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { isCmsType } from "@/lib/cms-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const cmsPayloadSchema = z.record(z.unknown()).transform((value) => {
  const now = new Date().toISOString();
  const status = value.status === "published" ? "published" : "draft";
  return { ...value, status, published_at: status === "published" ? (value.published_at as string | undefined) ?? now : null, updated_at: now };
});

async function authorize(type: string) {
  const user = await getWritableCrmUser();
  if (user.status !== 200) throw apiError("CRM write access required.", user.status, "unauthorized");
  if (!isCmsType(type)) throw apiError("Unknown CMS content type.", 404, "cms_type_not_found");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const { type, id } = await params;
    await authorize(type);
    const input = await parseJson(request, cmsPayloadSchema, "Invalid CMS payload.");
    const { error } = await createAdminClient().from(type).update(input).eq("id", id);
    if (error) throw apiError("Unable to update CMS entry.", 500, "cms_update_failed");
    return jsonOk({ ok: true });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const { type, id } = await params;
    await authorize(type);
    const { error } = await createAdminClient().from(type).delete().eq("id", id);
    if (error) throw apiError("Unable to delete CMS entry.", 500, "cms_delete_failed");
    return jsonOk({ ok: true });
  });
}
