create table if not exists public.bio_profiles (
  slug text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.bio_profiles enable row level security;

drop policy if exists "Public can read bio profiles" on public.bio_profiles;
create policy "Public can read bio profiles"
  on public.bio_profiles for select
  using (true);

drop policy if exists "Public can create bio profiles" on public.bio_profiles;
drop policy if exists "Public can update bio profiles" on public.bio_profiles;
drop policy if exists "Public can delete bio profiles" on public.bio_profiles;
revoke insert, update, delete on table public.bio_profiles from public, anon, authenticated;
grant select on table public.bio_profiles to anon, authenticated;
