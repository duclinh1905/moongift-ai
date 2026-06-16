import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/catalog", "/products", "/collections", "/blog", "/case-studies", "/industries"], disallow: ["/dashboard", "/api"] }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
