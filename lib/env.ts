import { z } from "zod";

const urlSchema = z.string().url();

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: urlSchema.default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional()
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MONITORING_WEBHOOK_URL: z.string().url().optional(),
  QUOTE_EMAIL_WEBHOOK_URL: z.string().url().optional()
});

type PublicEnv = z.infer<typeof publicEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;

type ServerEnvName = keyof ServerEnv;
type PublicEnvName = keyof PublicEnv;

let cachedServerEnv: ServerEnv | null = null;
let cachedPublicEnv: PublicEnv | null = null;

function formatEnvError(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

export function getPublicEnv() {
  if (!cachedPublicEnv) {
    const parsed = publicEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid public environment: ${formatEnvError(parsed.error)}`);
    }
    cachedPublicEnv = parsed.data;
  }
  return cachedPublicEnv;
}

export function getServerEnv() {
  if (!cachedServerEnv) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid server environment: ${formatEnvError(parsed.error)}`);
    }

    if (parsed.data.NODE_ENV === "production") {
      const missingProductionVars = ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY", "TURNSTILE_SECRET_KEY"].filter(
        (name) => !parsed.data[name as ServerEnvName]
      );
      if (missingProductionVars.length > 0) {
        throw new Error(`Missing required production environment variables: ${missingProductionVars.join(", ")}`);
      }
    }

    cachedServerEnv = parsed.data;
  }
  return cachedServerEnv;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export function requireServerEnv(name: ServerEnvName) {
  const value = getServerEnv()[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function requirePublicEnv(name: PublicEnvName) {
  const value = getPublicEnv()[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function hasServerEnv(name: ServerEnvName) {
  return Boolean(getServerEnv()[name]);
}
