import { assertTrustedOrigin, apiError, jsonOk, parseParams, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { captureEvent } from "@/lib/monitoring";
import { uuidParamsSchema } from "@/lib/schema";
import { createAdminClient } from "@/lib/supabase/admin";

function getQuoteNumber() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `MG-${timestamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function getValidUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const admin = await getWritableCrmUser();
    if (admin.status !== 200) {
      throw apiError(admin.status === 401 ? "Authentication required." : "Admin access required.", admin.status, "unauthorized");
    }

    const { id: leadId } = parseParams(await params, uuidParamsSchema);
    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase.from("leads").select("id").eq("id", leadId).single();
    if (leadError || !lead) throw apiError("Lead not found.", 404, "lead_not_found");

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        lead_id: leadId,
        quote_number: getQuoteNumber(),
        status: "draft",
        valid_until: getValidUntil(),
        created_by: admin.user.id
      })
      .select("id")
      .single();

    if (error || !quote) throw apiError("Unable to generate quote.", 500, "quote_generate_failed");

    await supabase.from("leads").update({ status: "quoted", updated_at: new Date().toISOString() }).eq("id", leadId);

    await logActivity({
      actorId: admin.user.id,
      action: "quote.generated",
      entityType: "quote",
      entityId: quote.id,
      metadata: { leadId, status: "draft" }
    });
    await captureEvent({ name: "quote.generated", properties: { leadId, quoteId: quote.id } });

    return jsonOk({ id: quote.id });
  });
}
