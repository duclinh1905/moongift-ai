import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/lib/monitoring";

type QuoteEmailInput = {
  to: string;
  quoteNumber: string;
  pdfPath: string;
  total: number;
};

export async function sendQuoteEmail(input: QuoteEmailInput) {
  const env = getServerEnv();
  const webhookUrl = process.env.QUOTE_EMAIL_WEBHOOK_URL;
  const payload = {
    type: "quote.sent",
    to: input.to,
    quoteNumber: input.quoteNumber,
    pdfPath: input.pdfPath,
    total: input.total
  };

  if (!webhookUrl) {
    if (env.NODE_ENV === "production") {
      throw new Error("QUOTE_EMAIL_WEBHOOK_URL is required to send quote emails in production.");
    }
    logger.info("quote.email.simulated", payload);
    await captureEvent({ name: "quote.email.simulated", properties: payload });
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Quote email webhook failed with status ${response.status}`);
  }

  logger.info("quote.email.sent", payload);
  await captureEvent({ name: "quote.email.sent", properties: payload });
}
