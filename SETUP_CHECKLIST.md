# Your setup checklist (operator steps)

Code-side fixes are complete. Complete these steps on your machine/cloud so the app runs against a live catalog.

## 1) Local environment

In the project root (`global-iptv-ui`):

```bash
cp .env.example .env.local
```

Fill in real values (never commit this file):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# Optional — enables codec/resolution checks in admin + workers
FFPROBE_PATH=ffprobe
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` must **never** use a `NEXT_PUBLIC_` prefix.
- If you already have a `.env` with real values, copy those into `.env.local` (Next.js prefers `.env.local`).

## 2) Supabase database migrations

In the Supabase SQL editor (or CLI), run **in order**:

1. `supabase/migrations/001_admin_dashboard.sql`
2. `supabase/migrations/002_iptv_catalog.sql`
3. `supabase/migrations/003_catalog_hardening.sql`  ← required for this upgrade

Migration 003:

- Converts legacy `UK` → `GB`
- Adds atomic `apply_stream_check_result` RPC
- Improves `country_availability_report`

## 3) Create the first admin user

1. Supabase → **Authentication** → create a user (email/password).
2. Copy the user’s UUID.
3. Run in SQL editor:

```sql
insert into public.admin_users (user_id, email, role)
values ('AUTH_USER_UUID', 'you@example.com', 'admin');
```

## 4) Install and run locally

```bash
pnpm install
pnpm dev
```

- Viewer: http://localhost:3000  
- Admin: http://localhost:3000/admin  

## 5) First catalog sync + health check

After migrations + env are ready, populate the catalog:

**Option A — Admin UI (recommended once logged in as admin)**  
`/admin/sync` → **Start Sync Now**

**Option B — Local script (needs service role in env)**

```bash
node scripts/sync-catalog.mjs
```

**Option C — Python worker**

```bash
pip install -r workers/requirements.txt
# set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment
python workers/sync_iptv.py
python workers/check_streams.py
```

New/restored channels start as `checking`. The stream checker promotes healthy ones to `online`.  
**The public site only shows `online` channels.**

## 6) GitHub Actions (keep catalog fresh)

In the GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | Same as project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |

Workflows already present:

| Workflow | Schedule | Purpose |
| --- | --- | --- |
| `iptv-sync.yml` | Daily | Added/removed channel sync |
| `stream-check.yml` | Every 6 hours | Link health + status machine |
| `country-report.yml` | Daily | Availability report artifact |

You can also run each via **Actions → workflow_dispatch → Run workflow**.

## 7) Deploy (Vercel or similar)

Set the same env vars in the host (including `SUPABASE_SERVICE_ROLE_KEY` as a **server-only** secret).

Redeploy after pushing the code.

## 8) Smoke-test checklist

- [ ] `/` loads countries/channels (after some channels are `online`)
- [ ] `/watch/[slug]` plays or falls back cleanly
- [ ] `/admin/login` works with the admin user
- [ ] `/admin/channels` shows real statuses (not fake data)
- [ ] `/admin/sync` records a real sync run
- [ ] Toggle a country off → it disappears from the public catalog after cache refresh
- [ ] Stream test rejects `http://127.0.0.1/...` (SSRF guard)

## 9) Git (when you are ready)

Changes are currently uncommitted in both:

- this agent worktree
- `Desktop\DanielEmpire\ML\global-iptv-ui`

When ready:

```bash
git add -A
git commit -m "Fix catalog freshness pipeline, admin data, SSRF, and tests"
git push
```

Or ask the coding agent to create the commit for you.
