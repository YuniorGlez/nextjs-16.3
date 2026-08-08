---
title: "Bun as package manager and runtime"
status: accepted
date: 2026-07-01
deciders: SQUAADS engineering
---

## Context

npm installs are slow (~30-60s for this dependency set) and pnpm/yarn add
tooling overhead. The template is cloned per client project, so install
speed and CI time are multiplied across every project.

## Decision

Use Bun as the package manager and runtime: `bun.lock` is the committed
lockfile, `bun install --frozen-lockfile` in CI, all scripts run with `bun
run`. Vercel deploys use Bun via `vercel.json`.

## Consequences

- Installs drop to ~2s; CI is significantly faster.
- `bun.lock` is a different lockfile format than `package-lock.json` —
  developers must use Bun, not npm (npm would create a second lockfile).
- Native Bun support in tooling (oxlint, vitest, commitlint via `bunx`) is
  verified to work; this is documented in AGENTS.md.
