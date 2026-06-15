import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MetadataValue = string | number | boolean | null;

function formatMetadata(metadata: Record<string, MetadataValue> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "No metadata";
  }

  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="mt-2 text-muted-foreground">Review CRM changes made by admin users.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(logs ?? []).map((log) => {
              return (
                <div key={log.id} className="rounded-md border p-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-semibold">{log.action}</div>
                    <time className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</time>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    {log.actor_id ?? "Admin"} changed {log.entity_type}
                    {log.entity_id ? ` ${log.entity_id}` : ""}.
                  </div>
                  <div className="mt-1 text-muted-foreground">{formatMetadata(log.metadata as Record<string, MetadataValue>)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
