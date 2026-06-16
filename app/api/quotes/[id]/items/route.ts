import { z } from "zod";
import { assertTrustedOrigin, apiError, jsonOk, parseJson, parseParams, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { calculateConfiguredPricing } from "@/lib/configuration";
import { logActivity } from "@/lib/activity";
import { captureEvent } from "@/lib/monitoring";
import { uuidParamsSchema } from "@/lib/schema";
import { createAdminClient } from "@/lib/supabase/admin";

const TAX_RATE = 0.08;

const quoteItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  packagingOptionId: z.string().uuid().optional(),
  personalizationOptionIds: z.array(z.string().uuid()).default([]),
  quantity: z.coerce.number().int().min(1).max(100000),
  unitPrice: z.coerce.number().min(0).max(1000000),
  baseUnitCost: z.coerce.number().min(0).max(1000000).optional(),
  logisticsUnitCost: z.coerce.number().min(0).max(1000000).default(0),
  marginPercent: z.coerce.number().min(0).max(0.95).default(0.35),
  greetingTemplate: z.string().trim().max(500).optional(),
  personalizedMessage: z.string().trim().max(1000).optional()
});

function toNumber(value: number | string | null) {
  return Number(value ?? 0);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const admin = await getWritableCrmUser();
    if (admin.status !== 200) throw apiError(admin.status === 401 ? "Authentication required." : "Admin access required.", admin.status, "unauthorized");

    const { id: quoteId } = parseParams(await params, uuidParamsSchema);
    const input = await parseJson(request, quoteItemSchema, "Invalid quote item.");
    const supabase = createAdminClient();
    const { data: quote } = await supabase.from("quotes").select("id").eq("id", quoteId).single();
    if (!quote) throw apiError("Quote not found.", 404, "quote_not_found");

    const personalizationIds = input.personalizationOptionIds ?? [];
    const [{ data: product }, { data: packaging }, { data: personalizations }] = await Promise.all([
      supabase.from("products").select("id, name, price_from").eq("id", input.productId).eq("is_active", true).single(),
      input.packagingOptionId ? supabase.from("packaging_options").select("id, name, unit_cost, unit_price").eq("id", input.packagingOptionId).single() : Promise.resolve({ data: null }),
      personalizationIds.length ? supabase.from("personalization_options").select("id, name, unit_cost, unit_price, setup_fee").in("id", personalizationIds) : Promise.resolve({ data: [] })
    ]);
    if (!product) throw apiError("Product not found.", 404, "product_not_found");

    const personalizationRows = personalizations ?? [];
    const printingUnitPrice = personalizationRows.reduce((sum, option) => sum + toNumber(option.unit_price), 0);
    const printingUnitCost = personalizationRows.reduce((sum, option) => sum + toNumber(option.unit_cost), 0);
    const setupFees = personalizationRows.reduce((sum, option) => sum + toNumber(option.setup_fee), 0);
    const packagingUnitPrice = packaging ? toNumber(packaging.unit_price) : 0;
    const packagingUnitCost = packaging ? toNumber(packaging.unit_cost) : 0;
    const pricing = calculateConfiguredPricing({ quantity: input.quantity, baseUnitPrice: input.unitPrice + packagingUnitPrice + printingUnitPrice, baseUnitCost: input.baseUnitCost, packagingUnitCost, printingUnitCost, personalizationUnitCost: setupFees / input.quantity, logisticsUnitCost: input.logisticsUnitCost, marginPercent: input.marginPercent });
    const unitPrice = Number((pricing.configuredSubtotal / input.quantity).toFixed(2));

    const configuration = {
      baseProduct: product.name,
      packaging: packaging ? { id: packaging.id, name: packaging.name, unitPrice: packagingUnitPrice, unitCost: packagingUnitCost } : null,
      personalizations: personalizationRows.map((option) => ({ id: option.id, name: option.name, unitPrice: toNumber(option.unit_price), unitCost: toNumber(option.unit_cost), setupFee: toNumber(option.setup_fee) })),
      greetingTemplate: input.greetingTemplate,
      personalizedMessage: input.personalizedMessage,
      marginPercent: input.marginPercent,
      breakdown: pricing
    };

    const { data: quoteItem, error: insertError } = await supabase.from("quote_items").insert({ quote_id: quoteId, product_id: product.id, variant_id: input.variantId, packaging_option_id: input.packagingOptionId, personalization_option_ids: personalizationIds, description: product.name, quantity: input.quantity, unit_price: unitPrice, greeting_template: input.greetingTemplate, personalized_message: input.personalizedMessage, configuration, product_cost: pricing.productCost, packaging_cost: pricing.packagingCost, printing_cost: pricing.printingCost, personalization_cost: pricing.personalizationCost, logistics_cost: pricing.logisticsCost, gross_margin: pricing.grossMargin }).select("id").single();
    if (insertError || !quoteItem) throw apiError("Unable to add quote item.", 500, "quote_item_insert_failed");

    const { data: items, error: itemsError } = await supabase.from("quote_items").select("quantity, unit_price").eq("quote_id", quoteId);
    if (itemsError) throw apiError("Unable to recalculate quote totals.", 500, "quote_totals_read_failed");
    const subtotal = (items ?? []).reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unit_price), 0);
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const { error: updateError } = await supabase.from("quotes").update({ subtotal, tax, total, updated_at: new Date().toISOString() }).eq("id", quoteId);
    if (updateError) throw apiError("Unable to update quote totals.", 500, "quote_totals_update_failed");

    await logActivity({ actorId: admin.user.id, action: "quote_item.configured", entityType: "quote_item", entityId: quoteItem.id, metadata: { quoteId, productId: product.id, subtotal, tax, total, grossMargin: pricing.grossMargin } });
    await captureEvent({ name: "quote_item.configured", properties: { quoteId, quoteItemId: quoteItem.id } });
    return jsonOk({ subtotal, tax, total, grossMargin: pricing.grossMargin, breakdown: pricing });
  });
}
