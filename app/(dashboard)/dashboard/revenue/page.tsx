import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const quoteStatuses = ["draft", "sent", "accepted", "rejected"] as const;

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

export default async function RevenuePage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, status, subtotal, tax, total, valid_until, leads(company_name)")
    .order("created_at", { ascending: false });

  const allQuotes = quotes ?? [];
  const pipelineTotal = allQuotes
    .filter((quote) => quote.status !== "rejected")
    .reduce((sum, quote) => sum + toNumber(quote.total), 0);
  const wonRevenue = allQuotes
    .filter((quote) => quote.status === "accepted")
    .reduce((sum, quote) => sum + toNumber(quote.total), 0);
  const openRevenue = allQuotes
    .filter((quote) => quote.status === "draft" || quote.status === "sent")
    .reduce((sum, quote) => sum + toNumber(quote.total), 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Monitor quote value, won revenue, and open pipeline.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Pipeline Value" value={money(pipelineTotal)} />
        <Metric title="Won Revenue" value={money(wonRevenue)} />
        <Metric title="Open Revenue" value={money(openRevenue)} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {quoteStatuses.map((status) => {
          const statusQuotes = allQuotes.filter((quote) => quote.status === status);
          const total = statusQuotes.reduce((sum, quote) => sum + toNumber(quote.total), 0);
          return <Metric key={status} title={`${status} quotes`} value={`${statusQuotes.length} / ${money(total)}`} />;
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quote Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  {["Quote", "Company", "Status", "Subtotal", "Tax", "Total", "Valid until"].map((heading) => (
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
                    <td className="px-4 py-3">{quote.leads?.company_name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">{quote.status}</td>
                    <td className="px-4 py-3">{money(toNumber(quote.subtotal))}</td>
                    <td className="px-4 py-3">{money(toNumber(quote.tax))}</td>
                    <td className="px-4 py-3 font-semibold">{money(toNumber(quote.total))}</td>
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
