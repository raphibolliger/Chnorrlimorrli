# Chnorrlimorrli

Website and shop for the Freiamt children's book «Chnorrlimorrli» (Verein Chnorrlimorrli, Villmergen). Replaces the former Ecwid shop. Requirements and decisions: GitHub issue #1 and its sub-issues.

Content is German (Swiss tone, never use ß, always ss).

## Ground rules

- The repository is public. Never commit secrets. The frontend may only contain public values (Supabase URL and publishable key). Secrets live in GitHub Actions secrets and Supabase function secrets.
- Until go-live `chnorrlimorrli.ch` keeps running on Ecwid. Do not touch Ecwid, the domain or its DNS.
- Never send mail to `hoi@chnorrlimorrli.ch` before go-live. All mail is redirected to `developer@chnorrlimorrli.ch` (`MAIL_REDIRECT_TO`).
- Stripe: develop and test only in the sandbox. Never touch live mode.
- No code comments. Express intent through names.
- One branch and one pull request per issue (`feature/<nr>-<name>`, `task/<nr>-<name>`), squash merge.

## Frontend

- Angular 22, standalone components, signals, zoneless, new control flow.
- Pages live in `src/app/pages/` (one `.ts` + one `.html` per page). Shared UI lives in `src/app/components/`, services and state in `src/app/core/`.
- Styling: Tailwind CSS v4 utility classes in templates only. The only stylesheet is `src/styles.css` (Tailwind import and `@theme` tokens). No component CSS files, no `styleUrl`.
- Mobile first, including the admin area.
- Static output (`outputMode: static`): content pages are prerendered (`src/app/app.routes.server.ts`), shop, checkout and admin render on the client. GitHub Pages serves `index.csr.html` as `404.html` for client routes.
- Static assets live in `public/`. Use relative asset paths (no leading slash) because the staging site runs under a base href.

## Backend (Supabase)

- Everything server-side runs in Supabase: Postgres with RLS, Auth, Storage and Edge Functions. No other backend.
- Schema changes only as migrations in `supabase/migrations/`. Regenerate `src/types/database.types.ts` with `npm run db:types` after every schema change (CI fails on drift).
- Every table in `public` has RLS. Catalogue and shipping tables are publicly readable when active, writable only for admins (`public.is_admin()`, backed by the private schema `app`). Orders are never publicly readable; edge functions write them with the service role through the security-definer functions in `20261015000200_order_functions.sql`.
- Admin users and `app.admins` rows are created directly in Supabase, never in the repository.
- Local development: `npx supabase start` (Docker) runs the full stack on :54321, Mailpit on :54324. `npm start` uses the local stack (`environment.development.ts`).

## Commands

- `npm start` – dev server on :4200
- `npm test` – unit tests (Vitest)
- `npm run format` / `npm run format:check` – Prettier
- `npm run build -- --base-href /Chnorrlimorrli/` – production build as deployed to staging
- `npx supabase start` / `npx supabase db reset` – local Supabase stack, reapply migrations and seed
- `npm run db:types` – regenerate database types from the local stack

## Deployment

- `.github/workflows/deploy-pages.yml` builds and publishes to GitHub Pages on every push to `main`. Repository variables: `BASE_HREF` (default `/Chnorrlimorrli/`), `SITE_NOINDEX` (default `true`).
- Staging: https://raphibolliger.github.io/Chnorrlimorrli/
- `.github/workflows/supabase.yml` applies migrations, sets function secrets and deploys edge functions on pushes to `main` that touch `supabase/`. Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ACS_CONNECTION_STRING`. Variables: `MAIL_REDIRECT_TO`, `ADMIN_NOTIFICATION_TO`, `SITE_URL`, `ALLOWED_ORIGINS`.
- `.github/workflows/keep-alive.yml` queries the Data API every two days so the free project is not paused.
