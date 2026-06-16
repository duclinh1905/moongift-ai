import { assertTrustedOrigin, apiError, jsonOk, parseJson, parseParams, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { sendQuoteEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { captureEvent } from "@/lib/monitoring";
import { buildQuotePdfBytes } from "@/lib/quote-pdf";
import { quoteEmailSchema, uuidParamsSchema } from "@/lib/schema";
import { createAdminClient } from "@/lib/supabase/admin";

type LeadRef = { id?: string; company_name?: string | null; contact_name?: string | null; email?: string | null; phone?: string | null } | null;

function getLead(leads: LeadRef | LeadRef[]) {
  return Array.isArray(leads) ? leads[0] : leads;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const admin = await getWritableCrmUser();
    if (admin.status !== 200) {
      throw apiError(admin.status === 401 ? "Authentication required." : "CRM write access required.", admin.status, "unauthorized");
    }

    const { id: quoteId } = parseParams(await params, uuidParamsSchema);
    const input = await parseJson(request, quoteEmailSchema, "Invalid quote email request.");
    const supabase = createAdminClient();

    const [{ data: quote }, { data: items }] = await Promise.all([
      supabase
        .from("quotes")
        .select("id, quote_number, valid_until, subtotal, tax, total, lead_id, leads(id, company_name, contact_name, email, phone)")
        .eq("id", quoteId)
        .single(),
      supabase
        .from("quote_items")
        .select("description, quantity, unit_price, line_total")
        .eq("quote_id", quoteId)
        .order("id", { ascending: true })
    ]);

    if (!quote) throw apiError("Quote not found.", 404, "quote_not_found");
    const lead = getLead(quote.leads as LeadRef | LeadRef[]);
    const toEmail = input.email ?? lead?.email;
    if (!toEmail) throw apiError("Quote recipient email is missing.", 400, "quote_email_missing");

    const pdfBytes = buildQuotePdfBytes({
      quoteNumber: quote.quote_number,
      validUntil: quote.valid_until,
      companyName: lead?.company_name ?? "Unassigned company",
      contactName: lead?.contact_name ?? "Unassigned contact",
      email: toEmail,
      phone: lead?.phone ?? "",
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      items: items ?? []
    });
    const pdfPath = `${quote.id}/${quote.quote_number}.pdf`;

    const { error: uploadError } = await supabase.storage.from("quote-pdfs").upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true
    });
    if (uploadError) throw apiError("Unable to store quote PDF.", 500, "quote_pdf_upload_failed");

    await sendQuoteEmail({ to: toEmail, quoteNumber: quote.quote_number, pdfPath, total: Number(quote.total ?? 0) });

    const sentAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status: "sent", sent_at: sentAt, sent_pdf_path: pdfPath, sent_to_email: toEmail, updated_at: sentAt })
      .eq("id", quote.id);
    if (updateError) throw apiError("Unable to mark quote as sent.", 500, "quote_sent_update_failed");

    await supabase.from("leads").update({ status: "quoted", updated_at: sentAt }).eq("id", quote.lead_id);

    await logActivity({
      actorId: admin.user.id,
      action: "quote.sent",
      entityType: "quote",
      entityId: quote.id,
      metadata: { leadId: quote.lead_id, pdfPath, toEmail, sentAt }
    });
    await captureEvent({ name: "quote.sent", properties: { quoteId: quote.id, leadId: quote.lead_id } });

    return jsonOk({ ok: true, sentAt, pdfPath });
  });
}
