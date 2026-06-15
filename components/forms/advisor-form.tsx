"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AdvisorResult = {
  recommendation: string;
  products: string[];
  budgetNotes: string;
  nextSteps: string[];
};

export function AdvisorForm() {
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));

    startTransition(async () => {
      setError(null);
      setResult(null);
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to generate a recommendation.");
        return;
      }
      setResult(data);
    });
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="recipientType" label="Recipients" placeholder="Enterprise clients" />
          <Field name="quantity" label="Quantity" type="number" placeholder="500" />
          <Field name="budgetPerGift" label="Budget per gift" type="number" placeholder="40" />
          <Field name="brandTone" label="Brand tone" placeholder="Premium, warm, modern" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="constraints">Constraints</Label>
          <Textarea id="constraints" name="constraints" placeholder="Halal, low sugar, local delivery, logo embossing..." />
        </div>
        <Button disabled={isPending} className="w-full sm:w-fit">
          <Sparkles className="size-4" />
          {isPending ? "Thinking..." : "Get AI recommendation"}
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result ? (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-lg font-semibold">{result.recommendation}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{result.budgetNotes}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <List title="Suggested products" items={result.products} />
            <List title="Next steps" items={result.nextSteps} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required />
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
