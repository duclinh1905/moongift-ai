import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPosts } from "@/lib/cms";
import { buildSeoMetadata } from "@/lib/seo";

function label(value: string) { return decodeURIComponent(value).replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
export async function generateStaticParams() { const posts = await getBlogPosts(); return [...new Set(posts.map((post) => post.category.toLowerCase().replace(/\s+/g, "-")))].map((category) => ({ category })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> { const category = label((await params).category); return buildSeoMetadata({ title: `${category} Corporate Gifting Articles | MoonGift AI`, description: `Read ${category.toLowerCase()} articles for B2B Mid-Autumn corporate gifting programs.`, path: `/blog/category/${(await params).category}` }); }
export default async function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) { const categorySlug = (await params).category; const posts = (await getBlogPosts()).filter((post) => post.category.toLowerCase().replace(/\s+/g, "-") === categorySlug); return <><SiteHeader /><main className="container-page py-12"><h1 className="text-3xl font-bold">{label(categorySlug)} Articles</h1><div className="mt-8 grid gap-4 md:grid-cols-2">{posts.map((post) => <Card key={post.id}><CardHeader><CardTitle><Link href={`/blog/${post.slug}`}>{post.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{post.excerpt}</p></CardContent></Card>)}</div></main></>; }
