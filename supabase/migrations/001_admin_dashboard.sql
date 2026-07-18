create extension if not exists pgcrypto;
create type public.admin_role as enum ('admin','moderator','viewer');
create type public.channel_admin_status as enum ('online','offline','blocked','removed','disabled');

create table public.admin_users (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade, email text not null unique, role public.admin_role not null default 'viewer', created_at timestamptz not null default now(), last_login timestamptz);
create table public.admin_channels (id uuid primary key default gen_random_uuid(), channel_id text not null unique, status public.channel_admin_status not null default 'online', metadata jsonb not null default '{}', previous_urls jsonb not null default '[]', updated_by uuid references auth.users(id), updated_at timestamptz not null default now());
create table public.country_settings (country_id text primary key, enabled boolean not null default true, updated_by uuid references auth.users(id), updated_at timestamptz not null default now());
create table public.category_settings (category_id text primary key, name text, enabled boolean not null default true, updated_by uuid references auth.users(id), updated_at timestamptz not null default now());
create table public.stream_checks (id bigint generated always as identity primary key, channel_id text not null, status public.channel_admin_status not null, response_time_ms integer, http_status integer, codec text, resolution text, error_message text, checked_at timestamptz not null default now());
create index stream_checks_channel_time_idx on public.stream_checks(channel_id, checked_at desc);
create table public.sync_runs (id bigint generated always as identity primary key, type text not null, status text not null, duration_ms integer, imported_channels integer default 0, updated_channels integer default 0, removed_channels integer default 0, started_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.system_settings (id text primary key default 'global', settings jsonb not null default '{}', updated_by uuid references auth.users(id), updated_at timestamptz not null default now());
create table public.system_logs (id bigint generated always as identity primary key, type text not null, message text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now(), user_id uuid references auth.users(id));
create index system_logs_created_idx on public.system_logs(created_at desc);

create or replace function public.current_admin_role() returns public.admin_role language sql stable security definer set search_path=public as $$ select role from public.admin_users where user_id=auth.uid() $$;
revoke all on function public.current_admin_role() from public; grant execute on function public.current_admin_role() to authenticated;
alter table public.admin_users enable row level security; alter table public.admin_channels enable row level security; alter table public.country_settings enable row level security; alter table public.category_settings enable row level security; alter table public.stream_checks enable row level security; alter table public.sync_runs enable row level security; alter table public.system_settings enable row level security; alter table public.system_logs enable row level security;

create policy "admins can read admin users" on public.admin_users for select to authenticated using (public.current_admin_role() is not null);
create policy "admins manage admin users" on public.admin_users for all to authenticated using (public.current_admin_role()='admin') with check (public.current_admin_role()='admin');
create policy "admin readers" on public.admin_channels for select to authenticated using (public.current_admin_role() is not null);
create policy "channel managers" on public.admin_channels for all to authenticated using (public.current_admin_role() in ('admin','moderator')) with check (public.current_admin_role() in ('admin','moderator'));
create policy "country readers" on public.country_settings for select to authenticated using (public.current_admin_role() is not null); create policy "country managers" on public.country_settings for all to authenticated using (public.current_admin_role() in ('admin','moderator')) with check (public.current_admin_role() in ('admin','moderator'));
create policy "category readers" on public.category_settings for select to authenticated using (public.current_admin_role() is not null); create policy "category managers" on public.category_settings for all to authenticated using (public.current_admin_role() in ('admin','moderator')) with check (public.current_admin_role() in ('admin','moderator'));
create policy "check readers" on public.stream_checks for select to authenticated using (public.current_admin_role() is not null); create policy "check writers" on public.stream_checks for insert to authenticated with check (public.current_admin_role() in ('admin','moderator'));
create policy "sync readers" on public.sync_runs for select to authenticated using (public.current_admin_role() is not null); create policy "sync managers" on public.sync_runs for all to authenticated using (public.current_admin_role()='admin') with check (public.current_admin_role()='admin');
create policy "settings readers" on public.system_settings for select to authenticated using (public.current_admin_role() is not null); create policy "settings managers" on public.system_settings for all to authenticated using (public.current_admin_role()='admin') with check (public.current_admin_role()='admin');
create policy "log readers" on public.system_logs for select to authenticated using (public.current_admin_role() is not null); create policy "log writers" on public.system_logs for insert to authenticated with check (public.current_admin_role() in ('admin','moderator'));

-- After creating the first Auth user, bootstrap them once in the SQL editor:
-- insert into public.admin_users (user_id,email,role) values ('AUTH_USER_UUID','admin@example.com','admin');
