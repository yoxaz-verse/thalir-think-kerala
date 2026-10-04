# Thalir by Think Kerala

A bilingual, server-rendered Next.js platform for Kerala's independent startup ecosystem.

## Start locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`; it redirects to English at `/en`. Malayalam is available at `/ml`.

## Content and configuration

- Edit structured bilingual entries in `src/lib/content.ts`.
- Edit interface dictionaries in `src/lib/i18n.ts`.
- Set the canonical site URL and the five role-specific Google Form URLs in `.env.local`.
- Public contact/social URLs and launch approval flags are also defined in `.env.example`.
- Only `forms.gle` and `docs.google.com/forms` URLs are enabled. Missing or invalid values render a safe “coming soon” route instead of a broken external link.
- Review contact details, sample organizations, dates and all public Malayalam with the organization before launch.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

See [BRAND_BOOK.md](./BRAND_BOOK.md) for identity guidance.

## Production launch

Vercel Preview deployments deliberately allow draft content and show a visible preview banner. Production uses `npm run build:production`, which blocks promotion while the canonical domain, owner-approved contact/legal copy, five Google Forms, social URLs, content approval, or current event data are missing.

Follow [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) for environment setup, preview acceptance, analytics activation, domain promotion, monitoring and rollback. The GitHub `Quality Gate` workflow is intended to be selected as a required Vercel Deployment Check.

## Supabase core platform

The authenticated founder–investor workspace uses Supabase Postgres, Auth, Storage, Realtime and Edge Functions. Public programs, opportunities, events, stories and organizations also come from the `content_items` table; repository content is used only when Supabase is intentionally unconfigured.

```bash
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/lib/database.types.generated.ts
npm run dev
```

Configure Google OAuth and the local callback URL in Supabase Auth. Email magic links use the same `/auth/callback` endpoint. Apply migrations before deploying the matching application build. Deploy and schedule the `send-notifications`, `process-file-scans`, and `process-account-deletions` Edge Functions; the first uses `email_outbox`, while file scanning and deletion consume their dedicated pgmq queues. Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, provider keys, or function secrets to the browser.

For an existing database that already contains the core schema, follow [the production pilot runbook](./docs/PRODUCTION-PILOT-RUNBOOK.md#existing-production-database-upgrade). Do not rerun the core migration or paste partial migration selections into the SQL editor.

Pilot access is deliberately admin-assigned. Payments, Social Funding, Community, Revive and AI advisors are not enabled by this milestone.
