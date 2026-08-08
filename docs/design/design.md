# Design Intent — Next.js Base (whitelabel template)

This document captures the architectural intent of this template: the
preconditions it assumes, the invariants that must hold, and the design
rationale behind each decision. Read it before changing structure.

## Preconditions

- Node.js ≥ 20 and Bun ≥ 1.3 are available in the environment.
- The project is deployed on Vercel with Bun as the runtime.
- A NeonDB (PostgreSQL serverless) instance is provisioned; `DATABASE_URL`
  points to it.
- `NEXT_PUBLIC_SITE_URL` is the canonical public URL of the site.
- The repo is used as a **template**: it is cloned per client project and
  whitelabeled (branding, domain, content) without changing architecture.

## Invariants

- `src/lib/site.ts` is the **single source of truth** for SEO metadata.
  All titles, descriptions, and keywords must be edited there; nothing else
  hardcodes them. This invariant must hold for every client project.
- Server Components are the default; `'use client'` is only added for
  interactivity. No `setState` inside `useEffect` (React 19 lint rule).
- `cookies()` and `headers()` are async in Next.js 16 and must always be
  awaited.
- Non-production domains are never indexed. Three layers enforce this
  (`X-Robots-Tag` in proxy.ts, `Disallow: /` in robots.ts, `<meta
  name="robots" content="noindex">` in metadata) and all three must hold.
- Analytics only load after cookie consent (or when
  `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT=true`).

## Design decisions

### Why we chose Bun over npm/yarn/pnpm

- Bun is the fastest package manager and runtime for Next.js; it is the only
  runtime that installs `node_modules` in under a second for this dependency
  set. The trade-off: occasional ecosystem lag for niche packages, which is
  acceptable for a whitelabel template.
- Instead of a separate lockfile format, `bun.lock` is committed and CI
  installs with `--frozen-lockfile` for deterministic builds.

### Why we chose NeonDB over a local Postgres

- Serverless Postgres over HTTP removes connection-pooling infrastructure.
  The trade-off: cold-start latency on the first query (~100ms), which we
  accepted because client projects are mostly content sites with low write
  volume. The alternative (a managed instance with PgBouncer) was decided
  against because it adds operational burden for no measurable benefit at
  this scale.

### Why we chose TypeScript 7 strict

- `strict: true` is the default here because type errors are the cheapest
  bug class to fix at author time. The reason is simple: an agent that
  cannot typecheck a change leaves broken contracts for the next change.
  Status: accepted.

## Consequences

- Adding a new runtime dependency requires justifying it against the
  whitelabel constraint: the template must stay lean so client projects do
  not inherit unused weight.
- Changing `src/lib/site.ts` schema requires updating layout.tsx, sitemap.ts,
  and the JSON-LD component in the same change (designed to keep the three
  in lockstep).
- The template assumes a single production host. Multi-region or
  multi-tenant deployments are out of scope by design.

## Assumptions that must hold

- `DATABASE_URL` is only used server-side; it is never exposed to the
  client bundle.
- The `proxy.ts` middleware runs on the Edge runtime; it must not import
  server-only modules (assumes that `@/lib/db` stays out of it).
