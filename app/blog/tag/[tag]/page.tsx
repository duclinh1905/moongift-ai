import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/landing/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPosts } from "@/lib/cms";
import { buildSeoMetadata } from "@/lib/seo";

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function label(value: string) { return decodeURIComponent(value).replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
export async function generateStaticParams() { const posts = await getBlogPosts(); return [...new Set(posts.flatMap((post) => post.tags.map(slugify)))].map((tag) => ({ tag })); }
export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> { const tag = (await params).tag; return buildSeoMetadata({ title: `${label(tag)} Corporate Gifting Topics | MoonGift AI`, description: `Explore MoonGift AI articles tagged ${label(tag)}.`, path: `/blog/tag/${tag}` }); }
export default async function BlogTagPage({ params }: { params: Promise<{ tag: string }> }) { const tag = (await params).tag; const posts = (await getBlogPosts()).filter((post) => post.tags.some((item) => slugify(item) === tag)); return <><SiteHeader /><main className="container-page py-12"><h1 className="text-3xl font-bold">{label(tag)} Topics</h1><div className="mt-8 grid gap-4 md:grid-cols-2">{posts.map((post) => <Card key={post.id}><CardHeader><CardTitle><Link href={`/blog/${post.slug}`}>{post.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{post.excerpt}</p></CardContent></Card>)}</div></main></>; }
