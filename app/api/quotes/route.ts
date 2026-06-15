import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/schema";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quoteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please review the quote request fields." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").insert({
    company_name: parsed.data.companyName,
    contact_name: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    quantity: parsed.data.quantity,
    budget_per_gift: parsed.data.budgetPerGift,
    delivery_date: parsed.data.deliveryDate,
    audience: parsed.data.audience,
    message: parsed.data.message
  });

  if (error) {
    return NextResponse.json({ error: "Unable to create the lead right now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
