export const approvalStatuses = ["draft", "pending_approval", "approved", "rejected", "revision_requested"] as const;
export const productionStatuses = ["waiting_production", "printing", "packaging", "quality_control", "ready_shipment", "completed"] as const;
export const deliveryStatuses = ["pending", "label_created", "in_transit", "delivered", "failed", "returned"] as const;
export const supplierTypes = ["printing", "packaging", "logistics"] as const;

export type ApprovalStatus = (typeof approvalStatuses)[number];
export type ProductionStatus = (typeof productionStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export type SupplierType = (typeof supplierTypes)[number];

export function humanizeStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
