import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function toNumber(value: number | string | null) {
  return Number(value ?? 0);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ count: leadCount }, { count: quoteCount }, { data: recentLeads }, { data: quotes }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("quotes").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("id, company_name, contact_name, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("quotes").select("status, total")
  ]);
  const pipelineValue = (quotes ?? [])
    .filter((quote) => quote.status !== "rejected")
    .reduce((sum, quote) => sum + toNumber(quote.total), 0);
  const wonRevenue = (quotes ?? [])
    .filter((quote) => quote.status === "accepted")
    .reduce((sum, quote) => sum + toNumber(quote.total), 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Track Mid-Autumn pipeline activity and sales operations.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Leads" value={String(leadCount ?? 0)} />
        <Metric title="Quotes" value={String(quoteCount ?? 0)} />
        <Metric title="Pipeline Value" value={money(pipelineValue)} />
        <Metric title="Won Revenue" value={money(wonRevenue)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {(recentLeads ?? []).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
                <div>
                  <div className="font-medium">{lead.company_name}</div>
                  <div className="text-muted-foreground">{lead.contact_name}</div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{lead.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
