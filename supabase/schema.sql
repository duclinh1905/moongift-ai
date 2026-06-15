create extension if not exists "pgcrypto";

create type lead_status as enum ('new', 'contacted', 'qualified', 'quoted', 'negotiating', 'won', 'lost');
create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  role text not null default 'viewer' check (role in ('admin', 'manager', 'sales', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null,
  price_from numeric(10, 2) not null,
  min_quantity integer not null default 20,
  lead_time_days integer not null default 10,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  audience text not null,
  quantity integer not null,
  budget_per_gift numeric(10, 2) not null,
  delivery_date date not null,
  message text,
  status lead_status not null default 'new',
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  quote_number text not null unique,
  status quote_status not null default 'draft',
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  valid_until date not null,
  notes text,
  sent_at timestamptz,
  sent_pdf_path text,
  sent_to_email text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  line_total numeric(12, 2) generated always as (quantity * unit_price) stored
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy "Profiles are self readable" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Profiles are admin writable" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Products are public readable" on public.products
  for select using (is_active = true);

create policy "Products are admin writable" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Leads are admin readable" on public.leads
  for select using (public.is_admin());

create policy "Leads can be inserted publicly" on public.leads
  for insert with check (true);

create policy "Leads are admin writable" on public.leads
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Quotes are admin managed" on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Quote items are admin managed" on public.quote_items
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.products (slug, name, category, description, price_from, min_quantity, lead_time_days, tags)
values
  ('jade-lantern', 'Jade Lantern Executive Box', 'executive', 'Executive hamper with mooncakes, tea, ceramic ware, and personalized cards.', 68, 30, 12, array['VIP clients', 'custom card', 'tea pairing']),
  ('harvest-gold', 'Harvest Gold Partner Set', 'premium', 'Premium corporate gifting set for partner appreciation and branded unboxing.', 44, 50, 10, array['partners', 'foil logo', 'bulk ready']),
  ('lotus-care', 'Lotus Care Wellness Gift', 'wellness', 'Mooncakes, herbal tea, dried fruit, and a wellness note for employee recognition.', 29, 100, 8, array['employees', 'wellness', 'budget friendly']),
  ('team-moon', 'Team Moon Celebration Pack', 'team', 'Scalable team gifting pack with assorted mooncakes and department personalization.', 19, 200, 7, array['teams', 'large volume', 'fast lead time'])
on conflict (slug) do nothing;

-- Production hardening / RLS audit additions
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_price_from_positive') then
    alter table public.products add constraint products_price_from_positive check (price_from >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_min_quantity_positive') then
    alter table public.products add constraint products_min_quantity_positive check (min_quantity > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_lead_time_non_negative') then
    alter table public.products add constraint products_lead_time_non_negative check (lead_time_days >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_quantity_positive') then
    alter table public.leads add constraint leads_quantity_positive check (quantity > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_budget_positive') then
    alter table public.leads add constraint leads_budget_positive check (budget_per_gift >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_email_length') then
    alter table public.leads add constraint leads_email_length check (char_length(email) <= 254);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_delivery_not_epoch') then
    alter table public.leads add constraint leads_delivery_not_epoch check (delivery_date >= date '2000-01-01');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_amounts_non_negative') then
    alter table public.quotes add constraint quotes_amounts_non_negative check (subtotal >= 0 and tax >= 0 and total >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_valid_until_not_epoch') then
    alter table public.quotes add constraint quotes_valid_until_not_epoch check (valid_until >= date '2000-01-01');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_items_quantity_positive') then
    alter table public.quote_items add constraint quote_items_quantity_positive check (quantity > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_items_unit_price_non_negative') then
    alter table public.quote_items add constraint quote_items_unit_price_non_negative check (unit_price >= 0);
  end if;
end $$;

create index if not exists leads_status_created_at_idx on public.leads (status, created_at desc);
create index if not exists leads_owner_id_idx on public.leads (owner_id);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists quotes_status_created_at_idx on public.quotes (status, created_at desc);
create index if not exists quotes_lead_id_idx on public.quotes (lead_id);
create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);
create index if not exists products_active_name_idx on public.products (is_active, name);

-- RLS policy audit notes:
-- 1. profiles: users can read themselves, admins can read/write profiles.
-- 2. products: only active products are publicly readable; only admins can mutate.
-- 3. leads: anonymous/authenticated visitors may create leads only; admins read/update.
-- 4. quotes/quote_items/activity_logs: admin-only access.
-- 5. application public quote creation now uses the anon SSR client to exercise this RLS boundary.

drop policy if exists "Leads can be inserted publicly" on public.leads;
create policy "Leads can be inserted by public clients" on public.leads
  for insert to anon, authenticated
  with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();


-- Phase 3 CRM workflow additions
alter type lead_status add value if not exists 'quoted';
alter type lead_status add value if not exists 'negotiating';

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
  alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'sales', 'viewer'));

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quotes' and column_name = 'sent_at') then
    alter table public.quotes add column sent_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quotes' and column_name = 'sent_pdf_path') then
    alter table public.quotes add column sent_pdf_path text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quotes' and column_name = 'sent_to_email') then
    alter table public.quotes add column sent_to_email text;
  end if;
end $$;

create index if not exists quotes_sent_at_idx on public.quotes (sent_at desc) where sent_at is not null;

insert into storage.buckets (id, name, public)
values ('quote-pdfs', 'quote-pdfs', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Quote PDFs are admin readable') then
    create policy "Quote PDFs are admin readable" on storage.objects
      for select using (bucket_id = 'quote-pdfs' and public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Quote PDFs are admin writable') then
    create policy "Quote PDFs are admin writable" on storage.objects
      for insert with check (bucket_id = 'quote-pdfs' and public.is_admin());
  end if;
end $$;

-- Phase 3 role-based access policies
create or replace function public.is_crm_reader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager', 'sales', 'viewer')
  );
$$;

create or replace function public.is_crm_writer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager', 'sales')
  );
$$;

drop policy if exists "Leads are admin readable" on public.leads;
drop policy if exists "Leads are CRM readable" on public.leads;
create policy "Leads are CRM readable" on public.leads
  for select using (public.is_crm_reader());

drop policy if exists "Leads are admin writable" on public.leads;
drop policy if exists "Leads are CRM writable" on public.leads;
create policy "Leads are CRM writable" on public.leads
  for update using (public.is_crm_writer()) with check (public.is_crm_writer());

drop policy if exists "Quotes are admin managed" on public.quotes;
drop policy if exists "Quotes are CRM readable" on public.quotes;
drop policy if exists "Quotes are CRM writable" on public.quotes;
create policy "Quotes are CRM readable" on public.quotes
  for select using (public.is_crm_reader());
create policy "Quotes are CRM writable" on public.quotes
  for all using (public.is_crm_writer()) with check (public.is_crm_writer());

drop policy if exists "Quote items are admin managed" on public.quote_items;
drop policy if exists "Quote items are CRM readable" on public.quote_items;
drop policy if exists "Quote items are CRM writable" on public.quote_items;
create policy "Quote items are CRM readable" on public.quote_items
  for select using (public.is_crm_reader());
create policy "Quote items are CRM writable" on public.quote_items
  for all using (public.is_crm_writer()) with check (public.is_crm_writer());

-- Phase 4 CMS + SEO Growth Platform
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cms_status') then
    create type cms_status as enum ('draft', 'published');
  end if;
end $$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status cms_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  featured_image_url text,
  status cms_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.products add column if not exists category_id uuid references public.categories(id);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists featured_image_url text;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists status cms_status not null default 'published';
alter table public.products add column if not exists published_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  tags text[] not null default '{}',
  featured_image_url text,
  author text not null default 'MoonGift Editorial Team',
  status cms_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  customer text not null,
  industry text not null,
  challenge text not null,
  solution text not null,
  results text not null,
  featured_image_url text,
  status cms_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  image_url text,
  placement text not null default 'homepage',
  status cms_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  industry text not null,
  hero text not null,
  body text not null,
  faqs jsonb not null default '[]'::jsonb,
  featured_image_url text,
  status cms_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.blog_posts enable row level security;
alter table public.case_studies enable row level security;
alter table public.banners enable row level security;
alter table public.landing_pages enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['categories', 'collections', 'blog_posts', 'case_studies', 'banners', 'landing_pages'] loop
    execute format('drop policy if exists "%s public read published" on public.%I', tbl, tbl);
    execute format('create policy "%s public read published" on public.%I for select using (status = ''published'' or public.is_crm_reader())', tbl, tbl);
    execute format('drop policy if exists "%s CRM write" on public.%I', tbl, tbl);
    execute format('create policy "%s CRM write" on public.%I for all using (public.is_crm_writer()) with check (public.is_crm_writer())', tbl, tbl);
  end loop;
end $$;

drop policy if exists "Products CMS status read" on public.products;
create policy "Products CMS status read" on public.products
  for select using (is_active = true or public.is_crm_reader());

create index if not exists blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index if not exists case_studies_status_published_idx on public.case_studies (status, published_at desc);
create index if not exists landing_pages_status_slug_idx on public.landing_pages (status, slug);
create index if not exists products_status_slug_idx on public.products (status, slug);

insert into public.blog_posts (slug, title, excerpt, content, category, tags, status, published_at, seo_title, seo_description)
values ('mid-autumn-corporate-gifting-guide', 'The B2B Mid-Autumn Corporate Gifting Guide', 'Plan premium mooncake gifting programs with predictable budgets and timelines.', 'Plan early, segment recipients by business value, confirm dietary requirements, and reserve production capacity before peak season.', 'Guides', array['Mid-Autumn', 'Corporate gifting'], 'published', now(), 'B2B Mid-Autumn Corporate Gifting Guide', 'A practical guide for planning premium Mid-Autumn corporate gifting programs.')
on conflict (slug) do nothing;

insert into public.case_studies (slug, title, customer, industry, challenge, solution, results, status, published_at, seo_title, seo_description)
values ('banking-vip-client-gifting', 'How a Banking Team Delivered 1,200 VIP Gift Sets', 'Regional Banking Group', 'Banking', 'The team needed tiered gifts for relationship managers without losing brand consistency.', 'MoonGift created executive, partner, and employee tiers with shared brand guidelines and delivery tracking.', '1,200 gifts delivered across three regions with 98% on-time delivery and faster sales follow-up.', 'published', now(), 'Banking VIP Client Gifting Case Study', 'A Mid-Autumn corporate gifting case study for banking relationship teams.')
on conflict (slug) do nothing;

-- Phase 5 Product Configuration & Personalization Engine
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  unit_cost numeric(10, 2) not null default 0,
  unit_price numeric(10, 2) not null default 0,
  status cms_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personalization_options (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  option_type text not null check (option_type in ('uv_logo_printing', 'foil_stamping', 'laser_engraving', 'embossing', 'recipient_name_printing', 'qr_code_personalization')),
  description text not null,
  unit_cost numeric(10, 2) not null default 0,
  unit_price numeric(10, 2) not null default 0,
  setup_fee numeric(10, 2) not null default 0,
  status cms_status not null default 'published',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packaging_options (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  packaging_type text not null check (packaging_type in ('carton_box', 'premium_rigid_box', 'magnetic_box', 'wooden_box', 'paper_bag', 'fabric_bag', 'ribbon', 'sleeve')),
  description text not null,
  unit_cost numeric(10, 2) not null default 0,
  unit_price numeric(10, 2) not null default 0,
  status cms_status not null default 'published',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  rule_type text not null default 'margin',
  conditions jsonb not null default '{}'::jsonb,
  margin_percent numeric(5, 4) not null default 0.35,
  logistics_unit_cost numeric(10, 2) not null default 0,
  status cms_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quote_items add column if not exists variant_id uuid references public.product_variants(id);
alter table public.quote_items add column if not exists packaging_option_id uuid references public.packaging_options(id);
alter table public.quote_items add column if not exists personalization_option_ids uuid[] not null default '{}';
alter table public.quote_items add column if not exists greeting_template text;
alter table public.quote_items add column if not exists personalized_message text;
alter table public.quote_items add column if not exists configuration jsonb not null default '{}'::jsonb;
alter table public.quote_items add column if not exists product_cost numeric(12, 2) not null default 0;
alter table public.quote_items add column if not exists packaging_cost numeric(12, 2) not null default 0;
alter table public.quote_items add column if not exists printing_cost numeric(12, 2) not null default 0;
alter table public.quote_items add column if not exists personalization_cost numeric(12, 2) not null default 0;
alter table public.quote_items add column if not exists logistics_cost numeric(12, 2) not null default 0;
alter table public.quote_items add column if not exists gross_margin numeric(12, 2) not null default 0;

alter table public.product_variants enable row level security;
alter table public.personalization_options enable row level security;
alter table public.packaging_options enable row level security;
alter table public.pricing_rules enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array['product_variants', 'personalization_options', 'packaging_options', 'pricing_rules'] loop
    execute format('drop policy if exists "%s public read published" on public.%I', tbl, tbl);
    execute format('create policy "%s public read published" on public.%I for select using (status = ''published'' or public.is_crm_reader())', tbl, tbl);
    execute format('drop policy if exists "%s CRM write" on public.%I', tbl, tbl);
    execute format('create policy "%s CRM write" on public.%I for all using (public.is_crm_writer()) with check (public.is_crm_writer())', tbl, tbl);
  end loop;
end $$;

insert into public.personalization_options (slug, name, option_type, description, unit_cost, unit_price, setup_fee)
values
  ('uv-logo-printing', 'UV Logo Printing', 'uv_logo_printing', 'Full-color logo application for branded packaging.', 1.25, 3.5, 75),
  ('foil-stamping', 'Foil Stamping', 'foil_stamping', 'Premium metallic logo treatment.', 1.75, 4.5, 95),
  ('laser-engraving', 'Laser Engraving', 'laser_engraving', 'Permanent engraving for wood or metal components.', 2.25, 6, 120),
  ('embossing', 'Embossing', 'embossing', 'Raised brand mark for rigid boxes and sleeves.', 1.5, 4, 90),
  ('recipient-name-printing', 'Recipient Name Printing', 'recipient_name_printing', 'Variable recipient names on cards or sleeves.', 0.8, 2.5, 50),
  ('qr-code-personalization', 'QR Code Personalization', 'qr_code_personalization', 'Unique QR codes for personal video or landing page messages.', 0.6, 2, 50)
on conflict (slug) do nothing;

insert into public.packaging_options (slug, name, packaging_type, description, unit_cost, unit_price)
values
  ('carton-box', 'Carton Box', 'carton_box', 'Reliable bulk shipping carton.', 1.2, 3),
  ('premium-rigid-box', 'Premium Rigid Box', 'premium_rigid_box', 'Premium presentation box for clients and partners.', 5, 12),
  ('magnetic-box', 'Magnetic Box', 'magnetic_box', 'Magnetic-close box for executive gifting.', 6.5, 16),
  ('wooden-box', 'Wooden Box', 'wooden_box', 'Keepsake wooden box for VIP gifts.', 9, 24),
  ('paper-bag', 'Paper Bag', 'paper_bag', 'Branded paper carrier bag.', 0.7, 2),
  ('fabric-bag', 'Fabric Bag', 'fabric_bag', 'Reusable fabric gift bag.', 1.5, 4),
  ('ribbon', 'Ribbon', 'ribbon', 'Decorative ribbon finish.', 0.35, 1.25),
  ('sleeve', 'Sleeve', 'sleeve', 'Printed product sleeve.', 0.9, 2.75)
on conflict (slug) do nothing;

insert into public.pricing_rules (slug, name, rule_type, margin_percent, logistics_unit_cost)
values ('standard-corporate-margin', 'Standard Corporate Margin', 'margin', 0.35, 1.5)
on conflict (slug) do nothing;

-- Phase 6 Fulfillment & Production Operating System
do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type approval_status as enum ('draft', 'pending_approval', 'approved', 'rejected', 'revision_requested');
  end if;
  if not exists (select 1 from pg_type where typname = 'production_status') then
    create type production_status as enum ('waiting_production', 'printing', 'packaging', 'quality_control', 'ready_shipment', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type delivery_status as enum ('pending', 'label_created', 'in_transit', 'delivered', 'failed', 'returned');
  end if;
  if not exists (select 1 from pg_type where typname = 'supplier_type') then
    create type supplier_type as enum ('printing', 'packaging', 'logistics');
  end if;
end $$;

create table if not exists public.artwork_assets (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  asset_type text not null check (asset_type in ('logo', 'brand_guidelines', 'artwork_file')),
  file_name text not null,
  file_url text not null,
  version integer not null default 1,
  approval_status approval_status not null default 'draft',
  notes text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  artwork_asset_id uuid references public.artwork_assets(id) on delete set null,
  status approval_status not null default 'draft',
  requested_by uuid references auth.users(id),
  requested_at timestamptz,
  decided_at timestamptz,
  customer_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supplier_type supplier_type not null,
  contact_name text,
  email text,
  phone text,
  average_rating numeric(4, 2) not null default 0,
  on_time_rate numeric(5, 4) not null default 0,
  defect_rate numeric(5, 4) not null default 0,
  status cms_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status production_status not null default 'waiting_production',
  due_date date,
  printing_cost numeric(12, 2) not null default 0,
  packaging_cost numeric(12, 2) not null default 0,
  logistics_cost numeric(12, 2) not null default 0,
  production_cost numeric(12, 2) not null default 0,
  actual_margin numeric(12, 2) not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  full_name text not null,
  company_name text,
  email text,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postal_code text,
  country text not null default 'US',
  personalized_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  recipient_id uuid references public.recipients(id) on delete set null,
  logistics_supplier_id uuid references public.suppliers(id) on delete set null,
  tracking_number text,
  carrier text,
  status delivery_status not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  shipping_cost numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  status delivery_status not null,
  event_note text,
  event_at timestamptz not null default now()
);

create table if not exists public.supplier_performance (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  score numeric(4, 2) not null default 0,
  on_time boolean not null default true,
  defects integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.artwork_assets enable row level security;
alter table public.approval_requests enable row level security;
alter table public.suppliers enable row level security;
alter table public.production_jobs enable row level security;
alter table public.recipients enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.supplier_performance enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array['artwork_assets', 'approval_requests', 'suppliers', 'production_jobs', 'recipients', 'shipments', 'shipment_events', 'supplier_performance'] loop
    execute format('drop policy if exists "%s CRM read" on public.%I', tbl, tbl);
    execute format('create policy "%s CRM read" on public.%I for select using (public.is_crm_reader())', tbl, tbl);
    execute format('drop policy if exists "%s CRM write" on public.%I', tbl, tbl);
    execute format('create policy "%s CRM write" on public.%I for all using (public.is_crm_writer()) with check (public.is_crm_writer())', tbl, tbl);
  end loop;
end $$;

create index if not exists artwork_assets_quote_idx on public.artwork_assets (quote_id, version desc);
create index if not exists approval_requests_status_idx on public.approval_requests (status, created_at desc);
create index if not exists production_jobs_status_idx on public.production_jobs (status, due_date);
create index if not exists shipments_status_idx on public.shipments (status, created_at desc);
create index if not exists recipients_quote_idx on public.recipients (quote_id);
create index if not exists supplier_performance_supplier_idx on public.supplier_performance (supplier_id, created_at desc);

insert into public.suppliers (name, supplier_type, contact_name, email, average_rating, on_time_rate, defect_rate)
values
  ('Prime Print Studio', 'printing', 'Print Ops', 'print@example.com', 4.7, 0.96, 0.02),
  ('RigidBox Works', 'packaging', 'Packaging Ops', 'packaging@example.com', 4.6, 0.94, 0.015),
  ('Metro Gift Logistics', 'logistics', 'Logistics Ops', 'logistics@example.com', 4.5, 0.93, 0.01)
on conflict do nothing;
