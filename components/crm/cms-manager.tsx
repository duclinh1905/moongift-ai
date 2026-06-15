"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cmsLabels, cmsTypes, type CmsType } from "@/lib/cms-admin";

type CmsRow = Record<string, unknown> & { id: string; title?: string; name?: string; slug?: string; status?: string };

type CmsData = Record<CmsType, CmsRow[]>;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function defaultPayload(type: CmsType, formData: FormData) {
  const title = String(formData.get("title") || formData.get("name") || "Untitled");
  const slug = slugify(String(formData.get("slug") || title));
  const status = String(formData.get("status") || "draft");
  const seo_title = String(formData.get("seo_title") || title);
  const seo_description = String(formData.get("seo_description") || formData.get("description") || "");
  const featured_image_url = String(formData.get("featured_image_url") || "") || null;

  if (type === "products") {
    return { slug, name: title, category: String(formData.get("category") || "premium"), description: String(formData.get("description") || ""), price_from: Number(formData.get("price_from") || 0), min_quantity: Number(formData.get("min_quantity") || 20), lead_time_days: Number(formData.get("lead_time_days") || 10), tags: String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean), is_active: status === "published", status, seo_title, seo_description, image_url: featured_image_url };
  }
  if (type === "blog_posts") {
    return { slug, title, excerpt: String(formData.get("excerpt") || seo_description), content: String(formData.get("content") || ""), category: String(formData.get("category") || "Guides"), tags: String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean), author: String(formData.get("author") || "MoonGift Editorial Team"), featured_image_url, status, seo_title, seo_description };
  }
  if (type === "case_studies") {
    return { slug, title, customer: String(formData.get("customer") || "Customer"), industry: String(formData.get("industry") || "B2B"), challenge: String(formData.get("challenge") || ""), solution: String(formData.get("solution") || ""), results: String(formData.get("results") || ""), featured_image_url, status, seo_title, seo_description };
  }
  if (type === "landing_pages") {
    return { slug, title, industry: String(formData.get("industry") || title), hero: String(formData.get("excerpt") || ""), body: String(formData.get("content") || ""), faqs: [], featured_image_url, status, seo_title, seo_description };
  }
  if (type === "personalization_options") {
    return { slug, name: title, option_type: String(formData.get("category") || "uv_logo_printing"), description: String(formData.get("description") || ""), unit_cost: Number(formData.get("unit_cost") || 0), unit_price: Number(formData.get("unit_price") || 0), setup_fee: Number(formData.get("setup_fee") || 0), status, seo_title, seo_description };
  }
  if (type === "packaging_options") {
    return { slug, name: title, packaging_type: String(formData.get("category") || "carton_box"), description: String(formData.get("description") || ""), unit_cost: Number(formData.get("unit_cost") || 0), unit_price: Number(formData.get("unit_price") || 0), status, seo_title, seo_description };
  }
  if (type === "pricing_rules") {
    return { slug, name: title, rule_type: String(formData.get("category") || "margin"), conditions: {}, margin_percent: Number(formData.get("margin_percent") || 0.35), logistics_unit_cost: Number(formData.get("logistics_unit_cost") || 0), status };
  }
  if (type === "product_variants") {
    return { sku: slug, name: title, product_id: String(formData.get("product_id") || "00000000-0000-0000-0000-000000000000"), attributes: {}, unit_cost: Number(formData.get("unit_cost") || 0), unit_price: Number(formData.get("unit_price") || 0), status };
  }
  if (type === "banners") {
    return { slug, title, body: String(formData.get("content") || ""), cta_label: String(formData.get("cta_label") || "Request quote"), cta_href: String(formData.get("cta_href") || "/#quote"), image_url: featured_image_url, status };
  }
  return { slug, title, name: title, description: String(formData.get("description") || ""), featured_image_url, status, seo_title, seo_description };
}

export function CmsManager({ initialData }: { initialData: CmsData }) {
  const [activeType, setActiveType] = useState<CmsType>("blog_posts");
  const [data, setData] = useState(initialData);
  const [editing, setEditing] = useState<CmsRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rows = data[activeType] ?? [];

  function submit(formData: FormData) {
    const payload = defaultPayload(activeType, formData);
    const url = editing ? `/api/cms/${activeType}/${editing.id}` : `/api/cms/${activeType}`;
    const method = editing ? "PATCH" : "POST";
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? "CMS save failed."); return; }
      const saved = { ...(editing ?? { id: result.id }), ...payload } as CmsRow;
      setData((current) => ({ ...current, [activeType]: editing ? current[activeType].map((row) => row.id === editing.id ? saved : row) : [saved, ...current[activeType]] }));
      setEditing(null);
      setMessage("CMS entry saved.");
    });
  }

  function remove(row: CmsRow) {
    startTransition(async () => {
      const response = await fetch(`/api/cms/${activeType}/${row.id}`, { method: "DELETE" });
      if (!response.ok) { setMessage("CMS delete failed."); return; }
      setData((current) => ({ ...current, [activeType]: current[activeType].filter((item) => item.id !== row.id) }));
      setEditing(null);
      setMessage("CMS entry deleted.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="grid content-start gap-2">{cmsTypes.map((type) => <Button key={type} type="button" variant={type === activeType ? "default" : "outline"} onClick={() => { setActiveType(type); setEditing(null); }}>{cmsLabels[type]}</Button>)}</aside>
      <section className="grid gap-6">
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <form action={submit} className="grid gap-4 rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">{editing ? "Edit" : "Create"} {cmsLabels[activeType]}</h2>
          <div className="grid gap-3 md:grid-cols-2"><Field name="title" label="Title / Name" defaultValue={String(editing?.title ?? editing?.name ?? "")} /><Field name="slug" label="Slug" defaultValue={String(editing?.slug ?? "")} /><Field name="featured_image_url" label="Featured image URL" defaultValue={String(editing?.featured_image_url ?? editing?.image_url ?? "")} /><Field name="category" label="Category / Industry" defaultValue={String(editing?.category ?? editing?.industry ?? "")} /><Field name="seo_title" label="SEO title" defaultValue={String(editing?.seo_title ?? "")} /><Field name="seo_description" label="SEO description" defaultValue={String(editing?.seo_description ?? "")} /></div>
          <Textarea name="description" placeholder="Description / excerpt" defaultValue={String(editing?.description ?? editing?.excerpt ?? "")} />
          <Textarea name="content" placeholder="Body content / solution" defaultValue={String(editing?.content ?? editing?.body ?? editing?.solution ?? "")} />
          <div className="grid gap-3 md:grid-cols-4"><Field name="unit_cost" label="Unit cost" type="number" defaultValue={String(editing?.unit_cost ?? "")} /><Field name="unit_price" label="Unit price" type="number" defaultValue={String(editing?.unit_price ?? "")} /><Field name="setup_fee" label="Setup fee" type="number" defaultValue={String(editing?.setup_fee ?? "")} /><Field name="margin_percent" label="Margin %" type="number" defaultValue={String(editing?.margin_percent ?? "")} /><Field name="logistics_unit_cost" label="Logistics unit" type="number" defaultValue={String(editing?.logistics_unit_cost ?? "")} /><Field name="product_id" label="Product ID" defaultValue={String(editing?.product_id ?? "")} /><Field name="tags" label="Tags" defaultValue={Array.isArray(editing?.tags) ? editing.tags.join(", ") : ""} /><Field name="price_from" label="Price from" type="number" defaultValue={String(editing?.price_from ?? "")} /><Field name="min_quantity" label="MOQ" type="number" defaultValue={String(editing?.min_quantity ?? "")} /><Field name="lead_time_days" label="Lead time" type="number" defaultValue={String(editing?.lead_time_days ?? "")} /></div>
          <div className="grid gap-3 md:grid-cols-3"><Field name="customer" label="Customer" defaultValue={String(editing?.customer ?? "")} /><Field name="challenge" label="Challenge" defaultValue={String(editing?.challenge ?? "")} /><Field name="results" label="Results" defaultValue={String(editing?.results ?? "")} /></div>
          <label className="grid gap-2 text-sm font-medium">Status<select name="status" defaultValue={String(editing?.status ?? "draft")} className="h-10 rounded-md border bg-background px-3"><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <div className="flex gap-2"><Button disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>{editing ? <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button> : null}</div>
        </form>
        <div className="grid gap-3">{rows.map((row) => <div key={row.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">{String(row.title ?? row.name ?? row.slug)}</div><div className="text-sm text-muted-foreground">/{row.slug} • {row.status ?? "draft"}</div></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(row)}>Edit</Button><Button type="button" variant="outline" onClick={() => remove(row)}>Delete</Button></div></div>)}</div>
      </section>
    </div>
  );
}

function Field({ name, label, type = "text", defaultValue }: { name: string; label: string; type?: string; defaultValue?: string }) { return <label className="grid gap-2 text-sm font-medium">{label}<Input name={name} type={type} defaultValue={defaultValue} /></label>; }
