---
title: "SEO metadata single source of truth in src/lib/site.ts"
status: accepted
date: 2026-07-01
deciders: SQUAADS engineering
---

## Context

Client projects regularly break SEO by editing metadata in scattered places
(layout.tsx, page.tsx, sitemap.ts, JSON-LD components), producing
inconsistent titles and descriptions that hurt indexation.

## Decision

All site-wide SEO metadata (name, tagline, description, keywords,
production host, org data) lives in `src/lib/site.ts`. Layout, sitemap,
robots, manifest, and JSON-LD components read exclusively from it.

## Consequences

- Whitelabeling a project = editing one file plus assets.
- The three-layer no-index guard (proxy header, robots.txt, metadata) is
  driven from `siteConfig.productionHost`, so it cannot drift.
- Adding a metadata field requires touching `site.ts` and its consumers in
  the same change (documented as an invariant in docs/design/design.md).
