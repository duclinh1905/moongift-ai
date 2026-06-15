create extension if not exists "pgcrypto";

create type lead_status as enum ('new', 'qualified', 'contacted', 'won', 'lost');
create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
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
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user');
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
