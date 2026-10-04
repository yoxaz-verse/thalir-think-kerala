# Thalir production pilot runbook

## Environment isolation

Create separate Preview and Production Supabase projects. Set `NEXT_PUBLIC_APP_ENV` and `SUPABASE_EXPECTED_PROJECT_REF` in each Vercel environment; validation rejects a URL whose project reference does not match. Never copy Auth users, service keys, Vault secrets, Storage objects, or Resend credentials between environments. Local development uses the Supabase CLI project and deterministic seed.

Rotate any credential that has ever appeared in `.env.example` or git history before deploying. Store service-role, database, Resend, OPSWAT, worker, and health secrets only in Vercel encrypted variables or Supabase Vault.

## Required dashboard configuration

Migrations create tables, RLS, Storage buckets, functions, queues, and the local Before User Created hook. For each hosted project, verify the Auth hook points to `pg-functions://postgres/public/hook_require_platform_invitation`; enable email confirmation, CAPTCHA on sign-in initiation, Google OAuth, and only the exact local/Preview/Production redirect origins. Configure Auth rate limits conservatively and require TOTP for staff accounts.

Set Cron/Vault jobs to invoke `send-notifications` every minute, `scan-files` every minute while attachments are enabled, weekly-summary generation on Monday morning Asia/Kolkata, and deletion processing daily. Requests must use distinct function secrets. Keep email and attachment feature flags off until sandbox checks pass.

## Deployment sequence

1. Start Docker, run `npm run supabase:start`, `npm run supabase:reset`, `npm run supabase:lint`, and `npm run supabase:test`.
2. Regenerate `src/lib/database.types.ts` from the applied schema and commit only the generated result.
3. Apply migrations to Preview, deploy Edge Functions, seed only invited test accounts, and verify the project reference.
4. Run lint, typecheck, unit tests, build, Playwright, accessibility, Lighthouse, Resend sandbox, OPSWAT clean/malicious fixtures, and concurrent quota tests.
5. Verify a Preview backup restore. Record the restore timestamp and operator.
6. Promote the exact Vercel deployment and matching migration SHA. Enable email first; enable attachments only after live clean-file verification and approved legal disclosure.

## Existing production database upgrade

The production schema exported before the pilot already contains the objects from `202610040001_core_platform.sql`. Do not paste or rerun that baseline migration: doing so attempts to recreate existing types and tables. The only production upgrade path is the remaining migrations, in filename order:

1. `202610040002_production_pilot.sql`
2. `202610040003_background_jobs.sql`
3. `202610040004_remove_patient_capital_clinic.sql`

Before applying them, run this read-only preflight query in the production SQL editor. It must return zero rows. Any result means the previous attempt applied part of the pilot migration; stop and reconcile the reported objects before continuing.

```sql
select 'table' as object_type, candidate as object_name
from unnest(array[
  'public.platform_invitations',
  'public.project_revisions',
  'public.upload_sessions',
  'public.file_assets',
  'public.domain_events'
]) as candidates(candidate)
where to_regclass(candidate) is not null
union all
select 'type', 'public.account_status'
where to_regtype('public.account_status') is not null
union all
select 'column', 'public.profiles.account_status'
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'account_status'
)
union all
select 'function', 'public.hook_require_platform_invitation(jsonb)'
where to_regprocedure('public.hook_require_platform_invitation(jsonb)') is not null;
```

Apply the checked-in migrations with the Supabase CLI so migration history and execution order remain authoritative:

```bash
supabase link --project-ref "$SUPABASE_EXPECTED_PROJECT_REF"
supabase migration list --linked
supabase db push --dry-run
supabase db push
```

If the production schema contains the complete baseline but migration `202610040001` is missing from the linked migration history, back up the database and mark only that baseline version as applied with `supabase migration repair 202610040001 --status applied --linked`. Never mark `002`, `003`, or `004` as applied before their SQL succeeds.

Review the dry-run output and confirm it contains only migrations `002`, `003`, and `004` before running the final command. Do not use **Run selected** on fragments of a migration. If the SQL editor must be used for an emergency manual rollout, execute each complete file separately in the order above and stop immediately on the first error.

After the migration, verify the extension, queues, and worker functions:

```sql
select extname, extnamespace::regnamespace as schema_name
from pg_extension
where extname = 'pgmq';

select queue_name
from pgmq.meta
where queue_name in ('file_scans', 'account_deletions')
order by queue_name;

select to_regprocedure('public.claim_background_jobs(text,integer,integer)') as claim_jobs,
       to_regprocedure('public.claim_email_jobs(integer)') as claim_email,
       to_regprocedure('public.complete_scanned_attachment(uuid,text,text,text,text,text)') as complete_scan,
       to_regprocedure('public.complete_account_deletion(uuid)') as complete_deletion;
```

The extension query must return `pgmq`, the queue query must return exactly two rows, and all four function columns must be non-null. Only then configure the Auth **Before User Created** hook as `pg-functions://postgres/public/hook_require_platform_invitation` and deploy the matching Edge Functions.

## Operational thresholds

- `/api/health` without authorization exposes only `ok` or `degraded`; the bearer health token adds database and queue ages.
- Alert when the oldest email job exceeds 5 minutes, the oldest scan exceeds 10 minutes, cron has not run for 3 minutes, or delivery/scan failures exceed 5% over 15 minutes.
- Treat repeated `FORBIDDEN`, invite reuse, signature failures, audit mutation attempts, and malicious-file results as security signals. General logs must not include emails, tokens, message bodies, filenames, signed URLs, or scanner responses.
- Admins may inspect summaries and audit events but must never join a private chat as a user.

## Incident and rollback

Disable the relevant feature flag first. Roll back the Vercel deployment to the last approved build. Edge Functions can be redeployed independently. Database migrations are forward-only: issue a compensating migration and never run a destructive down migration during the pilot. For authorization or file-scanning incidents, disable authenticated mutations or uploads, preserve audit evidence, rotate affected secrets, and notify the pilot owner.

Deletion failures must remain visible in the admin queue. Legal holds require a reason. Before purge, transfer or archive sole-owner projects, generate the export manifest, remove private Storage objects and Auth identity, anonymize shared messages, and retain only minimal pseudonymous audit records.
