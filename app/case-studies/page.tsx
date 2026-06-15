import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/landing/site-header";
import { getCaseStudies } from "@/lib/cms";

export default async function CaseStudiesPage() {
  const studies = await getCaseStudies();
  return <><SiteHeader /><main className="container-page py-12"><h1 className="text-3xl font-bold">Customer Case Studies</h1><p className="mt-3 text-muted-foreground">See how B2B teams run premium gifting programs with MoonGift.</p><div className="mt-8 grid gap-4 md:grid-cols-2">{studies.map((study) => <Card key={study.id}><CardHeader><CardTitle><Link href={`/case-studies/${study.slug}`}>{study.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{study.customer} • {study.industry}</p><p className="mt-3 text-sm">{study.results}</p></CardContent></Card>)}</div></main></>;
}
