# Thalir production launch checklist

Production is intentionally blocked until every required value is approved. Preview deployments continue to work with the draft banner.

## 1. Owner-supplied launch inputs

- [ ] Final HTTPS domain
- [ ] Approved public contact email and legal entity/controller identity
- [ ] Approved English and Malayalam copy reviewed by fluent editors
- [ ] Approved privacy and terms copy, including retention/contact obligations
- [ ] Founder, investor, mentor, institution and partner Google Form URLs
- [ ] Approved Instagram, Facebook and YouTube URLs
- [ ] Real organization/program/event records replacing all sample language
- [ ] Future event dates verified with their organizers

Set the corresponding Vercel Production variables from `.env.example`. Only after approval set:

```text
NEXT_PUBLIC_CONTENT_APPROVED=true
NEXT_PUBLIC_PRIVACY_COPY_APPROVED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

Keep all three `false` in Development and Preview. Run `npm run validate:production` with production variables before promotion.

### Supabase core platform

- [ ] Create separate Supabase projects for Preview and Production and apply the checked-in migrations to each
- [ ] Configure the public project URL and publishable key in their intended Vercel environments
- [ ] Store the Supabase secret key and database URL as server-only secrets—never with a `NEXT_PUBLIC_` prefix
- [ ] Configure Google OAuth and magic-link redirects for the exact Preview and Production origins
- [ ] Set invitation expiry, upload limit, and auth redirect origin from `.env.example`
- [ ] Deploy the notification Edge Function with its invocation secret
- [ ] Verify the Resend domain and configure the API key and approved sender
- [ ] Keep transactional notifications disabled until the sender and privacy copy are approved
- [ ] Assign pilot plans to test accounts through the protected admin surface

## 2. Vercel project

- [ ] Import the Git repository and keep `main` as the Production branch
- [ ] Confirm `vercel.json` uses ordinary builds for Preview and `build:production` for Production
- [ ] Add variables separately for Preview and Production; never copy approval flags into Preview
- [ ] Enable Preview Deployment Protection for stakeholder review
- [ ] Enable Web Analytics in the Vercel dashboard only after privacy approval
- [ ] Add the final custom domain, verify DNS, HTTPS and both `www`/apex redirect policy
- [ ] Select the GitHub `Quality Gate / Lint, test, build and browser QA` check as a required Deployment Check

## 3. Preview acceptance

```bash
npm ci
npm run validate:launch
npm run test:a11y
npm run test:lighthouse
```

- [ ] Review `/en` and `/ml` on phone, tablet and desktop
- [ ] Review every navigation, listing, filter, detail, error and empty state with keyboard only
- [ ] Confirm focus visibility, reduced motion and WCAG AA contrast
- [ ] Check canonical, hreflang, sitemap, robots and Open Graph previews
- [ ] Open each Google Form and verify role, owner, privacy disclosure and confirmation behavior
- [ ] Verify no sample text, placeholder domains, expired events or console errors

## 4. Promote and observe

- [ ] Promote the exact approved deployment; do not trigger a separate unreviewed build
- [ ] Smoke-test English, Malayalam, legal pages, joins, sitemap and social cards on the live domain
- [ ] Confirm `/_vercel/insights` requests appear when analytics is enabled
- [ ] Review Vercel runtime/build logs and Web Analytics after launch
- [ ] Record the deployment URL and owner responsible for incident communication

## Rollback

If a launch regression appears, use the Vercel project Deployments view to promote the last verified deployment to the Production domain. Disable analytics by setting `NEXT_PUBLIC_ANALYTICS_ENABLED=false` and redeploy if privacy approval is withdrawn. Keep the affected deployment URL and logs for diagnosis.
