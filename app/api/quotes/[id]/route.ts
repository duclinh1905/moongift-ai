import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createAdminClient } from "@/lib/supabase/admin";

const quoteUpdateSchema = z.object({
  status: z.enum(["draft", "sent", "accepted", "rejected"])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (admin.status !== 200) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Authentication required." : "Admin access required." },
      { status: admin.status }
    );
  }

  const { id } = await params;
  const parsed = quoteUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote status." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Unable to update quote." }, { status: 500 });
  }

  await logActivity({
    actorId: admin.user.id,
    action: "quote.status_updated",
    entityType: "quote",
    entityId: id,
    metadata: { status: parsed.data.status }
  });

  return NextResponse.json({ ok: true });
}
