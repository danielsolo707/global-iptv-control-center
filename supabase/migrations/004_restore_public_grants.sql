-- Fix: "permission denied for schema public" (Postgres 42501)
-- This breaks the public site, admin catalog reads, and GitHub Actions workers.
-- Common after partial migrations or manual REVOKE on schema public.
-- Safe to re-run.

-- 1) Schema usage for all API roles Supabase uses.
grant usage on schema public to postgres, anon, authenticated, service_role;

-- 2) Tables / views currently in public.
grant all on all tables in schema public to postgres, service_role;
grant select on all tables in schema public to anon, authenticated;

-- 3) Sequences (identity columns, etc.).
grant all on all sequences in schema public to postgres, service_role;
grant usage, select on all sequences in schema public to anon, authenticated;

-- 4) Functions (catalog_statistics, current_admin_role, apply_stream_check_result, ...).
grant execute on all functions in schema public to postgres, service_role;
grant execute on all functions in schema public to anon, authenticated;

-- 5) Future objects created by migrations/owners keep working.
alter default privileges in schema public
  grant all on tables to postgres, service_role;
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant all on sequences to postgres, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to postgres, anon, authenticated, service_role;

-- 6) Re-assert public catalog read surface (RLS still applies).
grant select on public.country_availability_report to anon, authenticated;
grant execute on function public.catalog_statistics() to anon, authenticated;

-- Note: RLS policies still restrict rows. service_role bypasses RLS as designed.
