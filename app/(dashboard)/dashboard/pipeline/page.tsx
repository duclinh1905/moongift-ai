import { PipelineBoard } from "@/components/crm/pipeline-board";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, company_name, contact_name, quantity, budget_per_gift, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline Kanban</h1>
        <p className="mt-2 text-muted-foreground">Drag leads through New, Contacted, Qualified, Quoted, Negotiating, Won, and Lost.</p>
      </div>
      <PipelineBoard leads={(leads ?? []) as Parameters<typeof PipelineBoard>[0]["leads"]} />
    </div>
  );
}
