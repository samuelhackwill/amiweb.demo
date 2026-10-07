-- Run this in the Supabase SQL Editor after applying supabase-schema.sql.
-- These functions are for manual administration from the SQL Editor only.

-- Remove the earlier add function signature, if that version was installed.
drop function if exists public.bio_admin_add_person(text, text);

create table if not exists public.bio_profile_edit_keys (
  slug text primary key references public.bio_profiles(slug) on delete cascade,
  edit_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.bio_profile_edit_keys enable row level security;
revoke all on table public.bio_profile_edit_keys from public, anon, authenticated;
grant select on table public.bio_profile_edit_keys to service_role;

-- Remove direct public writes; the website must save through the token-checking RPC below.
drop policy if exists "Public can create bio profiles" on public.bio_profiles;
drop policy if exists "Public can update bio profiles" on public.bio_profiles;
drop policy if exists "Public can delete bio profiles" on public.bio_profiles;
revoke insert, update, delete on table public.bio_profiles from public, anon, authenticated;

create or replace function public.bio_check_edit_token(p_slug text, p_token uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bio_profile_edit_keys as edit_key
    where edit_key.slug = p_slug and edit_key.edit_token = p_token
  );
$$;

create or replace function public.bio_save_profile_with_edit_token(p_slug text, p_token uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_data jsonb;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'Profile data must be a JSON object.' using errcode = '22023';
  end if;

  update public.bio_profiles as profile
  set data = (p_data - 'slug') || jsonb_build_object('slug', p_slug),
      updated_at = now()
  where profile.slug = p_slug
    and exists (
      select 1 from public.bio_profile_edit_keys as edit_key
      where edit_key.slug = p_slug and edit_key.edit_token = p_token
    )
  returning profile.data into v_data;

  if not found then
    raise exception 'Invalid edit link or profile.' using errcode = '42501';
  end if;

  return v_data;
end;
$$;

revoke all on function public.bio_check_edit_token(text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.bio_check_edit_token(text, uuid) to anon, authenticated;
revoke all on function public.bio_save_profile_with_edit_token(text, uuid, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.bio_save_profile_with_edit_token(text, uuid, jsonb) to anon, authenticated;

create or replace function public.bio_admin_slugify(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '_' from regexp_replace(
    replace(replace(replace(
      translate(lower(btrim(p_name)),
        'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
        'aaaaaaceeeeiiiinooooouuuuyy'
      ),
      'œ', 'oe'
    ), 'æ', 'ae'), 'ß', 'ss'),
    '[^a-z0-9]+', '_', 'g'
  ));
$$;

create or replace function public.bio_admin_add_person(
  p_name text
)
returns public.bio_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text;
  v_base_slug text;
  v_slug text;
  v_suffix integer := 2;
  v_profile public.bio_profiles;
begin
  v_name := nullif(btrim(p_name), '');
  if v_name is null then
    raise exception 'Name cannot be empty.'
      using errcode = '22023';
  end if;

  v_base_slug := public.bio_admin_slugify(v_name);
  if v_base_slug = '' then
    raise exception 'Name must contain at least one letter or number.'
      using errcode = '22023';
  end if;
  v_slug := v_base_slug;
  while exists (select 1 from public.bio_profiles where slug = v_slug) loop
    v_slug := format('%s_%s', v_base_slug, v_suffix);
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.bio_profiles (slug, data, updated_at)
  values (
    v_slug,
    jsonb_build_object(
      'slug', v_slug,
      'name', v_name,
      'nameAsset', '',
      'photo', '',
      'photoFilename', '',
      'bio', 'Cette page est un exemple de profil éditable. Remplacez ce texte depuis le panneau d’édition pour tester les liens, l’*italique* et le **gras**.',
      'faq', jsonb_build_array(
        jsonb_build_array(format('À quoi ressemblent les pièces de %s?', v_name), 'blablabla réponse à la question.'),
        jsonb_build_array(format('Est-ce que %s a travaillé avec d’autres personnes à l’Amicale ou ailleurs?', v_name), 'blablabla réponse à la question.')
      ),
      'contact', jsonb_build_array(jsonb_build_array('Bob Mc Prod', 'mailto:contact@example.com')),
      'links', jsonb_build_array(jsonb_build_array('Lien vers une page web', 'https://exemple.com')),
      'projects', '[]'::jsonb,
      'timeline', jsonb_build_object('periods', '[]'::jsonb)
    ),
    now()
  )
  returning * into v_profile;

  insert into public.bio_profile_edit_keys (slug)
  values (v_slug)
  on conflict (slug) do nothing;

  return v_profile;
end;
$$;

create or replace function public.bio_admin_add_people(p_names text[])
returns table(slug text, name text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text;
  v_profile public.bio_profiles;
begin
  if p_names is null or cardinality(p_names) = 0 then
    raise exception 'Provide at least one name.' using errcode = '22023';
  end if;

  foreach v_name in array p_names loop
    v_profile := public.bio_admin_add_person(v_name);
    slug := v_profile.slug;
    name := v_profile.data ->> 'name';
    return next;
  end loop;
end;
$$;

create or replace function public.bio_admin_edit_person(
  p_slug text,
  p_changes jsonb
)
returns public.bio_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile public.bio_profiles;
begin
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' then
    raise exception 'Changes must be a JSON object.' using errcode = '22023';
  end if;

  update public.bio_profiles
  set data = (data || (p_changes - 'slug')) || jsonb_build_object('slug', p_slug),
      updated_at = now()
  where slug = p_slug
  returning * into v_profile;

  if not found then
    raise exception 'No profile found for slug "%".', p_slug using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

create or replace function public.bio_admin_delete_person(p_slug text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.bio_profiles where slug = p_slug;
  if not found then
    raise exception 'No profile found for slug "%".', p_slug using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.bio_admin_list_edit_urls(p_base_url text)
returns table(slug text, name text, uri text)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_base_url is null or btrim(p_base_url) = '' then
    raise exception 'Provide the site base URL.' using errcode = '22023';
  end if;

  -- Existing profiles receive a stable token the first time this is run.
  insert into public.bio_profile_edit_keys (slug)
  select profile.slug
  from public.bio_profiles as profile
  on conflict (slug) do nothing;

  return query
  select profile.slug,
         profile.data ->> 'name',
         rtrim(btrim(p_base_url), '/') || '/?person=' || profile.slug || '&edit=' || edit_key.edit_token::text
  from public.bio_profiles as profile
  join public.bio_profile_edit_keys as edit_key using (slug)
  order by profile.data ->> 'name', profile.slug;
end;
$$;

create or replace function public.bio_admin_rotate_edit_url(p_slug text, p_base_url text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token uuid;
begin
  if p_base_url is null or btrim(p_base_url) = '' then
    raise exception 'Provide the site base URL.' using errcode = '22023';
  end if;

  update public.bio_profile_edit_keys
  set edit_token = gen_random_uuid(), created_at = now()
  where slug = p_slug
  returning edit_token into v_token;

  if not found then
    raise exception 'No edit link found for slug "%".', p_slug using errcode = 'P0002';
  end if;

  return rtrim(btrim(p_base_url), '/') || '/?person=' || p_slug || '&edit=' || v_token::text;
end;
$$;

-- Keep these admin helpers out of the browser API. The SQL Editor runs as the
-- database owner, which retains permission to execute them.
revoke all on function public.bio_admin_slugify(text) from public, anon, authenticated, service_role;
revoke all on function public.bio_admin_add_person(text) from public, anon, authenticated, service_role;
revoke all on function public.bio_admin_add_people(text[]) from public, anon, authenticated, service_role;
revoke all on function public.bio_admin_edit_person(text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.bio_admin_delete_person(text) from public, anon, authenticated, service_role;
revoke all on function public.bio_admin_list_edit_urls(text) from public, anon, authenticated, service_role;
revoke all on function public.bio_admin_rotate_edit_url(text, text) from public, anon, authenticated, service_role;

comment on function public.bio_admin_add_person(text) is
  'Create a profile from a name, generating a unique slug automatically. Example: select public.bio_admin_add_person(''Mathilde Maillard'');';
comment on function public.bio_admin_add_people(text[]) is
  'Create profiles from a list of names and return their generated slugs. Example: select * from public.bio_admin_add_people(array[''Alice Martin'', ''Bob Byb'']);';
comment on function public.bio_admin_edit_person(text, jsonb) is
  'Merge top-level fields into a profile. Example: select public.bio_admin_edit_person(''mathilde_maillard'', ''{"name":"Mathilde Maillard"}''::jsonb);';
comment on function public.bio_admin_delete_person(text) is
  'Delete a profile. Example: select public.bio_admin_delete_person(''mathilde_maillard'');';
comment on function public.bio_admin_list_edit_urls(text) is
  'Create missing edit tokens and list profile edit URLs. Example: select * from public.bio_admin_list_edit_urls(''https://example.org'');';
comment on function public.bio_admin_rotate_edit_url(text, text) is
  'Revoke an old edit URL and return a replacement. Example: select public.bio_admin_rotate_edit_url(''mathilde_maillard'', ''https://example.org'');';

-- Examples (run individually in the SQL Editor):
-- select public.bio_admin_add_person('Bob Byb');
-- select * from public.bio_admin_add_people(array['Alice Martin', 'Bob Byb', 'Élodie Dupont']);
-- select public.bio_admin_edit_person('bob_byb', '{"name":"Bob B."}'::jsonb);
-- select public.bio_admin_delete_person('bob_byb');
-- select * from public.bio_admin_list_edit_urls('https://example.org');
-- select public.bio_admin_rotate_edit_url('bob_byb', 'https://example.org');
