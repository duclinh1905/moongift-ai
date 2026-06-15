import Link from "next/link";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Moon className="size-5 text-primary" />
          MoonGift AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/catalog">Catalog</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/case-studies">Case Studies</Link>
          <Link href="/industries">Industries</Link>
          <Link href="/#advisor">AI Advisor</Link>
          <Link href="/#quote">Quote</Link>
          <Link href="/dashboard">CRM</Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/#quote">Request quote</Link>
        </Button>
      </div>
    </header>
  );
}
