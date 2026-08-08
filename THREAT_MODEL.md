# THREAT MODEL — Next.js Base (whitelabel template)

This document is the threat model for the template repository and for every
project derived from it. It defines assets, entry points, and prioritized
threats so that security review effort is focused where it matters.

## System context

The template is a Next.js 16 application (App Router, Turbopack) deployed on
Vercel with Bun. It serves a public marketing/content site with optional
serverless Postgres access (NeonDB). The system receives anonymous public
traffic; there is no user authentication or account system in the template.

Intended use: cloning this repo per client project and adapting branding,
content, and domain. The security posture documented here applies to the
derived project as well; the derived project SHOULD revisit this model when
adding authentication, payments, or user data.

## Assets

- `DATABASE_URL` (NeonDB connection string) — server-side secret; grants
  full read/write access to the project database.
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SITE_URL`, consent settings — public by
  design, but tampering degrades analytics and SEO integrity.
- The production domain's indexation status: non-production hosts must stay
  unindexed to avoid duplicate content penalties.
- Cookie consent state (stored in the visitor's browser) — must not be
  spoofable to enable tracking without consent.
- Source code and CI configuration (GitHub) — supply-chain integrity of the
  template itself.

## Entry points

- `proxy.ts` (Edge middleware): runs on every request; enforces
  `X-Robots-Tag` on non-production hosts. Trust boundary: public internet →
  edge.
- Route handlers and server components (App Router): server-side code that
  may execute SQL via `@/lib/db`. Trust boundary: edge → server runtime.
- Client bundle (React hydration): runs in the visitor's browser. Trust
  boundary: server → browser.
- CI/CD (GitHub Actions): installs dependencies and builds; secret material
  (`DATABASE_URL`) may be present in the environment. Trust boundary: repo
  content → CI runner.
- Analytics script (gtag): third-party JavaScript loaded on consent.

## Threats

| # | Threat | Likelihood | Impact | Priority | Mitigation |
|---|--------|-----------|--------|----------|------------|
| T1 | Secret leakage (`.env.local` committed or exposed in build output) | Medium | High | P0 | `.env*` gitignored, CI audit gate, `DATABASE_URL` never imported client-side |
| T2 | SQL injection via raw queries on derived projects | Low (template) | High | P1 | `sql` tagged template in `@/lib/db`; derived projects must not string-concatenate |
| T3 | Non-production domain indexed (duplicate content / staging leakage) | Medium | Medium | P1 | Three-layer guard: `X-Robots-Tag`, robots.txt `Disallow`, `noindex` metadata — all three must hold |
| T4 | Analytics loaded without consent | Low | Medium | P1 | GA only loads after consent; default-off unless `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT=true` |
| T5 | Supply-chain attack via compromised dependency | Low | High | P1 | `bun.lock` frozen in CI, `bun audit` gate, dependabot, CodeQL |
| T6 | Cookie banner bypass (consent state forged) | Low | Low | P2 | Consent stored in a signed cookie; treat as best-effort (client-side) |

## Deprioritized

- Authentication, authorization, and account takeover: out of scope — the
  template has no user accounts; derived projects must add a dedicated
  threat model for auth.
- Payment card data: out of scope — no payments in the template.
- DDoS/abuse: accepted risk — Vercel edge network provides baseline
  protection; high-volume sites must add WAF rules at the platform level.
- Client-side XSS in third-party embeds: accepted as low risk; no user
  content is rendered in the template.

## Open questions

- Whether derived projects will expose public API routes (currently none in
  the template). If yes, the OpenAPI spec and rate-limiting posture must be
  added per project.
- Whether the template should ship a WAF rule set (Vercel Firewall) as a
  default configuration.
- Whether `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT` should default to true for
  client projects under GDPR-adjacent jurisdictions.

## Provenance

- Dependencies are pinned via `bun.lock` (frozen installs in CI). Supply
  chain checks: `bun audit` in CI, Dependabot alerts on GitHub, CodeQL
  scanning on push.
- This threat model is reviewed on every template release; version
  compatibility with the template's `SECURITY.md` policy is required.

## Recommended mitigations

- Keep the three-layer no-index guard intact; do not remove any single layer
  without a written justification.
- Never put `DATABASE_URL` in client components or in
  `NEXT_PUBLIC_*` variables.
- Run `bun audit` before every release (enforced in CI).
- For derived projects: enable Vercel Firewall, add rate limiting on any new
  API route, and extend this model with auth/payments if introduced.
- Report vulnerabilities per `SECURITY.md`; the template owner commits to a
  response SLA of 7 days.
