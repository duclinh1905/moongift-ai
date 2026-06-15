import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createAdminClient } from "@/lib/supabase/admin";

const TAX_RATE = 0.08;

const quoteItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(100000),
  unitPrice: z.coerce.number().min(0).max(1000000)
});

function toNumber(value: number | string | null) {
  return Number(value ?? 0);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (admin.status !== 200) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Authentication required." : "Admin access required." },
      { status: admin.status }
    );
  }

  const { id: quoteId } = await params;
  const parsed = quoteItemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote item." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", parsed.data.productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { data: quoteItem, error: insertError } = await supabase
    .from("quote_items")
    .insert({
      quote_id: quoteId,
      product_id: product.id,
      description: product.name,
      quantity: parsed.data.quantity,
      unit_price: parsed.data.unitPrice
    })
    .select("id")
    .single();

  if (insertError || !quoteItem) {
    return NextResponse.json({ error: "Unable to add quote item." }, { status: 500 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("quote_items")
    .select("quantity, unit_price")
    .eq("quote_id", quoteId);

  if (itemsError) {
    return NextResponse.json({ error: "Unable to recalculate quote totals." }, { status: 500 });
  }

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unit_price),
    0
  );
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      subtotal,
      tax,
      total,
      updated_at: new Date().toISOString()
    })
    .eq("id", quoteId);

  if (updateError) {
    return NextResponse.json({ error: "Unable to update quote totals." }, { status: 500 });
  }

  await logActivity({
    actorId: admin.user.id,
    action: "quote_item.added",
    entityType: "quote_item",
    entityId: quoteItem.id,
    metadata: {
      quoteId,
      productId: product.id,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      subtotal,
      tax,
      total
    }
  });

  return NextResponse.json({ subtotal, tax, total });
}
