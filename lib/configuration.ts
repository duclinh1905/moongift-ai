export const personalizationTypes = ["uv_logo_printing", "foil_stamping", "laser_engraving", "embossing", "recipient_name_printing", "qr_code_personalization"] as const;
export const packagingTypes = ["carton_box", "premium_rigid_box", "magnetic_box", "wooden_box", "paper_bag", "fabric_bag", "ribbon", "sleeve"] as const;

export type PricingInput = {
  quantity: number;
  baseUnitPrice: number;
  baseUnitCost?: number;
  packagingUnitCost?: number;
  printingUnitCost?: number;
  personalizationUnitCost?: number;
  logisticsUnitCost?: number;
  marginPercent?: number;
};

export function calculateConfiguredPricing(input: PricingInput) {
  const productRevenue = input.baseUnitPrice * input.quantity;
  const packagingCost = (input.packagingUnitCost ?? 0) * input.quantity;
  const printingCost = (input.printingUnitCost ?? 0) * input.quantity;
  const personalizationCost = (input.personalizationUnitCost ?? 0) * input.quantity;
  const logisticsCost = (input.logisticsUnitCost ?? 0) * input.quantity;
  const productCost = (input.baseUnitCost ?? input.baseUnitPrice * 0.55) * input.quantity;
  const totalCost = productCost + packagingCost + printingCost + personalizationCost + logisticsCost;
  const targetMargin = input.marginPercent ?? 0.35;
  const configuredSubtotal = Math.max(productRevenue, totalCost / (1 - targetMargin));
  const grossMargin = configuredSubtotal - totalCost;
  const grossMarginPercent = configuredSubtotal > 0 ? grossMargin / configuredSubtotal : 0;
  return { productRevenue, productCost, packagingCost, printingCost, personalizationCost, logisticsCost, totalCost, configuredSubtotal: Number(configuredSubtotal.toFixed(2)), grossMargin: Number(grossMargin.toFixed(2)), grossMarginPercent };
}

export function labelFromSlug(value: string) {
  return value.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
