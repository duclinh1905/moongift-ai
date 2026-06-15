"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductOption = {
  id: string;
  name: string;
  price_from: number | string;
};

export function QuoteBuilder({
  quoteId,
  products
}: {
  quoteId: string;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [unitPrice, setUnitPrice] = useState(products[0] ? String(products[0].price_from) : "");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      productId: selectedProductId,
      quantity: Number(formData.get("quantity")),
      unitPrice: Number(unitPrice)
    };

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/quotes/${quoteId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Unable to add quote item.");
        return;
      }

      form.reset();
      const firstProduct = products[0];
      setSelectedProductId(firstProduct?.id ?? "");
      setUnitPrice(firstProduct ? String(firstProduct.price_from) : "");
      setMessage("Quote item added and totals updated.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-card p-5">
      <h2 className="text-lg font-semibold">Quote Builder</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Product
          <select
            value={selectedProductId}
            onChange={(event) => {
              const product = products.find((option) => option.id === event.target.value);
              setSelectedProductId(event.target.value);
              setUnitPrice(product ? String(product.price_from) : "");
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            required
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="1" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unitPrice">Unit Price</Label>
          <Input
            id="unitPrice"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending || products.length === 0} className="w-full sm:w-fit">
        <Plus className="size-4" />
        {isPending ? "Adding..." : "Add item"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
