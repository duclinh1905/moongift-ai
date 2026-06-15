import type { MetadataRoute } from "next";
import { getBlogPosts, getCaseStudies, getLandingPages, getPublishedProducts } from "@/lib/cms";
import { getSiteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [products, posts, studies, industries] = await Promise.all([getPublishedProducts(), getBlogPosts(), getCaseStudies(), getLandingPages()]);
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/catalog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/case-studies`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...posts.map((post) => ({ url: `${baseUrl}/blog/${post.slug}`, lastModified: new Date(post.published_at), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...studies.map((study) => ({ url: `${baseUrl}/case-studies/${study.slug}`, lastModified: new Date(study.published_at), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...industries.map((page) => ({ url: `${baseUrl}/industries/${page.slug}`, lastModified: new Date(page.published_at), changeFrequency: "monthly" as const, priority: 0.7 }))
  ];
}
