import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
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

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (admin.status !== 200) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Authentication required." : "Admin access required." },
      { status: admin.status }
    );
  }

  const { id: leadId } = await params;
  const supabase = createAdminClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

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

  if (error || !quote) {
    return NextResponse.json({ error: "Unable to generate quote." }, { status: 500 });
  }

  await logActivity({
    actorId: admin.user.id,
    action: "quote.generated",
    entityType: "quote",
    entityId: quote.id,
    metadata: { leadId, status: "draft" }
  });

  return NextResponse.json({ id: quote.id });
}
