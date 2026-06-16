import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/lib/monitoring";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(request: Request, { key, limit, windowMs }: RateLimitConfig) {
  const ip = getClientIp(request);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;

  if (existing.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  logger.warn("rate_limit.exceeded", { key, ip, retryAfter });
  await captureEvent({
    name: "rate_limit.exceeded",
    severity: "warning",
    properties: { key, ip, retryAfter }
  });

  return NextResponse.json(
    { error: "Too many requests. Please try again later.", code: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(existing.resetAt / 1000))
      }
    }
  );
}
