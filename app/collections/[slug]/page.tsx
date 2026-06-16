import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollection, getCollections, getPublishedProducts } from "@/lib/cms";
import { buildSeoMetadata, JsonLdScript, breadcrumbJsonLd } from "@/lib/seo";
import { currency } from "@/lib/utils";

export async function generateStaticParams() { return (await getCollections()).map((collection) => ({ slug: collection.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const collection = await getCollection((await params).slug); if (!collection) return {}; return buildSeoMetadata({ title: collection.seo_title ?? collection.title, description: collection.seo_description ?? collection.description, path: `/collections/${collection.slug}`, image: collection.featured_image_url }); }
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) { const collection = await getCollection((await params).slug); if (!collection) notFound(); const products = (await getPublishedProducts()).slice(0, 6); return <><SiteHeader /><main className="container-page py-12"><JsonLdScript data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: collection.title, path: `/collections/${collection.slug}` }])} /><section className="max-w-3xl"><p className="text-sm font-semibold uppercase text-primary">Gift collection</p><h1 className="mt-3 text-5xl font-bold">{collection.title}</h1><p className="mt-5 text-lg text-muted-foreground">{collection.description}</p><Button asChild size="lg" className="mt-8"><Link href="/#quote">Request collection quote</Link></Button></section><section className="mt-12"><h2 className="text-2xl font-bold">Recommended products</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{products.map((product) => <Card key={product.id}><CardHeader><CardTitle>{product.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{product.description}</p><div className="mt-4 font-semibold">From {currency(product.price_from)}</div><Button asChild variant="outline" className="mt-4"><Link href={`/products/${product.slug}`}>View product</Link></Button></CardContent></Card>)}</div></section></main></>; }
