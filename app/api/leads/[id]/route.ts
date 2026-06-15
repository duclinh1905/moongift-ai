import { assertTrustedOrigin, apiError, jsonOk, parseJson, parseParams, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { captureEvent } from "@/lib/monitoring";
import { leadStatusUpdateSchema, uuidParamsSchema } from "@/lib/schema";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const admin = await getWritableCrmUser();
    if (admin.status !== 200) {
      throw apiError(admin.status === 401 ? "Authentication required." : "Admin access required.", admin.status, "unauthorized");
    }

    const { id } = parseParams(await params, uuidParamsSchema);
    const input = await parseJson(request, leadStatusUpdateSchema, "Invalid lead status.");

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("leads")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw apiError("Unable to update lead.", 500, "lead_update_failed");

    await logActivity({
      actorId: admin.user.id,
      action: input.status === "won" ? "deal.won" : input.status === "lost" ? "deal.lost" : "lead.status_updated",
      entityType: "lead",
      entityId: id,
      metadata: { status: input.status }
    });
    await captureEvent({ name: "lead.status_updated", properties: { status: input.status } });

    return jsonOk({ ok: true });
  });
}
