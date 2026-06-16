import { z } from "zod";
import { assertTrustedOrigin, apiError, jsonOk, parseJson, withApiHandler } from "@/lib/api";
import { getWritableCrmUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { approvalStatuses, deliveryStatuses, productionStatuses, supplierTypes } from "@/lib/operations";
import { createAdminClient } from "@/lib/supabase/admin";

const operationsSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("artwork"), quoteId: z.string().uuid().optional(), leadId: z.string().uuid().optional(), assetType: z.enum(["logo", "brand_guidelines", "artwork_file"]), fileName: z.string().min(1).max(160), fileUrl: z.string().url(), version: z.coerce.number().int().min(1).default(1), approvalStatus: z.enum(approvalStatuses).default("draft"), notes: z.string().max(1000).optional() }),
  z.object({ action: z.literal("approval"), quoteId: z.string().uuid().optional(), artworkAssetId: z.string().uuid().optional(), status: z.enum(approvalStatuses), customerNotes: z.string().max(1000).optional(), internalNotes: z.string().max(1000).optional() }),
  z.object({ action: z.literal("production"), quoteId: z.string().uuid().optional(), supplierId: z.string().uuid().optional(), status: z.enum(productionStatuses), dueDate: z.string().date().optional(), printingCost: z.coerce.number().min(0).default(0), packagingCost: z.coerce.number().min(0).default(0), logisticsCost: z.coerce.number().min(0).default(0), productionCost: z.coerce.number().min(0).default(0), actualMargin: z.coerce.number().default(0), notes: z.string().max(1000).optional() }),
  z.object({ action: z.literal("recipient_import"), quoteId: z.string().uuid(), csv: z.string().min(1).max(20000) }),
  z.object({ action: z.literal("shipment"), quoteId: z.string().uuid().optional(), recipientId: z.string().uuid().optional(), logisticsSupplierId: z.string().uuid().optional(), trackingNumber: z.string().max(120).optional(), carrier: z.string().max(120).optional(), status: z.enum(deliveryStatuses), shippingCost: z.coerce.number().min(0).default(0) }),
  z.object({ action: z.literal("supplier"), name: z.string().min(2).max(160), supplierType: z.enum(supplierTypes), contactName: z.string().max(120).optional(), email: z.string().email().optional(), phone: z.string().max(80).optional(), averageRating: z.coerce.number().min(0).max(5).default(0), onTimeRate: z.coerce.number().min(0).max(1).default(0), defectRate: z.coerce.number().min(0).max(1).default(0) }),
  z.object({ action: z.literal("supplier_performance"), supplierId: z.string().uuid(), quoteId: z.string().uuid().optional(), score: z.coerce.number().min(0).max(5), onTime: z.coerce.boolean().default(true), defects: z.coerce.number().int().min(0).default(0), notes: z.string().max(1000).optional() })
]);

function parseRecipients(csv: string, quoteId: string) {
  return csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(1).map((line) => {
    const [full_name, company_name, email, phone, address_line1, city, region, postal_code, country, personalized_message] = line.split(",").map((value) => value?.trim() ?? "");
    return { quote_id: quoteId, full_name, company_name, email, phone, address_line1, city, region, postal_code, country: country || "US", personalized_message };
  }).filter((row) => row.full_name && row.address_line1 && row.city);
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const user = await getWritableCrmUser();
    if (user.status !== 200) throw apiError("CRM write access required.", user.status, "unauthorized");
    const input = await parseJson(request, operationsSchema, "Invalid operations payload.");
    const supabase = createAdminClient();

    if (input.action === "artwork") {
      const { data, error } = await supabase.from("artwork_assets").insert({ quote_id: input.quoteId, lead_id: input.leadId, asset_type: input.assetType, file_name: input.fileName, file_url: input.fileUrl, version: input.version, approval_status: input.approvalStatus, notes: input.notes, uploaded_by: user.user.id }).select("id").single();
      if (error || !data) throw apiError("Unable to save artwork.", 500, "artwork_create_failed");
      await logActivity({ actorId: user.user.id, action: "artwork.uploaded", entityType: "artwork", entityId: data.id, metadata: { quoteId: input.quoteId, status: input.approvalStatus } });
      return jsonOk({ id: data.id });
    }

    if (input.action === "approval") {
      const now = new Date().toISOString();
      const { data, error } = await supabase.from("approval_requests").insert({ quote_id: input.quoteId, artwork_asset_id: input.artworkAssetId, status: input.status, requested_by: user.user.id, requested_at: now, decided_at: ["approved", "rejected", "revision_requested"].includes(input.status) ? now : null, customer_notes: input.customerNotes, internal_notes: input.internalNotes }).select("id").single();
      if (error || !data) throw apiError("Unable to save approval.", 500, "approval_create_failed");
      await logActivity({ actorId: user.user.id, action: `approval.${input.status}`, entityType: "approval", entityId: data.id, metadata: { quoteId: input.quoteId, artworkAssetId: input.artworkAssetId } });
      return jsonOk({ id: data.id });
    }

    if (input.action === "production") {
      const { data, error } = await supabase.from("production_jobs").insert({ quote_id: input.quoteId, supplier_id: input.supplierId, status: input.status, due_date: input.dueDate, printing_cost: input.printingCost, packaging_cost: input.packagingCost, logistics_cost: input.logisticsCost, production_cost: input.productionCost, actual_margin: input.actualMargin, notes: input.notes, created_by: user.user.id }).select("id").single();
      if (error || !data) throw apiError("Unable to save production job.", 500, "production_create_failed");
      await logActivity({ actorId: user.user.id, action: `production.${input.status}`, entityType: "production", entityId: data.id, metadata: { quoteId: input.quoteId, supplierId: input.supplierId } });
      return jsonOk({ id: data.id });
    }

    if (input.action === "recipient_import") {
      const rows = parseRecipients(input.csv, input.quoteId);
      if (!rows.length) throw apiError("Recipient CSV did not contain valid rows.", 400, "recipient_csv_empty");
      const { data, error } = await supabase.from("recipients").insert(rows).select("id");
      if (error || !data) throw apiError("Unable to import recipients.", 500, "recipient_import_failed");
      await logActivity({ actorId: user.user.id, action: "recipients.imported", entityType: "recipient", metadata: { quoteId: input.quoteId, count: data.length } });
      return jsonOk({ count: data.length });
    }

    if (input.action === "shipment") {
      const now = new Date().toISOString();
      const { data, error } = await supabase.from("shipments").insert({ quote_id: input.quoteId, recipient_id: input.recipientId, logistics_supplier_id: input.logisticsSupplierId, tracking_number: input.trackingNumber, carrier: input.carrier, status: input.status, shipping_cost: input.shippingCost, shipped_at: input.status === "in_transit" ? now : null, delivered_at: input.status === "delivered" ? now : null }).select("id").single();
      if (error || !data) throw apiError("Unable to save shipment.", 500, "shipment_create_failed");
      await supabase.from("shipment_events").insert({ shipment_id: data.id, status: input.status, event_note: `Shipment ${input.status}` });
      await logActivity({ actorId: user.user.id, action: `delivery.${input.status}`, entityType: "delivery", entityId: data.id, metadata: { quoteId: input.quoteId, trackingNumber: input.trackingNumber } });
      return jsonOk({ id: data.id });
    }

    if (input.action === "supplier") {
      const { data, error } = await supabase.from("suppliers").insert({ name: input.name, supplier_type: input.supplierType, contact_name: input.contactName, email: input.email, phone: input.phone, average_rating: input.averageRating, on_time_rate: input.onTimeRate, defect_rate: input.defectRate }).select("id").single();
      if (error || !data) throw apiError("Unable to save supplier.", 500, "supplier_create_failed");
      await logActivity({ actorId: user.user.id, action: "supplier.created", entityType: "supplier", entityId: data.id, metadata: { supplierType: input.supplierType } });
      return jsonOk({ id: data.id });
    }

    const { data, error } = await supabase.from("supplier_performance").insert({ supplier_id: input.supplierId, quote_id: input.quoteId, score: input.score, on_time: input.onTime, defects: input.defects, notes: input.notes }).select("id").single();
    if (error || !data) throw apiError("Unable to save supplier performance.", 500, "supplier_performance_create_failed");
    await logActivity({ actorId: user.user.id, action: "supplier.performance_recorded", entityType: "supplier", entityId: input.supplierId, metadata: { score: input.score, defects: input.defects } });
    return jsonOk({ id: data.id });
  });
}
