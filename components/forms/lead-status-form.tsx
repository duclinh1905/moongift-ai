"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { leadStatusLabels, leadStatuses } from "@/lib/crm";

export function LeadStatusForm({
  leadId,
  currentStatus
}: {
  leadId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Unable to update lead status.");
        return;
      }

      setMessage("Lead status updated.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="grid gap-2 text-sm font-medium">
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          {leadStatuses.map((option) => (
            <option key={leadStatusLabels[option]} value={leadStatusLabels[option]}>
              {leadStatusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update status"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
