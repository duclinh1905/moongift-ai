import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollections } from "@/lib/cms";
import { buildSeoMetadata, JsonLdScript, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({ title: "Corporate Gift Collections | MoonGift AI", description: "Browse curated corporate gifting collections for VIP clients, employees, partners, and industry-specific Mid-Autumn programs.", path: "/collections" });

export default async function CollectionsPage() {
  const collections = await getCollections();
  return <><SiteHeader /><main className="container-page py-12"><JsonLdScript data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }])} /><h1 className="text-3xl font-bold">Corporate Gift Collections</h1><p className="mt-3 text-muted-foreground">Curated collection pages managed from the CMS for SEO growth and campaign launches.</p><div className="mt-8 grid gap-4 md:grid-cols-2">{collections.map((collection) => <Card key={collection.id}><CardHeader><CardTitle><Link href={`/collections/${collection.slug}`}>{collection.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{collection.description}</p></CardContent></Card>)}</div></main></>;
}
