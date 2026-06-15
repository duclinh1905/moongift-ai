import { z } from "zod";
import { assertTrustedOrigin, apiError, jsonOk, parseJson, parseParams, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { captureEvent } from "@/lib/monitoring";
import { uuidParamsSchema } from "@/lib/schema";
import { createAdminClient } from "@/lib/supabase/admin";

const quoteUpdateSchema = z.object({
  status: z.enum(["draft", "sent", "accepted", "rejected"])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const admin = await getWritableCrmUser();
    if (admin.status !== 200) {
      throw apiError(admin.status === 401 ? "Authentication required." : "Admin access required.", admin.status, "unauthorized");
    }

    const { id } = parseParams(await params, uuidParamsSchema);
    const input = await parseJson(request, quoteUpdateSchema, "Invalid quote status.");

    const supabase = createAdminClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, lead_id")
      .single();

    if (error || !quote) throw apiError("Unable to update quote.", 500, "quote_update_failed");

    if (input.status === "accepted" || input.status === "rejected") {
      await supabase
        .from("leads")
        .update({ status: input.status === "accepted" ? "won" : "lost", updated_at: new Date().toISOString() })
        .eq("id", quote.lead_id);
    }

    await logActivity({
      actorId: admin.user.id,
      action: "quote.status_updated",
      entityType: "quote",
      entityId: id,
      metadata: { status: input.status, leadId: quote.lead_id }
    });
    await captureEvent({ name: "quote.status_updated", properties: { status: input.status } });

    return jsonOk({ ok: true });
  });
}
