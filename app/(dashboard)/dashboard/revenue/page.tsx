import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forecastWeights } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuoteLead = { company_name?: string | null } | { company_name?: string | null }[] | null;

function getLeadCompany(leads: QuoteLead) {
  return (Array.isArray(leads) ? leads[0]?.company_name : leads?.company_name) ?? "Unassigned";
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function percent(value: number) {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function toNumber(value: number | string | null) {
  return Number(value ?? 0);
}

export default async function RevenuePage() {
  const supabase = await createClient();
  const [{ data: quotes }, { data: leads }, { data: quoteItems }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, status, subtotal, tax, total, valid_until, sent_at, leads(company_name)")
      .order("created_at", { ascending: false }),
    supabase.from("leads").select("status, quantity, budget_per_gift"),
    supabase.from("quote_items").select("quantity, unit_price, packaging_cost, printing_cost, personalization_cost, logistics_cost, product_cost, gross_margin")
  ]);

  const allQuotes = quotes ?? [];
  const allLeads = leads ?? [];
  const pipelineValue = allLeads
    .filter((lead) => lead.status !== "lost")
    .reduce((sum, lead) => sum + toNumber(lead.quantity) * toNumber(lead.budget_per_gift), 0);
  const forecastRevenue = allLeads.reduce(
    (sum, lead) => sum + toNumber(lead.quantity) * toNumber(lead.budget_per_gift) * (forecastWeights[lead.status as keyof typeof forecastWeights] ?? 0),
    0
  );
  const wonDeals = allLeads.filter((lead) => lead.status === "won").length;
  const lostDeals = allLeads.filter((lead) => lead.status === "lost").length;
  const closedDeals = wonDeals + lostDeals;
  const quotedDeals = allLeads.filter((lead) => ["quoted", "negotiating", "won", "lost"].includes(String(lead.status))).length;
  const quoteValues = allQuotes.map((quote) => toNumber(quote.total)).filter((value) => value > 0);
  const averageQuoteValue = quoteValues.length ? quoteValues.reduce((sum, value) => sum + value, 0) / quoteValues.length : 0;
  const winRate = closedDeals ? wonDeals / closedDeals : 0;
  const conversionRate = allLeads.length ? wonDeals / allLeads.length : 0;
  const allQuoteItems = quoteItems ?? [];
  const packagingRevenue = allQuoteItems.reduce((sum, item) => sum + toNumber(item.packaging_cost), 0);
  const personalizationRevenue = allQuoteItems.reduce((sum, item) => sum + toNumber(item.printing_cost) + toNumber(item.personalization_cost), 0);
  const grossMargin = allQuoteItems.reduce((sum, item) => sum + toNumber(item.gross_margin), 0);
  const orderCount = allQuotes.length;
  const averageOrderValue = orderCount ? allQuotes.reduce((sum, quote) => sum + toNumber(quote.total), 0) / orderCount : 0;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Monitor pipeline value, weighted forecast, win rate, average quote value, and conversion.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <Metric title="Pipeline Value" value={money(pipelineValue)} />
        <Metric title="Forecast Revenue" value={money(forecastRevenue)} />
        <Metric title="Win Rate" value={percent(winRate)} />
        <Metric title="Average Quote" value={money(averageQuoteValue)} />
        <Metric title="Conversion Rate" value={percent(conversionRate)} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Packaging Revenue" value={money(packagingRevenue)} />
        <Metric title="Personalization Revenue" value={money(personalizationRevenue)} />
        <Metric title="Average Order Value" value={money(averageOrderValue)} />
        <Metric title="Gross Margin" value={money(grossMargin)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Quoted Leads" value={String(quotedDeals)} />
        <Metric title="Won Deals" value={String(wonDeals)} />
        <Metric title="Lost Deals" value={String(lostDeals)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quote Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  {["Quote", "Company", "Status", "Subtotal", "Tax", "Total", "Sent", "Valid until"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allQuotes.map((quote) => (
                  <tr key={quote.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/dashboard/quotes/${quote.id}`} className="hover:underline">
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{getLeadCompany(quote.leads)}</td>
                    <td className="px-4 py-3">{quote.status}</td>
                    <td className="px-4 py-3">{money(toNumber(quote.subtotal))}</td>
                    <td className="px-4 py-3">{money(toNumber(quote.tax))}</td>
                    <td className="px-4 py-3 font-semibold">{money(toNumber(quote.total))}</td>
                    <td className="px-4 py-3">{quote.sent_at ? new Date(quote.sent_at).toLocaleDateString() : "Not sent"}</td>
                    <td className="px-4 py-3">{quote.valid_until}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
