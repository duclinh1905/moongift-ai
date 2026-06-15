"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductOption = { id: string; name: string; price_from: number | string };
type PackagingOption = { id: string; name: string; unit_price: number | string; unit_cost: number | string };
type PersonalizationOption = { id: string; name: string; unit_price: number | string; unit_cost: number | string; setup_fee: number | string };
type PricingRule = { id: string; name: string; margin_percent: number | string; logistics_unit_cost: number | string };

export function QuoteBuilder({ quoteId, products, packagingOptions = [], personalizationOptions = [], pricingRules = [] }: { quoteId: string; products: ProductOption[]; packagingOptions?: PackagingOption[]; personalizationOptions?: PersonalizationOption[]; pricingRules?: PricingRule[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [unitPrice, setUnitPrice] = useState(products[0] ? String(products[0].price_from) : "");
  const [isPending, startTransition] = useTransition();
  const defaultRule = pricingRules[0];
  const preview = useMemo(() => "Choose packaging, personalization, logistics, and margin to price this configured gift.", []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      productId: selectedProductId,
      quantity: Number(formData.get("quantity")),
      unitPrice: Number(unitPrice),
      baseUnitCost: Number(formData.get("baseUnitCost") || 0),
      packagingOptionId: String(formData.get("packagingOptionId") || "") || undefined,
      personalizationOptionIds: formData.getAll("personalizationOptionIds").map(String),
      logisticsUnitCost: Number(formData.get("logisticsUnitCost") || defaultRule?.logistics_unit_cost || 0),
      marginPercent: Number(formData.get("marginPercent") || defaultRule?.margin_percent || 0.35),
      greetingTemplate: String(formData.get("greetingTemplate") || ""),
      personalizedMessage: String(formData.get("personalizedMessage") || "")
    };

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/quotes/${quoteId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "Unable to add quote item."); return; }
      form.reset();
      const firstProduct = products[0];
      setSelectedProductId(firstProduct?.id ?? "");
      setUnitPrice(firstProduct ? String(firstProduct.price_from) : "");
      setMessage(`Configured quote item added. Margin: $${result.grossMargin ?? 0}.`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-card p-5">
      <div><h2 className="text-lg font-semibold">Configuration & Personalization Engine</h2><p className="mt-1 text-sm text-muted-foreground">{preview}</p></div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium">Base product<select value={selectedProductId} onChange={(event) => { const product = products.find((option) => option.id === event.target.value); setSelectedProductId(event.target.value); setUnitPrice(product ? String(product.price_from) : ""); }} className="h-10 rounded-md border bg-background px-3 text-sm" required>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <Field name="quantity" label="Quantity" type="number" min="1" required />
        <Field name="unitPrice" label="Selling unit price" type="number" min="0" step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} required />
        <Field name="baseUnitCost" label="Product unit cost" type="number" min="0" step="0.01" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">Packaging<select name="packagingOptionId" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">No packaging add-on</option>{packagingOptions.map((option) => <option key={option.id} value={option.id}>{option.name} (+${option.unit_price})</option>)}</select></label>
        <Field name="logisticsUnitCost" label="Logistics unit cost" type="number" min="0" step="0.01" defaultValue={defaultRule ? String(defaultRule.logistics_unit_cost) : "1.5"} />
        <Field name="marginPercent" label="Target margin" type="number" min="0" max="0.95" step="0.01" defaultValue={defaultRule ? String(defaultRule.margin_percent) : "0.35"} />
      </div>
      <div className="grid gap-2"><div className="text-sm font-medium">Personalization</div><div className="grid gap-2 md:grid-cols-3">{personalizationOptions.map((option) => <label key={option.id} className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" name="personalizationOptionIds" value={option.id} />{option.name} (+${option.unit_price})</label>)}</div></div>
      <div className="grid gap-3 md:grid-cols-2"><Field name="greetingTemplate" label="Greeting / CEO letter template" placeholder="Warm executive greeting" /><Field name="personalizedMessage" label="Personalized message" placeholder="Thank you for a strong partnership..." /></div>
      <Button type="submit" disabled={isPending || products.length === 0} className="w-full sm:w-fit"><Plus className="size-4" />{isPending ? "Adding..." : "Add configured item"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { const { label, ...inputProps } = props; return <div className="grid gap-2"><Label htmlFor={String(inputProps.name)}>{label}</Label><Input id={String(inputProps.name)} {...inputProps} /></div>; }
