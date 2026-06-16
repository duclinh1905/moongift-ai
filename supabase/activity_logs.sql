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

-- Phase 3 role-based activity log policies
drop policy if exists "Activity logs are admin readable" on public.activity_logs;
drop policy if exists "Activity logs are CRM readable" on public.activity_logs;
create policy "Activity logs are CRM readable" on public.activity_logs
  for select using (public.is_crm_reader());

drop policy if exists "Activity logs are admin insertable" on public.activity_logs;
drop policy if exists "Activity logs are CRM insertable" on public.activity_logs;
create policy "Activity logs are CRM insertable" on public.activity_logs
  for insert with check (public.is_crm_writer());

-- Phase 6 activity timeline entity support
alter table public.activity_logs drop constraint if exists activity_logs_entity_type_check;
alter table public.activity_logs add constraint activity_logs_entity_type_check
  check (entity_type in ('lead', 'quote', 'quote_item', 'auth', 'artwork', 'approval', 'production', 'delivery', 'supplier', 'recipient'));
