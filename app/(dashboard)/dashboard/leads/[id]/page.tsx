import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateQuoteButton } from "@/components/forms/generate-quote-button";
import { LeadStatusForm } from "@/components/forms/lead-status-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: lead }, { data: logs }, { data: quotes }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, company_name, contact_name, email, phone, audience, quantity, budget_per_gift, delivery_date, message, status, created_at"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("activity_logs")
      .select("id, action, entity_type, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("quotes").select("id, quote_number, status, sent_at, created_at").eq("lead_id", id)
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/leads" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to leads
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{lead.company_name}</h1>
          <p className="mt-2 text-muted-foreground">Lead detail and quote workflow.</p>
        </div>
        <GenerateQuoteButton leadId={lead.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Status</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <TimelineItem title="Lead created" when={lead.created_at} detail={`${lead.contact_name} requested ${lead.quantity} gifts.`} />
            {(quotes ?? []).map((quote) => (
              <TimelineItem
                key={quote.id}
                title={`Quote generated: ${quote.quote_number}`}
                when={quote.created_at}
                detail={`Status: ${quote.status}${quote.sent_at ? `, sent ${new Date(quote.sent_at).toLocaleString()}` : ""}`}
              />
            ))}
            {(logs ?? [])
              .filter((log) => log.entity_id === lead.id || (log.metadata as { leadId?: string } | null)?.leadId === lead.id)
              .map((log) => (
                <TimelineItem key={log.id} title={log.action} when={log.created_at} detail={`${log.entity_type} ${log.entity_id ?? ""}`} />
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Company" value={lead.company_name} />
            <Detail label="Contact" value={lead.contact_name} />
            <Detail label="Email" value={lead.email} />
            <Detail label="Phone" value={lead.phone} />
            <Detail label="Audience" value={lead.audience} />
            <Detail label="Quantity" value={String(lead.quantity)} />
            <Detail label="Budget" value={`$${lead.budget_per_gift}`} />
            <Detail label="Delivery Date" value={lead.delivery_date} />
            <Detail label="Status" value={lead.status} />
            <Detail label="Created At" value={new Date(lead.created_at).toLocaleString()} />
            <div className="sm:col-span-2">
              <Detail label="Message" value={lead.message ?? "No message provided."} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function TimelineItem({ title, when, detail }: { title: string; when: string; detail: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold">{title}</div>
        <time className="text-muted-foreground">{new Date(when).toLocaleString()}</time>
      </div>
      <p className="mt-1 text-muted-foreground">{detail}</p>
    </div>
  );
}
