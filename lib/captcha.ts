import { apiError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/lib/monitoring";

export async function verifyCaptcha(token: string | undefined, request: Request) {
  const env = getServerEnv();

  if (!env.TURNSTILE_SECRET_KEY) {
    if (env.NODE_ENV === "production") {
      throw apiError("CAPTCHA is not configured.", 500, "captcha_not_configured");
    }
    logger.warn("captcha.skipped_missing_secret");
    return;
  }

  if (!token) {
    throw apiError("CAPTCHA verification is required.", 400, "captcha_required");
  }

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  if (ip) formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData
  });
  const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

  if (!response.ok || !result.success) {
    logger.warn("captcha.failed", { status: response.status, errorCodes: result["error-codes"] });
    await captureEvent({ name: "captcha.failed", severity: "warning", properties: { status: response.status } });
    throw apiError("CAPTCHA verification failed.", 400, "captcha_failed");
  }
}
