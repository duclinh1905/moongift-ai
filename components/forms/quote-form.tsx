"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QuoteForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    const turnstile = window.turnstile;
    if (turnstileSiteKey && turnstile) {
      payload.captchaToken = turnstile.getResponse();
    }

    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setMessage(response.ok ? "Quote request received. Our team will respond within one business day." : result.error);
      if (response.ok) {
        form.reset();
        window.turnstile?.reset();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="companyName" label="Company" placeholder="Acme Group" />
        <Field name="contactName" label="Contact name" placeholder="Linh Nguyen" />
        <Field name="email" label="Work email" type="email" placeholder="linh@company.com" />
        <Field name="phone" label="Phone" placeholder="+84..." />
        <Field name="quantity" label="Quantity" type="number" placeholder="300" />
        <Field name="budgetPerGift" label="Budget per gift" type="number" placeholder="45" />
        <Field name="deliveryDate" label="Delivery date" type="date" />
        <Field name="audience" label="Audience" placeholder="VIP clients, employees..." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Notes</Label>
        <Textarea id="message" name="message" placeholder="Branding, dietary preferences, shipping regions, packaging needs..." />
      </div>
      {turnstileSiteKey ? (
        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
      ) : null}
      {turnstileSiteKey ? <TurnstileScript /> : null}
      <Button disabled={isPending} className="w-full sm:w-fit">
        <Send className="size-4" />
        {isPending ? "Sending..." : "Request quote"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required />
    </div>
  );
}


declare global {
  interface Window {
    turnstile?: {
      getResponse: () => string;
      reset: () => void;
    };
  }
}

function TurnstileScript() {
  return <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />;
}
