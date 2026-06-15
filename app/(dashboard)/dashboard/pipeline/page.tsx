import Link from "next/link";
import { LeadStatusForm } from "@/components/forms/lead-status-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statuses = ["new", "qualified", "contacted", "won", "lost"] as const;

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
        <p className="mt-2 text-muted-foreground">Move leads through qualification, contact, and close stages.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {statuses.map((status) => {
          const columnLeads = (leads ?? []).filter((lead) => lead.status === status);
          return (
            <section key={status} className="grid content-start gap-3">
              <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
                <h2 className="font-semibold capitalize">{status}</h2>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">{columnLeads.length}</span>
              </div>
              {columnLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <Link href={`/dashboard/leads/${lead.id}`} className="hover:underline">
                        {lead.company_name}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="text-sm text-muted-foreground">
                      <div>{lead.contact_name}</div>
                      <div>{lead.quantity} gifts at ${lead.budget_per_gift}</div>
                    </div>
                    <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
                  </CardContent>
                </Card>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
