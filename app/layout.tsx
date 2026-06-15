import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "MoonGift AI | B2B Mid-Autumn Corporate Gifting",
    template: "%s | MoonGift AI"
  },
  description:
    "AI-assisted B2B Mid-Autumn gifting platform for corporate gift catalogs, quote requests, lead management, and CRM workflows.",
  openGraph: {
    title: "MoonGift AI",
    description: "Corporate Mid-Autumn gifts selected with AI and fulfilled at scale.",
    url: getSiteUrl(),
    siteName: "MoonGift AI",
    type: "website"
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
