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
