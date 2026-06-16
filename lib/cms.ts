import { createClient } from "@/lib/supabase/server";
import { products as legacyProducts } from "@/lib/products";

export type CmsStatus = "draft" | "published";

export type CmsProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price_from: number;
  min_quantity: number;
  lead_time_days: number;
  tags: string[];
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured_image_url?: string | null;
  author: string;
  published_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type CaseStudy = {
  id: string;
  slug: string;
  title: string;
  customer: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  featured_image_url?: string | null;
  published_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type Category = { id: string; slug: string; name: string; description?: string | null; seo_title?: string | null; seo_description?: string | null; published_at?: string | null };

export type Collection = { id: string; slug: string; title: string; description: string; featured_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; published_at?: string | null };

export type Banner = { id: string; slug: string; title: string; body: string; cta_label?: string | null; cta_href?: string | null; image_url?: string | null; placement?: string | null; published_at?: string | null };

export type LandingPage = {
  id: string;
  slug: string;
  title: string;
  industry: string;
  hero: string;
  body: string;
  faqs: Array<{ question: string; answer: string }>;
  seo_title?: string | null;
  seo_description?: string | null;
  published_at: string;
};

export const fallbackProducts: CmsProduct[] = legacyProducts.map((product) => ({
  id: product.id,
  slug: product.id,
  name: product.name,
  category: product.category,
  description: product.description,
  price_from: product.priceFrom,
  min_quantity: product.minQuantity,
  lead_time_days: product.leadTimeDays,
  tags: product.tags,
  image_url: null,
  seo_title: `${product.name} | Corporate Mooncake Gifts`,
  seo_description: product.description
}));

export const fallbackBlogPosts: BlogPost[] = [
  {
    id: "mid-autumn-corporate-gifting-guide",
    slug: "mid-autumn-corporate-gifting-guide",
    title: "The B2B Mid-Autumn Corporate Gifting Guide",
    excerpt: "How procurement, HR, and sales teams can plan premium mooncake gifting programs with predictable budgets and timelines.",
    content: "Plan early, segment recipients by business value, confirm dietary requirements, and reserve production capacity before peak season. Use branded packaging for VIP accounts and scalable wellness sets for employee recognition.",
    category: "Guides",
    tags: ["Mid-Autumn", "Corporate gifting", "Procurement"],
    author: "MoonGift Editorial Team",
    published_at: "2026-06-01T00:00:00.000Z",
    seo_title: "B2B Mid-Autumn Corporate Gifting Guide",
    seo_description: "A practical guide for planning premium Mid-Autumn corporate gifting programs."
  }
];

export const fallbackCaseStudies: CaseStudy[] = [
  {
    id: "banking-vip-client-gifting",
    slug: "banking-vip-client-gifting",
    title: "How a Banking Team Delivered 1,200 VIP Gift Sets",
    customer: "Regional Banking Group",
    industry: "Banking",
    challenge: "The team needed tiered gifts for relationship managers without losing brand consistency.",
    solution: "MoonGift created executive, partner, and employee tiers with shared brand guidelines and delivery tracking.",
    results: "1,200 gifts delivered across three regions with 98% on-time delivery and faster sales follow-up.",
    published_at: "2026-06-02T00:00:00.000Z",
    seo_title: "Banking VIP Client Gifting Case Study",
    seo_description: "A Mid-Autumn corporate gifting case study for banking relationship teams."
  }
];

export const fallbackCategories: Category[] = [
  { id: "premium", slug: "premium", name: "Premium Mooncake Gifts", description: "Executive-ready gift sets for high-value business relationships.", seo_title: "Premium Corporate Mooncake Gifts", seo_description: "Premium B2B mooncake gifts for client and employee programs." },
  { id: "wellness", slug: "wellness", name: "Wellness Gifts", description: "Balanced gift sets for employee appreciation and culture programs.", seo_title: "Corporate Wellness Gifts", seo_description: "Wellness-led corporate gifting collections for teams." }
];

export const fallbackCollections: Collection[] = [
  { id: "vip-client-gifts", slug: "vip-client-gifts", title: "VIP Client Gifts", description: "Premium mooncake and tea sets designed for executive relationships.", seo_title: "VIP Client Corporate Gifts", seo_description: "High-touch Mid-Autumn gift collections for VIP clients." },
  { id: "employee-appreciation", slug: "employee-appreciation", title: "Employee Appreciation", description: "Scalable branded gifting programs for distributed teams.", seo_title: "Employee Appreciation Gift Collections", seo_description: "Branded employee gifting collections for Mid-Autumn programs." }
];

export const fallbackBanners: Banner[] = [
  { id: "homepage-hero", slug: "homepage-hero", title: "Plan premium Mid-Autumn gifting with confidence", body: "Launch SEO-backed landing pages, collect qualified quote requests, and move every opportunity into a measurable CRM workflow.", cta_label: "Request quote", cta_href: "/#quote", placement: "homepage" }
];

export const industryPages: LandingPage[] = ["banking", "insurance", "logistics", "manufacturing", "real-estate", "technology"].map((slug) => ({
  id: slug,
  slug,
  industry: slug.replace(/-/g, " "),
  title: `Corporate Gifting for ${slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}`,
  hero: "Premium Mid-Autumn gifting programs for complex B2B teams.",
  body: "Use MoonGift AI to plan recipient tiers, forecast budgets, coordinate quotes, and deliver premium branded gifting programs at scale.",
  faqs: [
    { question: "Can we create multiple recipient tiers?", answer: "Yes. MoonGift supports executive, partner, employee, and team gifting tiers." },
    { question: "Can sales teams track quote progress?", answer: "Yes. The CRM pipeline tracks every lead, quote, and sent proposal." }
  ],
  published_at: "2026-06-01T00:00:00.000Z",
  seo_title: `Corporate Gifting for ${slug}`,
  seo_description: `Mid-Autumn gifting workflows for ${slug} teams.`
}));

async function safeSelect<T>(table: string, fallback: T[], orderColumn = "published_at") {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select("*").eq("status", "published").order(orderColumn, { ascending: false });
    if (error || !data?.length) return fallback;
    return data as T[];
  } catch {
    return fallback;
  }
}

export async function getCategories() {
  return safeSelect<Category>("categories", fallbackCategories);
}

export async function getCollections() {
  return safeSelect<Collection>("collections", fallbackCollections);
}

export async function getCollection(slug: string) {
  return (await getCollections()).find((collection) => collection.slug === slug) ?? null;
}

export async function getBanners(placement = "homepage") {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("banners").select("*").eq("status", "published").eq("placement", placement).order("published_at", { ascending: false });
    if (error || !data?.length) return fallbackBanners.filter((banner) => (banner.placement ?? "homepage") === placement);
    return data as Banner[];
  } catch {
    return fallbackBanners.filter((banner) => (banner.placement ?? "homepage") === placement);
  }
}

export async function getPublishedProducts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("name", { ascending: true });
    if (error || !data?.length) return fallbackProducts;
    return data as CmsProduct[];
  } catch {
    return fallbackProducts;
  }
}

export async function getProduct(slug: string) {
  const products = await getPublishedProducts();
  return products.find((product) => product.slug === slug || product.id === slug) ?? null;
}

export async function getBlogPosts() {
  return safeSelect<BlogPost>("blog_posts", fallbackBlogPosts);
}

export async function getBlogPost(slug: string) {
  return (await getBlogPosts()).find((post) => post.slug === slug) ?? null;
}

export async function getCaseStudies() {
  return safeSelect<CaseStudy>("case_studies", fallbackCaseStudies);
}

export async function getCaseStudy(slug: string) {
  return (await getCaseStudies()).find((study) => study.slug === slug) ?? null;
}

export async function getLandingPages() {
  return safeSelect<LandingPage>("landing_pages", industryPages);
}

export async function getLandingPage(slug: string) {
  return (await getLandingPages()).find((page) => page.slug === slug) ?? industryPages.find((page) => page.slug === slug) ?? null;
}
