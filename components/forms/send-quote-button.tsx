"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SendQuoteButton({ quoteId, defaultEmail }: { quoteId: string; defaultEmail?: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function sendQuote() {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: defaultEmail ?? undefined })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Unable to send quote.");
        return;
      }

      setMessage("Quote PDF generated, stored, and sent.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <Button type="button" onClick={sendQuote} disabled={isPending}>
        <Mail className="size-4" />
        {isPending ? "Sending..." : "Send Quote"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
