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
