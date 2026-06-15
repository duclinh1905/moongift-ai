import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/landing/site-header";
import { getLandingPages } from "@/lib/cms";

export default async function IndustriesPage() { const pages = await getLandingPages(); return <><SiteHeader /><main className="container-page py-12"><h1 className="text-3xl font-bold">Industry Gifting Programs</h1><p className="mt-3 text-muted-foreground">SEO landing pages for high-intent B2B verticals.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{pages.map((page) => <Card key={page.id}><CardHeader><CardTitle><Link href={`/industries/${page.slug}`}>{page.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{page.hero}</p></CardContent></Card>)}</div></main></>; }
