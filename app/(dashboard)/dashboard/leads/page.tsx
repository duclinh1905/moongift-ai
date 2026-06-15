import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, company_name, contact_name, email, phone, quantity, budget_per_gift, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Lead Management</h1>
        <p className="mt-2 text-muted-foreground">Qualify inbound quote requests and prioritize sales follow-up.</p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                {["Company", "Contact", "Email", "Phone", "Qty", "Budget", "Status"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{lead.contact_name}</td>
                  <td className="px-4 py-3">{lead.email}</td>
                  <td className="px-4 py-3">{lead.phone}</td>
                  <td className="px-4 py-3">{lead.quantity}</td>
                  <td className="px-4 py-3">${lead.budget_per_gift}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{lead.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
