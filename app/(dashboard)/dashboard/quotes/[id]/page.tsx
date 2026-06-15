import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/forms/quote-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: quote }, { data: items }, { data: products }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, status, valid_until, notes, subtotal, tax, total, leads(id, company_name, contact_name)")
      .eq("id", id)
      .single(),
    supabase
      .from("quote_items")
      .select("id, description, quantity, unit_price, line_total")
      .eq("quote_id", id)
      .order("id", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, price_from")
      .eq("is_active", true)
      .order("name", { ascending: true })
  ]);

  if (!quote) {
    notFound();
  }

  const lead = Array.isArray(quote.leads) ? quote.leads[0] : quote.leads;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/quotes" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to quotes
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{quote.quote_number}</h1>
          <p className="mt-2 text-muted-foreground">Quote detail and line item builder.</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/quotes/${quote.id}/pdf`}>Generate Quote PDF</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Lead" value={lead?.contact_name ?? "Unassigned"} />
            <Detail label="Company" value={lead?.company_name ?? "Unassigned"} />
            <Detail label="Status" value={quote.status} />
            <Detail label="Valid Until" value={quote.valid_until} />
            <div className="sm:col-span-2">
              <Detail label="Notes" value={quote.notes ?? "No notes yet."} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <QuoteBuilder quoteId={quote.id} products={products ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  {["Product", "Quantity", "Unit Price", "Line Total"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{item.description}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">${item.unit_price}</td>
                    <td className="px-4 py-3 font-semibold">${item.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-2 text-sm sm:ml-auto sm:w-72">
            <TotalRow label="Subtotal" value={`$${quote.subtotal}`} />
            <TotalRow label="Tax" value={`$${quote.tax}`} />
            <TotalRow label="Total" value={`$${quote.total}`} strong />
          </div>
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

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-lg font-bold" : "font-semibold"}>{value}</span>
    </div>
  );
}
