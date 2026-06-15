import { CmsManager } from "@/components/crm/cms-manager";
import { cmsTypes, type CmsType } from "@/lib/cms-admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const supabase = await createClient();
  const entries = await Promise.all(cmsTypes.map(async (type) => {
    const { data } = await supabase.from(type).select("*").order("created_at", { ascending: false }).limit(50);
    return [type, data ?? []] as const;
  }));
  const initialData = Object.fromEntries(entries) as Record<CmsType, Array<Record<string, unknown> & { id: string }>>;
  return <div className="grid gap-6"><div><h1 className="text-3xl font-bold">CMS Admin</h1><p className="mt-2 text-muted-foreground">Create, edit, delete, draft, and publish SEO content across products, blogs, case studies, landing pages, banners, collections, and categories.</p></div><CmsManager initialData={initialData} /></div>;
}
