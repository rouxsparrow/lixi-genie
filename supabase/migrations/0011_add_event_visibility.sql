alter table public.events
  add column if not exists is_public boolean not null default true;

create index if not exists events_is_public_created_idx
  on public.events(is_public, created_at desc);
