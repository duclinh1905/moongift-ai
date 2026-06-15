import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/landing/site-header";
import { getBlogPosts } from "@/lib/cms";

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <><SiteHeader /><main className="container-page py-12"><h1 className="text-3xl font-bold">Corporate Gifting Insights</h1><p className="mt-3 text-muted-foreground">SEO-focused guides for B2B gift planning.</p><div className="mt-8 grid gap-4 md:grid-cols-2">{posts.map((post) => <Card key={post.id}><CardHeader><CardTitle><Link href={`/blog/${post.slug}`}>{post.title}</Link></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{post.excerpt}</p><div className="mt-3 text-xs text-muted-foreground">{post.category} • {post.author}</div></CardContent></Card>)}</div></main></>;
}
