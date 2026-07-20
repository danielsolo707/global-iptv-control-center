# Global IPTV v3

> A cinematic global live-TV directory paired with a secure IPTV operations control center.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3fcf8e?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)

Global IPTV v3 makes thousands of provider-published, free-to-air streams easy to explore by country, category, and channel. It includes favorites, recent viewing, live search previews, multi-source playback fallback, accessibility preferences, and a complete `/admin` dashboard for catalog operations, stream health, synchronization, analytics, audit logs, and role-based administration.

## Highlights

### Viewer experience

- Live IPTV catalog sourced from the public `iptv-org` dataset
- Browse and filter by country, category, favorites, and recently watched
- Fast search with compact channel previews and full result views
- HLS playback with source fallback, autoplay preference, volume, and fullscreen controls
- Responsive cinematic interface designed for desktop and mobile
- Accessibility controls for reduced motion and increased contrast
- Short-lived server cache to keep provider additions and removals fresh

### Administration control center

The secure dashboard is available at `/admin` and includes:

- Operational overview with total, online, offline, blocked, and removed channels
- Channel management with search, filters, pagination, bulk enable/disable, CSV export, and manual tests
- Detailed channel metadata, current stream URL, and 30-check health history
- HTTP reachability and optional FFprobe codec/resolution validation
- Country and category enable/disable controls
- Manual synchronization, full refresh, cache refresh, and sync activity
- Stream monitoring, latency charts, health distribution, and problem-channel triage
- Platform analytics, stability rankings, uptime, growth, and viewing summaries
- Admin-user management and immutable role checks on every protected operation
- System settings, audit logs, loading states, responsive navigation, and dark/light themes

## Role model

| Role | Permissions |
| --- | --- |
| `admin` | Full dashboard access, user management, sync controls, and system settings |
| `moderator` | Channel, country, category, and stream-health operations; no system settings |
| `viewer` | Read-only dashboard and export access |

Authorization is enforced on the server. Hiding a button is never treated as a security boundary.

## Tech stack

- Next.js 16 App Router and React 19
- TypeScript in strict mode
- Tailwind CSS 4 and shadcn/ui conventions
- Supabase Auth, PostgreSQL, and row-level security
- Recharts for admin analytics
- HLS.js for adaptive stream playback
- Lucide React icons
- Vercel Analytics

## Getting started

Requirements:

- Node.js 20.9 or newer
- pnpm 10+ (recommended)
- A Supabase project for administrator authentication and persistence
- FFmpeg/FFprobe on the server if codec and resolution validation is required

```bash
git clone https://github.com/danielsolo707/global-iptv-v3.git
cd global-iptv-v3
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the viewer application and [http://localhost:3000/admin](http://localhost:3000/admin) for the control center.

## Supabase setup

1. Create a Supabase project.
2. Run the migrations in order:
   - [`001_admin_dashboard.sql`](supabase/migrations/001_admin_dashboard.sql) — admin roles, audit tables, RLS
   - [`002_iptv_catalog.sql`](supabase/migrations/002_iptv_catalog.sql) — persistent channel catalog, online-only public reads, seed countries (US, GB, DE, FR, IR, TR)
   - [`003_catalog_hardening.sql`](supabase/migrations/003_catalog_hardening.sql) — UK→GB normalization, atomic stream-check RPC, improved country availability report
3. Create the first administrator in Supabase Authentication.
4. Copy that user's UUID and bootstrap the role in the SQL editor:

```sql
insert into public.admin_users (user_id, email, role)
values ('AUTH_USER_UUID', 'admin@example.com', 'admin');
```

5. Configure `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
FFPROBE_PATH=ffprobe
```

The service-role key is used only by trusted server-side code and the GitHub Actions workers. Keep it server-only and never prefix it with `NEXT_PUBLIC_`.

### Automated catalog

The IPTV catalog is synchronized from the upstream `index.m3u` every day. Channel metadata is matched with the upstream public channel list to obtain country, category, and language data. The workers keep channels missing from the upstream source as `removed`, rather than deleting them.

GitHub Actions runs the stream checker every six hours (including previously blocked channels so they can recover). It records HTTP/Content-Type results in `stream_checks`, and optional FFprobe codec validation when `FFPROBE_PATH` is set. Status transitions:

| Consecutive failures | Status |
| --- | --- |
| 0 (healthy check) | `online` (counter reset) |
| 1–2 | `checking` |
| 3–9 | `offline` |
| 10+ | `blocked` |

Channels missing from upstream are marked `removed` (never hard-deleted). Channels that reappear are restored to `checking` for re-validation.

Add these repository secrets before enabling the workflows:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

The service role key is used only by GitHub Actions and server-side code—never put it in a browser variable. The generated API endpoints are `GET /api/channels` (optional `country`, `category`, and `language` filters), `GET /api/countries`, and `GET /api/statistics`. Once Supabase is configured, they source only validated online channels from the database.

## Security design

- Supabase sessions are refreshed through the Next.js request proxy.
- Every dashboard page verifies the authenticated user against `admin_users`.
- Every admin API independently authenticates and checks the minimum role.
- PostgreSQL row-level security mirrors the application role rules.
- Stream tests accept only HTTP(S), reject private-network destinations, disable redirects, and use strict timeouts to reduce SSRF risk.
- Secrets are excluded from Git; `.env.example` documents names only.
- Admin actions, stream checks, synchronization runs, and errors are auditable.

## FFprobe validation

Manual stream tests always perform an HTTP reachability check. For video codec and resolution inspection, install FFmpeg and point `FFPROBE_PATH` to the executable:

```dotenv
FFPROBE_PATH=/usr/bin/ffprobe
```

On Windows, an absolute path such as `C:\\ffmpeg\\bin\\ffprobe.exe` can be used. Deployments without FFprobe still return HTTP status and latency, while clearly reporting that media validation is not configured.

## Commands

```bash
pnpm dev            # start the development server
pnpm lint           # run strict TypeScript validation
pnpm build          # create the optimized production build
pnpm start          # serve the production build
pnpm test           # unit tests (status machine, SSRF, roles, sync rules)
pnpm test:workers   # Python status-machine tests for GitHub Actions workers
```

See [`CHANGELOG.md`](CHANGELOG.md) for the full fix/upgrade report.

## Project structure

```text
app/
  admin/                 protected administration routes
  api/admin/             authenticated admin operations
  watch/                 live playback experience
components/
  admin/                 dashboard shell, tables, charts, and forms
lib/
  admin/                 role checks and operational data models
  supabase/              server-side Supabase client
  iptv-service.ts        upstream data ingestion and caching
supabase/migrations/     database schema and RLS policies
proxy.ts                 Supabase session refresh
```

## Open-source acknowledgements

Global IPTV v3 is possible because of excellent open-source projects and public data maintainers:

- [iptv-org](https://github.com/iptv-org/iptv) — community-maintained channel and stream data
- [Next.js](https://github.com/vercel/next.js) and [React](https://github.com/facebook/react) — application framework and UI runtime
- [Supabase](https://github.com/supabase/supabase) — authentication, PostgreSQL tooling, and row-level security platform
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [shadcn/ui](https://github.com/shadcn-ui/ui), and [Base UI](https://github.com/mui/base-ui) — styling and accessible UI foundations
- [HLS.js](https://github.com/video-dev/hls.js) — HLS playback in browsers with Media Source Extensions
- [Recharts](https://github.com/recharts/recharts) — composable operational charts
- [Lucide](https://github.com/lucide-icons/lucide) — interface iconography
- [TypeScript](https://github.com/microsoft/TypeScript), [clsx](https://github.com/lukeed/clsx), [Class Variance Authority](https://github.com/joe-bell/cva), and [tailwind-merge](https://github.com/dcastil/tailwind-merge) — type safety and class composition

Please support these projects and follow their individual licenses and attribution requirements.

## Responsible use

This project is a directory and player for links published by upstream providers. It does not host, rebroadcast, or claim ownership of television content. Stream availability and rights vary by provider and jurisdiction. Operators are responsible for complying with applicable laws, provider terms, and takedown requests.

## Contributing

Issues and pull requests are welcome. For security-sensitive findings, avoid publishing credentials or exploit details in a public issue; contact the repository owner privately first.

---

Built with care for the open web, independent broadcasters, and the open-source community.
