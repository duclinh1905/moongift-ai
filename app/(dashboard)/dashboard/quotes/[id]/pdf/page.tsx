import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/forms/print-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value ?? 0));
}

export default async function QuotePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, quote_number, status, valid_until, notes, subtotal, tax, total, leads(company_name, contact_name, email, phone)")
      .eq("id", id)
      .single(),
    supabase
      .from("quote_items")
      .select("id, description, quantity, unit_price, line_total")
      .eq("quote_id", id)
      .order("id", { ascending: true })
  ]);

  if (!quote) {
    notFound();
  }

  const lead = Array.isArray(quote.leads) ? quote.leads[0] : quote.leads;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 bg-background px-6 py-8 print:max-w-none print:px-0">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href={`/dashboard/quotes/${quote.id}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to quote
        </Link>
        <PrintButton />
      </div>
      <section className="rounded-lg border bg-card p-8 print:border-0 print:shadow-none">
        <div className="flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">MoonGift AI</p>
            <h1 className="mt-2 text-3xl font-bold">Quote {quote.quote_number}</h1>
            <p className="mt-2 text-muted-foreground">Valid until {quote.valid_until}</p>
          </div>
          <div className="text-sm sm:text-right">
            <div className="font-semibold">{lead?.company_name ?? "Unassigned company"}</div>
            <div className="text-muted-foreground">{lead?.contact_name ?? "Unassigned contact"}</div>
            <div className="text-muted-foreground">{lead?.email ?? ""}</div>
            <div className="text-muted-foreground">{lead?.phone ?? ""}</div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="border-b text-left">
            <tr>
              {["Product", "Quantity", "Unit Price", "Line Total"].map((heading) => (
                <th key={heading} className="py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3 font-medium">{item.description}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3">{money(item.unit_price)}</td>
                <td className="py-3 font-semibold">{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 grid gap-2 text-sm sm:ml-auto sm:w-72">
          <TotalRow label="Subtotal" value={money(quote.subtotal)} />
          <TotalRow label="Tax" value={money(quote.tax)} />
          <TotalRow label="Total" value={money(quote.total)} strong />
        </div>

        {quote.notes ? (
          <div className="mt-8 rounded-md bg-muted p-4 text-sm">
            <div className="font-semibold">Notes</div>
            <p className="mt-2 text-muted-foreground">{quote.notes}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-xl font-bold" : "font-semibold"}>{value}</span>
    </div>
  );
}
