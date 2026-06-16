import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/lib/monitoring";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500,
    public code = "internal_error"
  ) {
    super(message);
  }
}

export function apiError(message: string, status: number, code: string) {
  return new ApiError(message, status, code);
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>, errorMessage = "Invalid request payload.") {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw apiError("Request body must be valid JSON.", 400, "invalid_json");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    logger.warn("api.validation_failed", { issues: parsed.error.flatten() });
    throw apiError(errorMessage, 400, "validation_failed");
  }
  return parsed.data;
}

export function parseParams<T>(params: unknown, schema: z.ZodType<T>) {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw apiError("Invalid route parameters.", 400, "invalid_route_params");
  }
  return parsed.data;
}


export function assertTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    logger.warn("api.untrusted_origin", { origin, requestOrigin });
    throw apiError("Request origin is not allowed.", 403, "untrusted_origin");
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function withApiHandler(handler: () => Promise<Response>) {
  return handler().catch(async (error: unknown) => {
    const apiErrorValue = error instanceof ApiError ? error : new ApiError("Unexpected server error.");
    logger.error("api.error", { error, status: apiErrorValue.status, code: apiErrorValue.code });
    await captureEvent({
      name: "api.error",
      severity: apiErrorValue.status >= 500 ? "error" : "warning",
      properties: { status: apiErrorValue.status, code: apiErrorValue.code }
    });

    return NextResponse.json(
      { error: apiErrorValue.message, code: apiErrorValue.code },
      { status: apiErrorValue.status }
    );
  });
}
