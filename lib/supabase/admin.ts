import { createClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
