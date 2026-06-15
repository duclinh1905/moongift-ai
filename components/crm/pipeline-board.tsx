"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { leadStatusLabels, leadStatuses, type LeadStatus } from "@/lib/crm";

type PipelineLead = {
  id: string;
  company_name: string;
  contact_name: string;
  quantity: number | string;
  budget_per_gift: number | string;
  status: LeadStatus;
  created_at: string;
};

function dealValue(lead: PipelineLead) {
  return Number(lead.quantity ?? 0) * Number(lead.budget_per_gift ?? 0);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function PipelineBoard({ leads }: { leads: PipelineLead[] }) {
  const [cards, setCards] = useState(leads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function moveLead(leadId: string, status: LeadStatus) {
    const previous = cards;
    setCards((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const result = await response.json();
        setCards(previous);
        setMessage(result.error ?? "Unable to move lead.");
        return;
      }
      setMessage(`Moved lead to ${leadStatusLabels[status]}.`);
    });
  }

  return (
    <div className="grid gap-4">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <div className="grid gap-4 xl:grid-cols-7">
        {leadStatuses.map((status) => {
          const columnLeads = cards.filter((lead) => lead.status === status);
          const columnValue = columnLeads.reduce((sum, lead) => sum + dealValue(lead), 0);
          return (
            <section
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const leadId = event.dataTransfer.getData("text/lead-id") || draggedId;
                if (leadId) moveLead(leadId, status);
                setDraggedId(null);
              }}
              className="grid min-h-48 content-start gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div className="rounded-md border bg-card px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{leadStatusLabels[status]}</h2>
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">{columnLeads.length}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{money(columnValue)}</div>
              </div>
              {columnLeads.map((lead) => (
                <article
                  key={lead.id}
                  draggable={!isPending}
                  onDragStart={(event) => {
                    setDraggedId(lead.id);
                    event.dataTransfer.setData("text/lead-id", lead.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
                >
                  <Link href={`/dashboard/leads/${lead.id}`} className="font-semibold hover:underline">
                    {lead.company_name}
                  </Link>
                  <div className="mt-2 text-muted-foreground">
                    <div>{lead.contact_name}</div>
                    <div>{lead.quantity} gifts × ${lead.budget_per_gift}</div>
                    <div className="font-medium text-foreground">{money(dealValue(lead))}</div>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
