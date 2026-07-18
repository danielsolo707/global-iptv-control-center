-- Persistent catalog used by the automated IPTV sync and health-check workers.
-- Run after 001_admin_dashboard.sql.

create type public.channel_status as enum ('online', 'offline', 'checking', 'removed', 'blocked');

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[A-Z]{2}$'),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null unique,
  name text not null,
  country text not null,
  country_code text not null references public.countries(code) on update cascade,
  category text,
  language text,
  logo text,
  stream_url text not null,
  status public.channel_status not null default 'checking',
  last_checked timestamptz,
  last_sync timestamptz not null default now(),
  response_time integer,
  fail_count integer not null default 0 check (fail_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index channels_public_listing_idx on public.channels (country_code, category, language)
  where status = 'online';
create index channels_status_idx on public.channels (status, last_checked);

-- The original dashboard migration already creates stream_checks.  Make its
-- status vocabulary compatible with the catalog and retain its history.
alter table public.stream_checks
  alter column status type public.channel_status
  using (case when status::text = 'disabled' then 'removed' else status::text end)::public.channel_status;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger countries_set_updated_at before update on public.countries
for each row execute function public.set_updated_at();
create trigger channels_set_updated_at before update on public.channels
for each row execute function public.set_updated_at();

-- Country roll-up for the daily report and admin dashboard.
create view public.country_availability_report as
select c.code, c.name, c.enabled,
       count(ch.id)::integer as total_channels,
       count(ch.id) filter (where ch.status = 'online')::integer as online_channels,
       count(ch.id) filter (where ch.status in ('offline', 'blocked'))::integer as offline_channels
from public.countries c
left join public.channels ch on ch.country_code = c.code
group by c.code, c.name, c.enabled;

-- Aggregates are exposed without exposing offline stream rows to public users.
create or replace function public.catalog_statistics()
returns table (total_channels bigint, online_channels bigint, offline_channels bigint, countries_count bigint)
language sql stable security definer set search_path = public as $$
  select
    count(ch.id),
    count(ch.id) filter (where ch.status = 'online'),
    count(ch.id) filter (where ch.status in ('offline', 'blocked')),
    (select count(*) from public.countries where enabled)
  from public.channels ch
  join public.countries c on c.code = ch.country_code and c.enabled;
$$;

alter table public.countries enable row level security;
alter table public.channels enable row level security;

-- Public clients can only read the validated, enabled catalog.  The service
-- role used by workers bypasses RLS; dashboard users retain admin access.
create policy "public read enabled countries" on public.countries
  for select using (enabled or public.current_admin_role() is not null);
create policy "admins manage countries" on public.countries
  for all to authenticated
  using (public.current_admin_role() in ('admin', 'moderator'))
  with check (public.current_admin_role() in ('admin', 'moderator'));
create policy "public read online channels" on public.channels
  for select using (
    (status = 'online' and exists (
      select 1 from public.countries c where c.code = country_code and c.enabled
    )) or public.current_admin_role() is not null
  );
create policy "admins manage channels" on public.channels
  for all to authenticated
  using (public.current_admin_role() in ('admin', 'moderator'))
  with check (public.current_admin_role() in ('admin', 'moderator'));

grant select on public.country_availability_report to anon, authenticated;
grant execute on function public.catalog_statistics() to anon, authenticated;

-- Seed the countries requested in the product brief. They remain operator
-- controlled and can be toggled in Supabase or the admin interface.
insert into public.countries (name, code, enabled) values
  ('United States', 'US', true),
  ('United Kingdom', 'GB', true),
  ('Germany', 'DE', true),
  ('France', 'FR', true),
  ('Iran', 'IR', true),
  ('Turkey', 'TR', true)
on conflict (code) do nothing;
