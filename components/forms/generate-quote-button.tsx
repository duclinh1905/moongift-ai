"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateQuoteButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generateQuote() {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/leads/${leadId}/quote`, {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to generate quote.");
        return;
      }

      router.push(`/dashboard/quotes/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <Button type="button" onClick={generateQuote} disabled={isPending}>
        <FilePlus2 className="size-4" />
        {isPending ? "Generating..." : "Generate Quote"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
