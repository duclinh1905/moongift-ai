import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";

export type JsonLd = Record<string, unknown>;

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  authors?: string[];
};

export function absoluteUrl(path = "/") {
  const baseUrl = getSiteUrl().replace(/\/$/, "");
  return path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildSeoMetadata({ title, description, path = "/", image, type = "website", publishedTime, authors }: SeoInput): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [image] : [];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type, images, ...(publishedTime ? { publishedTime } : {}), ...(authors?.length ? { authors } : {}) },
    twitter: { card: "summary_large_image", title, description, images }
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) }))
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>): JsonLd | null {
  if (!faqs.length) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
}

export function JsonLdScript({ data }: { data: JsonLd | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
