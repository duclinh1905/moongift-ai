export const crmRoles = ["admin", "manager", "sales", "viewer"] as const;
export type CrmRole = (typeof crmRoles)[number];

export const writableCrmRoles = ["admin", "manager", "sales"] as const;
export type WritableCrmRole = (typeof writableCrmRoles)[number];

export function isCrmRole(role: string | null | undefined): role is CrmRole {
  return crmRoles.includes(role as CrmRole);
}

export function canWriteCrm(role: string | null | undefined): role is WritableCrmRole {
  return writableCrmRoles.includes(role as WritableCrmRole);
}
