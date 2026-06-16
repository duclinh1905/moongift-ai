import { getServerEnv } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function shouldLog(level: LogLevel) {
  const configured = getServerEnv().LOG_LEVEL;
  return levels[level] >= levels[configured];
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

export function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
    error: context.error ? serializeError(context.error) : undefined
  };

  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context)
};
