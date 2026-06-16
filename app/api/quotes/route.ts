import { assertTrustedOrigin, parseJson, withApiHandler, jsonOk } from "@/lib/api";
import { verifyCaptcha } from "@/lib/captcha";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/lib/monitoring";
import { enforceRateLimit } from "@/lib/rate-limit";
import { quoteRequestSchema } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const rateLimitResponse = await enforceRateLimit(request, { key: "quote_request", limit: 8, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const input = await parseJson(request, quoteRequestSchema, "Please review the quote request fields.");
    await verifyCaptcha(input.captchaToken, request);

    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      company_name: input.companyName,
      contact_name: input.contactName,
      email: input.email,
      phone: input.phone,
      quantity: input.quantity,
      budget_per_gift: input.budgetPerGift,
      delivery_date: input.deliveryDate,
      audience: input.audience,
      message: input.message
    });

    if (error) {
      logger.error("quote_request.insert_failed", { error });
      await captureEvent({ name: "quote_request.insert_failed", severity: "error" });
      throw new Error("Unable to create the lead right now.");
    }

    logger.info("quote_request.created", { companyName: input.companyName });
    await captureEvent({ name: "quote_request.created", properties: { companyName: input.companyName } });
    return jsonOk({ ok: true });
  });
}
