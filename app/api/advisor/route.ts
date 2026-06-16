import OpenAI from "openai";
import { z } from "zod";
import { assertTrustedOrigin, parseJson, withApiHandler, jsonOk } from "@/lib/api";
import { requireServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/lib/monitoring";
import { products } from "@/lib/products";
import { enforceRateLimit } from "@/lib/rate-limit";
import { advisorSchema } from "@/lib/schema";

const fallback = {
  recommendation: "Start with a balanced premium set and reserve executive boxes for your highest-value accounts.",
  products: ["Harvest Gold Partner Set", "Jade Lantern Executive Box"],
  budgetNotes: "This keeps most gifts inside the requested budget while preserving a premium tier for strategic recipients.",
  nextSteps: ["Confirm logo treatment", "Segment recipients by account value", "Request a formal quote"]
};

const advisorResponseSchema = z.object({
  recommendation: z.string().min(1).max(1000),
  products: z.array(z.string().min(1).max(160)).min(1).max(5),
  budgetNotes: z.string().min(1).max(1000),
  nextSteps: z.array(z.string().min(1).max(180)).min(1).max(6)
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    assertTrustedOrigin(request);
    const rateLimitResponse = await enforceRateLimit(request, { key: "advisor", limit: 20, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const input = await parseJson(request, advisorSchema, "Please provide recipient, quantity, budget, and brand tone.");
    const client = new OpenAI({ apiKey: requireServerEnv("OPENAI_API_KEY") });

    try {
      const completion = await client.chat.completions.create({
        model: requireServerEnv("OPENAI_MODEL"),
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a B2B corporate gifting strategist. Return strict JSON with recommendation, products, budgetNotes, nextSteps. Be concise and operational."
          },
          {
            role: "user",
            content: JSON.stringify({
              request: input,
              catalog: products
            })
          }
        ]
      });

      const content = completion.choices[0]?.message.content;
      if (!content) return jsonOk(fallback);

      const parsed = advisorResponseSchema.safeParse(JSON.parse(content));
      if (!parsed.success) {
        logger.warn("advisor.invalid_model_response", { issues: parsed.error.flatten() });
        await captureEvent({ name: "advisor.invalid_model_response", severity: "warning" });
        return jsonOk(fallback);
      }

      return jsonOk(parsed.data);
    } catch (error) {
      logger.warn("advisor.fallback_used", { error });
      await captureEvent({ name: "advisor.fallback_used", severity: "warning" });
      return jsonOk(fallback);
    }
  });
}
