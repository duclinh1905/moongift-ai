export const cmsTypes = ["categories", "collections", "products", "blog_posts", "case_studies", "banners", "landing_pages", "product_variants", "personalization_options", "packaging_options", "pricing_rules"] as const;
export type CmsType = (typeof cmsTypes)[number];

export function isCmsType(type: string): type is CmsType {
  return cmsTypes.includes(type as CmsType);
}

export const cmsLabels: Record<CmsType, string> = {
  categories: "Categories",
  collections: "Collections",
  products: "Products",
  blog_posts: "Blog Posts",
  case_studies: "Case Studies",
  banners: "Banners",
  landing_pages: "Landing Pages",
  product_variants: "Product Variants",
  personalization_options: "Personalization",
  packaging_options: "Packaging",
  pricing_rules: "Pricing Rules"
};
