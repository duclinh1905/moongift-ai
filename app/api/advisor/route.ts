import OpenAI from "openai";
import { NextResponse } from "next/server";
import { advisorSchema } from "@/lib/schema";
import { requireServerEnv } from "@/lib/env";
import { products } from "@/lib/products";

const fallback = {
  recommendation: "Start with a balanced premium set and reserve executive boxes for your highest-value accounts.",
  products: ["Harvest Gold Partner Set", "Jade Lantern Executive Box"],
  budgetNotes: "This keeps most gifts inside the requested budget while preserving a premium tier for strategic recipients.",
  nextSteps: ["Confirm logo treatment", "Segment recipients by account value", "Request a formal quote"]
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = advisorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide recipient, quantity, budget, and brand tone." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: requireServerEnv("OPENAI_API_KEY") });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
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
            request: parsed.data,
            catalog: products
          })
        }
      ]
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return NextResponse.json(fallback);
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json(fallback);
  }
}
