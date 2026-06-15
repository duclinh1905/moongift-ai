import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canWriteCrm, isCrmRole, type CrmRole, type WritableCrmRole } from "@/lib/roles";

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

export async function requireRole(allowedRoles: readonly CrmRole[]) {
  const user = await requireUser();
  const role = await getProfileRole(user.id);

  if (!isCrmRole(role) || !allowedRoles.includes(role)) {
    redirect("/");
  }
  return { user, role };
}

export async function requireAdmin() {
  const { user } = await requireRole(["admin"]);
  return user;
}

export async function requireStaff() {
  return requireRole(["admin", "manager", "sales", "viewer"]);
}

export async function getRoleUser(allowedRoles: readonly (CrmRole | WritableCrmRole)[]) {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, role: null, status: 401 as const };
  }

  const role = await getProfileRole(user.id);
  if (!isCrmRole(role) || !allowedRoles.includes(role)) {
    return { user: null, role: null, status: 403 as const };
  }

  return { user, role, status: 200 as const };
}

export async function getAdminUser() {
  return getRoleUser(["admin"]);
}

export async function getWritableCrmUser() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, role: null, status: 401 as const };
  }

  const role = await getProfileRole(user.id);
  if (!canWriteCrm(role)) {
    return { user: null, role: null, status: 403 as const };
  }

  return { user, role, status: 200 as const };
}
