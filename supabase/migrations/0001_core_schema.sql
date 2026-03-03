create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  state text not null default 'setup' check (state in ('setup', 'fairness_locked', 'drawing', 'revealed', 'completed')),
  phase text not null default 'office' check (phase in ('office', 'remote')),
  commitment_hash text,
  server_seed_ciphertext text,
  seed_revealed_at timestamptz,
  draw_nonce bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null,
  avatar_type text not null default 'emoji' check (avatar_type in ('emoji', 'image')),
  avatar_emoji text,
  avatar_image_path text,
  participation_mode text not null default 'office' check (participation_mode in ('office', 'remote')),
  draw_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.prizes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  amount_vnd bigint not null check (amount_vnd > 0),
  total_stock integer not null check (total_stock >= 0),
  remaining_stock integer not null check (remaining_stock >= 0),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint prizes_stock_lte_total check (remaining_stock <= total_stock)
);

create table if not exists public.draw_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  prize_id uuid references public.prizes(id) on delete set null,
  status text not null check (status in ('locked', 'verified', 'void')),
  ticket text not null,
  client_seed_json jsonb not null,
  draw_nonce bigint not null,
  proof_hash text not null,
  prev_row_hash text not null,
  row_hash text not null,
  is_effective boolean not null default true,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'pass', 'fail')),
  verification_reason text,
  void_of_draw_id uuid references public.draw_records(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_admin_audit (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  action text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists draw_records_one_effective_draw_per_participant_idx
  on public.draw_records(event_id, participant_id)
  where is_effective = true and status in ('locked', 'verified');

create index if not exists draw_records_event_created_desc_idx
  on public.draw_records(event_id, created_at desc);

create index if not exists prizes_event_order_idx
  on public.prizes(event_id, display_order, id);

create index if not exists participants_event_sort_idx
  on public.participants(event_id, sort_order, id);

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.prizes enable row level security;
alter table public.draw_records enable row level security;
alter table public.event_admin_audit enable row level security;

-- Public read projections, writes via service role / API only.
drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
for select using (true);

drop policy if exists participants_public_read on public.participants;
create policy participants_public_read on public.participants
for select using (true);

drop policy if exists prizes_public_read on public.prizes;
create policy prizes_public_read on public.prizes
for select using (true);

drop policy if exists draw_records_public_read on public.draw_records;
create policy draw_records_public_read on public.draw_records
for select using (true);

-- No public read for admin audit
