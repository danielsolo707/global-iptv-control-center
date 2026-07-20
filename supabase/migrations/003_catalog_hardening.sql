-- Catalog pipeline hardening: UK/GB normalization, atomic health updates,
-- visibility based on online inventory, and safer public aggregates.

-- 1) Normalize United Kingdom to ISO 3166-1 (GB). iptv-org publishes GB, not UK.
insert into public.countries (name, code, enabled)
select coalesce(c.name, 'United Kingdom'), 'GB', coalesce(c.enabled, true)
from (select name, enabled from public.countries where code = 'UK' limit 1) c
on conflict (code) do update
  set name = excluded.name,
      enabled = public.countries.enabled or excluded.enabled;

-- Point existing UK channels at GB before removing the legacy country row.
update public.channels
set country_code = 'GB',
    country = 'United Kingdom'
where country_code = 'UK';

delete from public.countries where code = 'UK';

-- Ensure GB exists even on fresh installs that never had UK.
insert into public.countries (name, code, enabled)
values ('United Kingdom', 'GB', true)
on conflict (code) do nothing;

-- 2) Atomic health transition helper used by workers / admin probes.
-- Prevents fail_count double-counting when concurrent checkers overlap.
create or replace function public.apply_stream_check_result(
  p_channel_id text,
  p_success boolean,
  p_response_time integer default null,
  p_http_status integer default null,
  p_codec text default null,
  p_resolution text default null,
  p_error_message text default null
) returns public.channels
language plpgsql
security definer
set search_path = public
as $$
declare
  current_fail integer;
  next_fail integer;
  next_status public.channel_status;
  updated public.channels;
begin
  select fail_count into current_fail
  from public.channels
  where channel_id = p_channel_id
  for update;

  if not found then
    raise exception 'channel % not found', p_channel_id;
  end if;

  if p_success then
    next_fail := 0;
    next_status := 'online';
  else
    next_fail := greatest(coalesce(current_fail, 0), 0) + 1;
    if next_fail >= 10 then
      next_status := 'blocked';
    elsif next_fail >= 3 then
      next_status := 'offline';
    else
      next_status := 'checking';
    end if;
  end if;

  update public.channels
  set status = next_status,
      fail_count = next_fail,
      last_checked = now(),
      response_time = coalesce(p_response_time, response_time)
  where channel_id = p_channel_id
  returning * into updated;

  insert into public.stream_checks (
    channel_id, status, response_time_ms, http_status, codec, resolution, error_message, checked_at
  ) values (
    p_channel_id, next_status, p_response_time, p_http_status, p_codec, p_resolution, p_error_message, now()
  );

  return updated;
end;
$$;

revoke all on function public.apply_stream_check_result(text, boolean, integer, integer, text, text, text) from public;
grant execute on function public.apply_stream_check_result(text, boolean, integer, integer, text, text, text) to service_role;
grant execute on function public.apply_stream_check_result(text, boolean, integer, integer, text, text, text) to authenticated;

-- 3) Country roll-up: exclude soft-deleted rows from "total" so the
-- minimum-channel visibility gate is based on living inventory.
create or replace view public.country_availability_report as
select
  c.code,
  c.name,
  c.enabled,
  count(ch.id) filter (where ch.status is distinct from 'removed')::integer as total_channels,
  count(ch.id) filter (where ch.status = 'online')::integer as online_channels,
  count(ch.id) filter (where ch.status in ('offline', 'blocked', 'checking'))::integer as offline_channels,
  count(ch.id) filter (where ch.status = 'removed')::integer as removed_channels
from public.countries c
left join public.channels ch on ch.country_code = c.code
group by c.code, c.name, c.enabled;

grant select on public.country_availability_report to anon, authenticated;

-- 4) Public statistics: only count online inventory for enabled countries.
create or replace function public.catalog_statistics()
returns table (
  total_channels bigint,
  online_channels bigint,
  offline_channels bigint,
  countries_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(ch.id) filter (where ch.status is distinct from 'removed'),
    count(ch.id) filter (where ch.status = 'online'),
    count(ch.id) filter (where ch.status in ('offline', 'blocked', 'checking')),
    (select count(*) from public.countries where enabled)
  from public.channels ch
  join public.countries c on c.code = ch.country_code and c.enabled;
$$;

grant execute on function public.catalog_statistics() to anon, authenticated;

-- 5) Helpful index for the stream checker (least-recently-checked first).
create index if not exists channels_probe_queue_idx
  on public.channels (last_checked nulls first, channel_id)
  where status in ('online', 'offline', 'checking', 'blocked');
