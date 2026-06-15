import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuoteLead = { company_name?: string | null } | { company_name?: string | null }[] | null;

function getLeadCompany(leads: QuoteLead) {
  return (Array.isArray(leads) ? leads[0]?.company_name : leads?.company_name) ?? "Unassigned";
}

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, status, subtotal, tax, total, valid_until, leads(company_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Quote Management</h1>
        <p className="mt-2 text-muted-foreground">Review quote status, totals, validity windows, and customer links.</p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
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
              {(quotes ?? []).map((quote) => (
                <tr key={quote.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/dashboard/quotes/${quote.id}`} className="hover:underline">
                      {quote.quote_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{getLeadCompany(quote.leads)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{quote.status}</span>
                  </td>
                  <td className="px-4 py-3">${quote.subtotal}</td>
                  <td className="px-4 py-3">${quote.tax}</td>
                  <td className="px-4 py-3 font-semibold">${quote.total}</td>
                  <td className="px-4 py-3">{quote.valid_until}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
