---
title: "NeonDB serverless Postgres for the data layer"
status: accepted
date: 2026-07-01
deciders: SQUAADS engineering
---

## Context

Client projects need a database without operational burden. A traditional
managed Postgres requires connection pooling, backups, and VPC wiring for
serverless runtimes.

## Decision

Use NeonDB (serverless Postgres over HTTP) via `@neondatabase/serverless`
with a `sql` tagged template helper in `src/lib/db.ts`. No ORM, no
connection pool management.

## Consequences

- Zero infrastructure: the `DATABASE_URL` connection string is the only
  configuration.
- First-query cold start (~100ms) is accepted as a trade-off; fine for
  content-heavy client sites.
- SQL is written by hand through the tagged template — safer against
  injection than string concatenation, but derived projects must never
  interpolate user input unsanitized.
