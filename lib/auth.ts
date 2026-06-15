import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfileRole(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const role = await getProfileRole(user.id);

  if (role !== "admin") {
    redirect("/");
  }
  return user;
}

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, status: 401 as const };
  }

  const role = await getProfileRole(user.id);
  if (role !== "admin") {
    return { user: null, status: 403 as const };
  }

  return { user, status: 200 as const };
}
