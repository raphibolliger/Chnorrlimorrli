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

## Commands

- `npm start` – dev server on :4200
- `npm test` – unit tests (Vitest)
- `npm run format` / `npm run format:check` – Prettier
- `npm run build -- --base-href /Chnorrlimorrli/` – production build as deployed to staging

## Deployment

- `.github/workflows/deploy-pages.yml` builds and publishes to GitHub Pages on every push to `main`. Repository variables: `BASE_HREF` (default `/Chnorrlimorrli/`), `SITE_NOINDEX` (default `true`).
- Staging: https://raphibolliger.github.io/Chnorrlimorrli/
