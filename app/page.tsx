import Link from "next/link";
import { ArrowRight, BarChart3, Brain, ShieldCheck } from "lucide-react";
import { AdvisorForm } from "@/components/forms/advisor-form";
import { QuoteForm } from "@/components/forms/quote-form";
import { SiteHeader } from "@/components/landing/site-header";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/env";

const platformFeatures = [
  {
    title: "AI gift advisor",
    text: "Match budget, recipient type, brand tone, and fulfillment constraints.",
    Icon: Brain
  },
  {
    title: "Quote operations",
    text: "Capture buying intent and convert approved leads into managed quotes.",
    Icon: BarChart3
  },
  {
    title: "Admin CRM",
    text: "Role-protected lead and quote management for sales teams.",
    Icon: ShieldCheck
  }
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MoonGift AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    description: "B2B Mid-Autumn corporate gifting platform with AI gift advisory and CRM workflows."
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <section className="border-b bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--secondary)))]">
          <div className="container-page grid min-h-[calc(100svh-4rem)] items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Corporate Mid-Autumn gifting</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">MoonGift AI</h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
                Plan premium mooncake gift programs, qualify leads, generate AI recommendations, and manage quotes from one B2B-ready workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="#advisor">
                    Try advisor <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/catalog">View catalog</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {platformFeatures.map(({ title, text, Icon }) => (
                <div key={title} className="rounded-lg border bg-card p-5 shadow-sm">
                  <Icon className="size-5 text-primary" />
                  <h2 className="mt-4 font-semibold">{title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Product Catalog</h2>
              <p className="mt-2 text-muted-foreground">Curated B2B Mid-Autumn sets for employees, partners, and VIP clients.</p>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/catalog">All products</Link>
            </Button>
          </div>
          <ProductGrid />
        </section>

        <section id="advisor" className="border-y bg-muted/50 py-14">
          <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold">AI Gift Advisor</h2>
              <p className="mt-2 text-muted-foreground">Generate practical gift recommendations grounded in your budget, audience, and delivery constraints.</p>
            </div>
            <AdvisorForm />
          </div>
        </section>

        <section id="quote" className="container-page py-14">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold">Request a Quote</h2>
              <p className="mt-2 text-muted-foreground">Send buying details to the CRM and let the sales team qualify the opportunity.</p>
            </div>
            <QuoteForm />
          </div>
        </section>
      </main>
    </>
  );
}
