# Changelog — Global IPTV v3 full fix & upgrade

## Summary

Full ownership pass over the catalog freshness pipeline, public APIs, admin control center, security surface, and automated tests. The primary reported bug was that the site could not reliably stay in sync with validated online channels.

## Root cause of the primary bug

Several independent defects stacked:

1. **Reappearing channels stayed `removed`** — daily sync preserved the previous status when the stream URL was unchanged, including `removed`. Channels that left and returned upstream never reappeared on the site.
2. **United Kingdom country code mismatch** — the database seeded `UK` while iptv-org publishes `GB`, so UK streams never matched enabled countries during sync.
3. **Stream checker never re-probed `blocked` rows** — once blocked, channels could not recover to `online` even after a healthy check.
4. **FFprobe was treated as required** — the worker always called `ffprobe` (default binary name). Transient probe failures marked HTTP-healthy streams offline; the product spec says FFprobe is optional when `FFPROBE_PATH` is set.
5. **Admin dashboard used mock/hash health** — operations UI did not read the real `channels` / `stream_checks` tables, so operators could not see or act on the true pipeline state.
6. **Admin country toggles wrote `country_settings` only** — workers and the public catalog read `countries.enabled`, so toggles had no effect on sync or the viewer.
7. **Admin “Start Sync” only refreshed the in-memory cache** — it never ran catalog synchronization against upstream `index.m3u`.
8. **Supabase catalog path never populated the short-lived cache** — every request re-queried the database; after sync the cache path was inconsistent.
9. **Public channel API hard-capped at 500 rows** — large online catalogs were truncated.

## Pipeline fixes (Phase 1)

- Restored reappearing channels (`removed` → `checking`, fail counter reset).
- Soft-delete only: missing upstream channels are marked `removed`, never hard-deleted.
- GB/UK normalization across workers, scripts, migrations, and TypeScript helpers.
- Stream checker status machine verified: 1 fail → `checking`, 3 → `offline`, 10 → `blocked`, success → `online` + counter reset.
- Optional FFprobe; HTTP + Content-Type validation is the baseline.
- Blocked channels included in the probe set so they can recover.
- Optimistic concurrency / SQL RPC `apply_stream_check_result` to reduce fail_count drift under concurrent runs.
- Audit rows written to `sync_runs` and `system_logs` for sync + stream checks.
- Public APIs (`/api/channels`, `/api/countries`, `/api/statistics`) source only `online` channels from enabled countries (and respect disabled categories).
- Full pagination for online channel reads (no 500-row cap).
- Cache invalidation after admin sync / enable-disable / URL replace.

## Other bugs fixed (Phase 2)

- Admin overview, channels, problems, monitoring now use the real catalog tables.
- Country/category admin pages use real enablement state.
- Sync page shows real `sync_runs` history instead of hard-coded numbers.
- Channel detail health history reads the last 30 `stream_checks` rows.
- Moderator role can toggle countries/categories (was incorrectly admin-only in the UI).
- Player: Safari native HLS path + HLS.js network/media recovery before source fallback.
- Public unauthenticated `POST /api/iptv` cache refresh removed (admin-only via action API).

## Security hardening (Phase 3)

- Hardened SSRF validator for admin stream tests: protocol allow-list, credential rejection, private/link-local/metadata IP ranges, decimal/octal/hex IPv4 forms, IPv6 ULA/link-local/mapped, DNS resolution before fetch, redirects disabled.
- Service-role key remains server-only (`SUPABASE_SERVICE_ROLE_KEY`, never `NEXT_PUBLIC_`).
- Server-side role checks on every admin page and admin API (unchanged design, expanded coverage for sync/catalog writes).
- Soft-delete only for channels; self-removal of the current admin account blocked.

## Upgrades (Phase 4)

- Shared pure modules: `lib/stream-health.ts`, `lib/ssrf.ts`, `lib/country-codes.ts`, `lib/catalog-sync.ts`.
- Migration `003_catalog_hardening.sql` (GB normalization, atomic health RPC, improved country report, probe index).
- GitHub Actions stream-check workflow sets `FFPROBE_PATH=ffprobe` when ffmpeg is installed.
- Clearer operator logging in Python workers.

## Tests run

| Command | Result |
| --- | --- |
| `pnpm lint` (`tsc --noEmit`) | Pass |
| `pnpm build` | Pass |
| `pnpm test` (node:test via tsx) | Pass (status machine, SSRF, country codes, sync restore, role matrix, catalog filter) |
| `pnpm test:workers` / `python workers/test_status_machine.py` | Pass |

## Migration steps for existing deployments

1. Apply migrations in order: `001_admin_dashboard.sql`, `002_iptv_catalog.sql`, **`003_catalog_hardening.sql`**.
2. Confirm repository secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Optionally set `FFPROBE_PATH` for codec validation (local + Actions already set when ffmpeg is present).
4. Run a catalog sync (`pnpm` script, admin Start Sync, or `workflow_dispatch` on Daily IPTV sync).
5. Run the stream checker (`workflow_dispatch` on Stream checker) so channels progress from `checking` → `online`.
