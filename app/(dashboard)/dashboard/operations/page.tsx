import { OperationsConsole } from "@/components/operations/operations-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function toNumber(value: number | string | null) {
  return Number(value ?? 0);
}

export default async function OperationsPage() {
  const supabase = await createClient();
  const [{ data: quotes }, { data: suppliers }, { data: productionJobs }, { data: shipments }] = await Promise.all([
    supabase.from("quotes").select("id, quote_number, total").order("created_at", { ascending: false }).limit(100),
    supabase.from("suppliers").select("id, name, supplier_type, average_rating, on_time_rate, defect_rate").order("name", { ascending: true }),
    supabase.from("production_jobs").select("status, printing_cost, packaging_cost, logistics_cost, production_cost, actual_margin"),
    supabase.from("shipments").select("status, shipping_cost")
  ]);
  const revenue = (quotes ?? []).reduce((sum, quote) => sum + toNumber(quote.total), 0);
  const grossMargin = (productionJobs ?? []).reduce((sum, job) => sum + toNumber(job.actual_margin), 0);
  const productionCost = (productionJobs ?? []).reduce((sum, job) => sum + toNumber(job.production_cost) + toNumber(job.printing_cost) + toNumber(job.packaging_cost), 0);
  const deliveryCost = (shipments ?? []).reduce((sum, shipment) => sum + toNumber(shipment.shipping_cost), 0);
  const inProduction = (productionJobs ?? []).filter((job) => job.status !== "completed").length;
  const inDelivery = (shipments ?? []).filter((shipment) => shipment.status !== "delivered").length;
  const supplierScore = suppliers?.length ? (suppliers.reduce((sum, supplier) => sum + toNumber(supplier.average_rating), 0) / suppliers.length).toFixed(1) : "0";

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Fulfillment & Production OS</h1>
        <p className="mt-2 text-muted-foreground">Manage artwork, approvals, production, suppliers, recipients, shipments, costs, and executive operating metrics.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Revenue" value={money(revenue)} />
        <Metric title="Gross Margin" value={money(grossMargin)} />
        <Metric title="Production Cost" value={money(productionCost)} />
        <Metric title="Delivery Cost" value={money(deliveryCost)} />
        <Metric title="Open Production" value={String(inProduction)} />
        <Metric title="Open Deliveries" value={String(inDelivery)} />
        <Metric title="Supplier Score" value={supplierScore} />
        <Metric title="Suppliers" value={String(suppliers?.length ?? 0)} />
      </div>
      <OperationsConsole suppliers={suppliers ?? []} quotes={quotes ?? []} />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>;
}
