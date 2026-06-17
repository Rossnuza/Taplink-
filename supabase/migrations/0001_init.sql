-- ============================================================================
-- TapLink — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI) once, against
-- a fresh project. It creates every table, index, and security policy the app
-- needs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type block_type as enum (
  'linkedin', 'contact', 'website', 'document', 'calendar', 'custom'
);

create type event_type as enum (
  'scan', 'link_click', 'doc_open', 'doc_email', 'contact_save'
);

-- ----------------------------------------------------------------------------
-- profiles — one public page per signed-in user
-- ----------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  handle        text unique not null,
  display_name  text not null default '',
  title         text,
  bio           text,
  avatar_url    text,
  logo_url      text,
  brand_color   text,
  website_url   text,
  linkedin_url  text,
  contact_email text,
  phone         text,
  company       text,
  is_live       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- handles are matched case-insensitively in the app; store lowercased.
create unique index profiles_handle_lower_idx on profiles (lower(handle));

-- ----------------------------------------------------------------------------
-- assets — uploaded PDFs (teaser, one-pager, IM). Replacing a file bumps the
-- version but keeps the same row id, so the QR/links never change.
-- ----------------------------------------------------------------------------
create table assets (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles (id) on delete cascade,
  title         text not null,
  storage_path  text not null,
  file_size     bigint not null default 0,
  version       integer not null default 1,
  require_email boolean not null default false,
  mime_type     text not null default 'application/pdf',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index assets_profile_idx on assets (profile_id);

-- ----------------------------------------------------------------------------
-- link_blocks — the ordered, toggleable buttons on the visitor page
-- ----------------------------------------------------------------------------
create table link_blocks (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  type        block_type not null,
  label       text not null,
  url         text,
  asset_id    uuid references assets (id) on delete cascade,
  position    integer not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);
create index link_blocks_profile_idx on link_blocks (profile_id, position);

-- ----------------------------------------------------------------------------
-- leads — captured emails (the "lead inbox")
-- ----------------------------------------------------------------------------
create table leads (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  email       text not null,
  asset_id    uuid references assets (id) on delete set null,
  source      text,
  country     text,
  device      text,
  created_at  timestamptz not null default now()
);
create index leads_profile_idx on leads (profile_id, created_at desc);

-- ----------------------------------------------------------------------------
-- events — the "pixel": one row per scan / click / open / capture
-- ----------------------------------------------------------------------------
create table events (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  type        event_type not null,
  block_id    uuid references link_blocks (id) on delete set null,
  asset_id    uuid references assets (id) on delete set null,
  source      text,
  device      text,
  browser     text,
  country     text,
  created_at  timestamptz not null default now()
);
create index events_profile_idx on events (profile_id, created_at desc);
create index events_type_idx on events (profile_id, type);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger assets_set_updated_at before update on assets
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Owners (auth.uid()) can read & write everything that belongs to them.
-- The public visitor page, event logging and lead capture all run server-side
-- with the service-role key, which bypasses RLS — so anonymous visitors never
-- touch these tables directly.
-- ----------------------------------------------------------------------------
alter table profiles    enable row level security;
alter table assets      enable row level security;
alter table link_blocks enable row level security;
alter table leads       enable row level security;
alter table events      enable row level security;

create policy "owner manages own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "owner manages own assets" on assets
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "owner manages own blocks" on link_blocks
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "owner reads own leads" on leads
  for select using (auth.uid() = profile_id);

create policy "owner reads own events" on events
  for select using (auth.uid() = profile_id);

-- ----------------------------------------------------------------------------
-- Storage buckets
--   avatars / logos  — public read (shown on the visitor page)
--   documents        — private; served through signed URLs from the API
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true),
       ('logos', 'logos', true),
       ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');

create policy "owner writes own avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and owner = auth.uid()
  );
create policy "owner writes own logos" on storage.objects
  for insert with check (
    bucket_id = 'logos' and owner = auth.uid()
  );
create policy "owner manages own documents" on storage.objects
  for all using (
    bucket_id = 'documents' and owner = auth.uid()
  ) with check (
    bucket_id = 'documents' and owner = auth.uid()
  );
