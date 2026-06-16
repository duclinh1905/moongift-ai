import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProduct, getPublishedProducts } from "@/lib/cms";
import { getSiteUrl } from "@/lib/env";
import { currency } from "@/lib/utils";

export async function generateStaticParams() {
  return (await getPublishedProducts()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const url = `${getSiteUrl()}/products/${product.slug}`;
  const title = product.seo_title ?? product.name;
  const description = product.seo_description ?? product.description;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", images: product.image_url ? [product.image_url] : [] }, twitter: { card: "summary_large_image", title, description } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = (await getPublishedProducts()).filter((item) => item.slug !== product.slug).slice(0, 3);
  const url = `${getSiteUrl()}/products/${product.slug}`;
  const productJsonLd = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, url, brand: "MoonGift AI", offers: { "@type": "Offer", priceCurrency: "USD", price: product.price_from, availability: "https://schema.org/InStock" } };
  const breadcrumbJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl() }, { "@type": "ListItem", position: 2, name: "Products", item: `${getSiteUrl()}/catalog` }, { "@type": "ListItem", position: 3, name: product.name, item: url }] };
  return (
    <main className="container-page grid gap-10 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Link href="/catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground">Back to catalog</Link>
          <h1 className="mt-4 text-4xl font-bold">{product.name}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{product.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="From" value={currency(product.price_from)} />
            <Metric label="MOQ" value={`${product.min_quantity}+`} />
            <Metric label="Lead time" value={`${product.lead_time_days} days`} />
          </div>
          <Button asChild size="lg" className="mt-8"><Link href="/#quote">Request a quote</Link></Button>
        </div>
        <div className="rounded-3xl border bg-muted p-8"><div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))]" /></div>
      </section>
      <section>
        <h2 className="text-2xl font-bold">Related products</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">{related.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.description}</p><Button asChild variant="outline" className="mt-4"><Link href={`/products/${item.slug}`}>View details</Link></Button></CardContent></Card>)}</div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-card p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>; }
