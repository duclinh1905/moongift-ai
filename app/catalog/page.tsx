import type { Metadata } from "next";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "Corporate Gift Catalog",
  description: "Browse Mid-Autumn B2B gift sets by budget, audience, minimum quantity, and lead time."
};

export default function CatalogPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-12">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold">Corporate Gift Catalog</h1>
          <p className="mt-3 text-muted-foreground">
            Production-ready B2B gifting options for scalable Mid-Autumn programs.
          </p>
        </div>
        <ProductGrid />
      </main>
    </>
  );
}
