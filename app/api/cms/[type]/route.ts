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

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const user = await getWritableCrmUser();
    if (user.status !== 200) throw apiError("CRM write access required.", user.status, "unauthorized");
    const { type } = await params;
    if (!isCmsType(type)) throw apiError("Unknown CMS content type.", 404, "cms_type_not_found");
    const input = await parseJson(request, cmsPayloadSchema, "Invalid CMS payload.");
    const { data, error } = await createAdminClient().from(type).insert(input).select("id").single();
    if (error || !data) throw apiError("Unable to create CMS entry.", 500, "cms_create_failed");
    return jsonOk({ id: data.id });
  });
}
