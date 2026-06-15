create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null check (entity_type in ('lead', 'quote', 'quote_item', 'auth')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

create policy "Activity logs are admin readable" on public.activity_logs
  for select using (public.is_admin());

create policy "Activity logs are admin insertable" on public.activity_logs
  for insert with check (public.is_admin());

create index if not exists activity_logs_created_at_idx
  on public.activity_logs (created_at desc);

create index if not exists activity_logs_entity_idx
  on public.activity_logs (entity_type, entity_id);
