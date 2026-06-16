import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type MonitoringEvent = {
  name: string;
  severity?: "info" | "warning" | "error";
  properties?: Record<string, unknown>;
};

export async function captureEvent({ name, severity = "info", properties = {} }: MonitoringEvent) {
  const env = getServerEnv();
  const payload = { name, severity, properties, timestamp: new Date().toISOString() };

  logger[severity === "warning" ? "warn" : severity]("monitoring.event", payload);

  if (!env.MONITORING_WEBHOOK_URL) return;

  try {
    await fetch(env.MONITORING_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (error) {
    logger.warn("monitoring.webhook_failed", { error, eventName: name });
  }
}
