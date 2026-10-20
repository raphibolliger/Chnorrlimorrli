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
- Pages live in `src/app/pages/` (one `.ts` + one `.html` per page). Shared UI lives in `src/app/components/`, services and state in `src/app/core/`. Public pages are children of the layout route `SiteLayout` (header and footer); the admin area has its own shell.
- Styling: Tailwind CSS v4 utility classes in templates only. The only stylesheet is `src/styles.css` (Tailwind import, `@theme` tokens and the `admin-*` utilities). No component CSS files, no `styleUrl`.
- Code shared by the frontend and the edge functions lives in `supabase/functions/_shared/`: `pricing.ts` (money and shipping rules), `orders.ts` (request and response contracts, enum types, labels) and the generated `database.types.ts`. Files the frontend imports may only use type imports with a `.ts` extension.
- Mobile first, including the admin area.
- Customers see their order at `bestellung?code=<access token>` (page `order-status`, edge function `order-summary`): the random `orders.access_token` is the only key, never the order number, and the page shows no address or phone. Stripe returns to the same page with `&neu=1`, which thanks the customer and clears the cart once paid. Every customer mail links to it; `orderPagePath()` in `_shared/orders.ts` builds the path.
- Static output (`outputMode: static`): content pages are prerendered (`src/app/app.routes.server.ts`), shop, checkout and admin render on the client. GitHub Pages serves `index.csr.html` as `404.html` for client routes.
- Static assets live in `public/`. Use relative asset paths (no leading slash) because the staging site runs under a base href.

## Backend (Supabase)

- Everything server-side runs in Supabase: Postgres with RLS, Auth, Storage and Edge Functions. No other backend.
- Schema changes only as migrations in `supabase/migrations/`. Regenerate `supabase/functions/_shared/database.types.ts` with `npm run db:types` after every schema change (CI fails on drift). The edge functions use a typed client (`adminClient()`) and `.throwOnError()` instead of hand-written row types and casts.
- Every table in `public` has RLS. Catalogue and shipping tables are publicly readable when active, writable only for admins (`public.is_admin()`, backed by the private schema `app`). Orders are never publicly readable; edge functions write them with the service role through the security-definer functions in `20261015000200_order_functions.sql`. Admin saves that touch several tables go through one `security invoker` function each (`save_product`, `save_shipping_method`) so they are atomic and still subject to RLS.
- Admin users and `app.admins` rows are created directly in Supabase, never in the repository: `supabase/scripts/create-admin.sh <email>` (remote: `PROJECT_REF` and `SUPABASE_ACCESS_TOKEN`; local: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`). Before go-live only `developer@chnorrlimorrli.ch` gets access.
- Admin area: `src/app/admin/` (own layout, lazy routes in `admin.routes.ts`, `adminGuard`). It uses a neutral design modelled on YARX Hub, not the Chnorrlimorrli look: grey and white with the blue `info` accent, system font, building blocks in `src/app/admin/ui/` (page header, section card, status chip with tones, segmented control, search field, notice banner, empty state, skeleton, SVG icons) and the field and button utilities `admin-field`, `admin-textarea`, `admin-label`, `admin-hint`, `admin-checkbox`, `admin-button-primary`, `admin-button-secondary`, `admin-button-danger` and `admin-button-text` in `src/styles.css`. Pages only show data; every action that needs input opens a dialog (`app-admin-dialog` in `ui/dialog.ts`, a native `<dialog>`: centered on desktop, full screen on mobile, Esc/X/backdrop close it, unsaved changes ask «Änderungen verwerfen?» first). A dialog closes only after saving succeeded, then the page shows «Gespeichert.»; errors stay in the dialog. Form dialogs: `product-form-dialog`, `shipping-method-dialog`, `order-action-dialog`; small confirmations are inline `app-admin-dialog`s. Actions without input (toggle visibility, move or upload images) run directly. Errors meant for the admin are thrown as `UserFacingError`; everything else shows a fixed German fallback. Cards on mobile, tables on desktop, tab bar at the bottom on mobile. Login by six-digit code (`signInWithOtp` without sign-ups). Locally the code mail lands in Mailpit (http://127.0.0.1:54324).
- The initial catalogue and shipping methods from Ecwid are a data migration (`20261015000400_catalogue_from_ecwid.sql`). Their product images live in `supabase/seed/product-images/` and are uploaded to the `product-images` bucket under `seed/` by `supabase/scripts/upload-seed-images.sh` (locally after `npx supabase db reset`, remotely by the deploy workflow).
- Mail: `supabase/functions/_shared/mail.ts` sends through the Azure Communication Services REST API (HMAC-signed). `MAIL_REDIRECT_TO` redirects every mail and puts the original recipient into the subject; it must stay set to `developer@chnorrlimorrli.ch` until go-live. Templates live in `supabase/functions/_shared/mail-templates.ts`: each mail is a list of blocks (paragraphs and the item table) rendered once to HTML and once to plain text. Customer mails end with the «Bestellung ansehen» link. `npx deno run --allow-env --allow-net supabase/scripts/send-test-mails.ts developer@chnorrlimorrli.ch` sends every template (needs `ACS_CONNECTION_STRING`).
- Login code mails of Supabase Auth go through the ACS SMTP relay (`supabase-auth@chnorrlimorrli.ch`, Entra app «Chnorrlimorrli SMTP»). `supabase/scripts/configure-auth.sh` applies SMTP, the German template `supabase/templates/login-code.html` and the auth settings to the project; the deploy workflow runs it.
- Local development: `npx supabase start` (Docker) runs the full stack on :54321, Mailpit on :54324. `npm start` uses the local stack (`environment.development.ts`).

## Commands

- `npm start` – dev server on :4200 against the local Supabase stack
- `npx ng serve --configuration production` – dev server on :4200 against the deployed Supabase project (launch config `remote`)
- `npm test` – unit tests (Vitest)
- `npm run format` / `npm run format:check` – Prettier
- `npm run build -- --base-href /Chnorrlimorrli/` – production build as deployed to staging
- `npx supabase start` / `npx supabase db reset` – local Supabase stack, reapply migrations and seed
- `npm run db:types` – regenerate database types from the local stack

## Deployment

- `.github/workflows/deploy-pages.yml` builds and publishes to GitHub Pages on every push to `main`. Repository variables: `BASE_HREF` (default `/Chnorrlimorrli/`), `SITE_NOINDEX` (default `true`).
- Staging: https://raphibolliger.github.io/Chnorrlimorrli/
- `.github/workflows/supabase.yml` applies migrations, sets function secrets and deploys edge functions on pushes to `main` that touch `supabase/`. Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SMTP_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ACS_CONNECTION_STRING`. Variables: `MAIL_REDIRECT_TO`, `MAIL_REPLY_TO`, `ADMIN_NOTIFICATION_TO`, `SITE_URL`, `ALLOWED_ORIGINS`.
- `.github/workflows/keep-alive.yml` queries the Data API every two days so the free project is not paused (variable `SUPABASE_PUBLISHABLE_KEY`; the run fails if it is missing).

## Go-live

The steps for switching `chnorrlimorrli.ch` from Ecwid to this project are in `docs/go-live.md`. They are executed only after an explicit OK.
