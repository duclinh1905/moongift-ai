"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { approvalStatuses, deliveryStatuses, productionStatuses, supplierTypes, humanizeStatus } from "@/lib/operations";

type Supplier = { id: string; name: string; supplier_type: string };
type Quote = { id: string; quote_number: string };

export function OperationsConsole({ suppliers, quotes }: { suppliers: Supplier[]; quotes: Quote[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(payload: Record<string, unknown>) {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      setMessage(response.ok ? `Saved operation ${result.id ?? result.count ?? ""}` : result.error ?? "Operation failed.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {message ? <p className="xl:col-span-2 text-sm text-muted-foreground">{message}</p> : null}
      <Panel title="Artwork Management" description="Upload logo, brand guidelines, and artwork versions by URL.">
        <OperationForm onSubmit={(data) => submit({ action: "artwork", quoteId: data.quoteId, assetType: data.assetType, fileName: data.fileName, fileUrl: data.fileUrl, version: Number(data.version || 1), approvalStatus: data.approvalStatus, notes: data.notes })} disabled={isPending}>
          <QuoteSelect quotes={quotes} /><Select name="assetType" options={["logo", "brand_guidelines", "artwork_file"]} /><Field name="fileName" placeholder="logo-v2.png" /><Field name="fileUrl" placeholder="https://..." /><Field name="version" type="number" placeholder="1" /><Select name="approvalStatus" options={[...approvalStatuses]} /><Textarea name="notes" placeholder="Artwork notes" />
        </OperationForm>
      </Panel>
      <Panel title="Customer Approval" description="Capture approval decisions and revision requests.">
        <OperationForm onSubmit={(data) => submit({ action: "approval", quoteId: data.quoteId, status: data.status, customerNotes: data.customerNotes, internalNotes: data.internalNotes })} disabled={isPending}>
          <QuoteSelect quotes={quotes} /><Select name="status" options={[...approvalStatuses]} /><Textarea name="customerNotes" placeholder="Customer notes" /><Textarea name="internalNotes" placeholder="Internal notes" />
        </OperationForm>
      </Panel>
      <Panel title="Production Workflow" description="Track printing, packaging, QC, shipment readiness, completion, and costs.">
        <OperationForm onSubmit={(data) => submit({ action: "production", quoteId: data.quoteId, supplierId: data.supplierId, status: data.status, dueDate: data.dueDate || undefined, printingCost: Number(data.printingCost || 0), packagingCost: Number(data.packagingCost || 0), logisticsCost: Number(data.logisticsCost || 0), productionCost: Number(data.productionCost || 0), actualMargin: Number(data.actualMargin || 0), notes: data.notes })} disabled={isPending}>
          <QuoteSelect quotes={quotes} /><SupplierSelect suppliers={suppliers} /><Select name="status" options={[...productionStatuses]} /><Field name="dueDate" type="date" /><Field name="printingCost" type="number" placeholder="Printing cost" /><Field name="packagingCost" type="number" placeholder="Packaging cost" /><Field name="logisticsCost" type="number" placeholder="Logistics cost" /><Field name="productionCost" type="number" placeholder="Production cost" /><Field name="actualMargin" type="number" placeholder="Actual margin" /><Textarea name="notes" placeholder="Production notes" />
        </OperationForm>
      </Panel>
      <Panel title="Multi-recipient Delivery" description="Paste CSV rows: name,company,email,phone,address,city,region,postal,country,message.">
        <OperationForm onSubmit={(data) => submit({ action: "recipient_import", quoteId: data.quoteId, csv: data.csv })} disabled={isPending}>
          <QuoteSelect quotes={quotes} /><Textarea name="csv" placeholder="full_name,company,email,phone,address,city,region,postal,country,message&#10;Jane Doe,Acme,jane@acme.com,+1,1 Main St,NY,NY,10001,US,Thank you" />
        </OperationForm>
      </Panel>
      <Panel title="Shipment Generation" description="Create shipment records, tracking numbers, and delivery events.">
        <OperationForm onSubmit={(data) => submit({ action: "shipment", quoteId: data.quoteId, logisticsSupplierId: data.supplierId, trackingNumber: data.trackingNumber, carrier: data.carrier, status: data.status, shippingCost: Number(data.shippingCost || 0) })} disabled={isPending}>
          <QuoteSelect quotes={quotes} /><SupplierSelect suppliers={suppliers.filter((supplier) => supplier.supplier_type === "logistics")} /><Field name="trackingNumber" placeholder="TRACK123" /><Field name="carrier" placeholder="DHL" /><Select name="status" options={[...deliveryStatuses]} /><Field name="shippingCost" type="number" placeholder="Shipping cost" />
        </OperationForm>
      </Panel>
      <Panel title="Supplier Management" description="Add printing, packaging, and logistics vendors with performance baselines.">
        <OperationForm onSubmit={(data) => submit({ action: "supplier", name: data.name, supplierType: data.supplierType, contactName: data.contactName, email: data.email || undefined, phone: data.phone, averageRating: Number(data.averageRating || 0), onTimeRate: Number(data.onTimeRate || 0), defectRate: Number(data.defectRate || 0) })} disabled={isPending}>
          <Field name="name" placeholder="Supplier name" /><Select name="supplierType" options={[...supplierTypes]} /><Field name="contactName" placeholder="Contact" /><Field name="email" type="email" placeholder="ops@supplier.com" /><Field name="phone" placeholder="Phone" /><Field name="averageRating" type="number" placeholder="4.5" /><Field name="onTimeRate" type="number" placeholder="0.95" /><Field name="defectRate" type="number" placeholder="0.02" />
        </OperationForm>
      </Panel>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="rounded-lg border bg-card p-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p><div className="mt-4">{children}</div></section>; }
function OperationForm({ children, disabled, onSubmit }: { children: React.ReactNode; disabled: boolean; onSubmit: (data: Record<string, string>) => void }) { return <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>); event.currentTarget.reset(); }}>{children}<Button disabled={disabled}>{disabled ? "Saving..." : "Save"}</Button></form>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement>) { return <Input {...props} />; }
function Select({ name, options }: { name: string; options: string[] }) { return <select name={name} className="h-10 rounded-md border bg-background px-3 text-sm">{options.map((option) => <option key={option} value={option}>{humanizeStatus(option)}</option>)}</select>; }
function QuoteSelect({ quotes }: { quotes: Quote[] }) { return <select name="quoteId" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">No quote</option>{quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.quote_number}</option>)}</select>; }
function SupplierSelect({ suppliers }: { suppliers: Supplier[] }) { return <select name="supplierId" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">No supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>; }
