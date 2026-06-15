import { createAdminClient } from "@/lib/supabase/admin";

type ActivityLogInput = {
  actorId?: string | null;
  action: string;
  entityType: "lead" | "quote" | "quote_item" | "auth" | "artwork" | "approval" | "production" | "delivery" | "supplier" | "recipient";
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export async function logActivity({
  actorId,
  action,
  entityType,
  entityId,
  metadata = {}
}: ActivityLogInput) {
  const supabase = createAdminClient();
  await supabase.from("activity_logs").insert({
    actor_id: actorId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata
  });
}
