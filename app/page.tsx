import Link from "next/link";
import { ArrowRight, Brain, ShieldCheck, Sparkles } from "lucide-react";
import { AdvisorForm } from "@/components/forms/advisor-form";
import { QuoteForm } from "@/components/forms/quote-form";
import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBanners, getBlogPosts, getCaseStudies, getCollections, getLandingPages, getPublishedProducts } from "@/lib/cms";
import { getSiteUrl, getTurnstileSiteKey } from "@/lib/env";
import { currency } from "@/lib/utils";

const testimonials = [
  { quote: "MoonGift helped our sales team turn seasonal gifting into a measurable pipeline motion.", name: "VP Sales, Banking" },
  { quote: "The quoting workflow made it easy to align procurement, branding, and delivery timelines.", name: "People Ops Lead, Technology" }
];

export default async function HomePage() {
  const [products, caseStudies, blogPosts, landingPages, collections, banners] = await Promise.all([getPublishedProducts(), getCaseStudies(), getBlogPosts(), getLandingPages(), getCollections(), getBanners()]);
  const heroBanner = banners[0];
  const jsonLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "MoonGift AI", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: getSiteUrl(), description: "B2B Mid-Autumn corporate gifting platform with AI gift advisory, CMS growth pages, and CRM workflows." };
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <section className="border-b bg-[radial-gradient(circle_at_top_left,hsl(var(--secondary)),transparent_35%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]">
          <div className="container-page grid min-h-[calc(100svh-4rem)] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary">Premium B2B Mid-Autumn gifting</p>
              <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-tight sm:text-7xl">{heroBanner?.title ?? "Turn corporate gifting into a growth channel."}</h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{heroBanner?.body ?? "MoonGift combines curated gift collections, SEO landing pages, AI recommendations, and sales CRM workflows for high-value seasonal gifting programs."}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link href={heroBanner?.cta_href ?? "#quote"}>{heroBanner?.cta_label ?? "Request quote"} <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" size="lg"><Link href="/collections">Explore collections</Link></Button></div>
            </div>
            <div className="grid gap-4">
              {[{ title: "AI gift advisor", text: "Match budget, recipient type, brand tone, and fulfillment constraints.", Icon: Brain }, { title: "SEO growth CMS", text: "Publish product, blog, case study, and industry pages built for organic demand.", Icon: Sparkles }, { title: "Admin CRM", text: "Track pipeline, quotes, revenue, activity, and customer follow-up.", Icon: ShieldCheck }].map(({ title, text, Icon }) => <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm"><Icon className="size-5 text-primary" /><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>)}
            </div>
          </div>
        </section>
        <section className="container-page py-14"><div className="mb-6 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Featured Collections</h2><p className="mt-2 text-muted-foreground">Curated gift collections managed from the CMS for employees, partners, and VIP clients.</p></div><Button asChild variant="outline"><Link href="/collections">All collections</Link></Button></div><div className="grid gap-4 md:grid-cols-2">{collections.slice(0, 2).map((collection) => <Card key={collection.id}><CardHeader><CardTitle>{collection.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{collection.description}</p><Button asChild variant="outline" className="mt-4"><Link href={`/collections/${collection.slug}`}>View collection</Link></Button></CardContent></Card>)}</div><div className="mt-8 grid gap-4 md:grid-cols-4">{products.slice(0, 4).map((product) => <Card key={product.id}><CardHeader><CardTitle>{product.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{product.description}</p><div className="mt-4 font-semibold">From {currency(product.price_from)}</div><Button asChild variant="outline" className="mt-4"><Link href={`/products/${product.slug}`}>View product</Link></Button></CardContent></Card>)}</div></section>
        <section className="border-y bg-muted/50 py-14"><div className="container-page"><h2 className="text-2xl font-bold">Industry Landing Pages</h2><div className="mt-6 grid gap-3 md:grid-cols-3">{landingPages.slice(0, 6).map((page) => <Link key={page.slug} href={`/industries/${page.slug}`} className="rounded-lg border bg-card p-4 font-medium hover:border-primary">{page.title}</Link>)}</div></div></section>
        <section className="container-page grid gap-8 py-14 lg:grid-cols-2"><div><h2 className="text-2xl font-bold">Customer Proof</h2><div className="mt-6 grid gap-4">{caseStudies.slice(0, 2).map((study) => <Card key={study.id}><CardHeader><CardTitle>{study.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{study.results}</p><Button asChild variant="outline" className="mt-4"><Link href={`/case-studies/${study.slug}`}>Read case study</Link></Button></CardContent></Card>)}</div></div><div><h2 className="text-2xl font-bold">Testimonials</h2><div className="mt-6 grid gap-4">{testimonials.map((item) => <blockquote key={item.name} className="rounded-lg border bg-card p-5"><p className="text-muted-foreground">“{item.quote}”</p><footer className="mt-3 font-semibold">{item.name}</footer></blockquote>)}</div></div></section>
        <section id="advisor" className="border-y bg-muted/50 py-14"><div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><h2 className="text-2xl font-bold">AI Gift Advisor</h2><p className="mt-2 text-muted-foreground">Generate practical recommendations grounded in your budget, audience, and constraints.</p></div><AdvisorForm /></div></section>
        <section id="quote" className="container-page py-14"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><h2 className="text-2xl font-bold">Request a Quote</h2><p className="mt-2 text-muted-foreground">Send buying details to the CRM and let the sales team qualify the opportunity.</p></div><QuoteForm turnstileSiteKey={getTurnstileSiteKey()} /></div></section>
        <section className="container-page pb-14"><h2 className="text-2xl font-bold">Latest Insights</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{blogPosts.slice(0, 3).map((post) => <Card key={post.id}><CardHeader><CardTitle><Link href={`/blog/${post.slug}`}>{post.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{post.excerpt}</p></CardContent></Card>)}</div></section>
      </main>
    </>
  );
}
