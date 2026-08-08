---
title: "App Router with src/ directory layout"
status: accepted
date: 2026-07-01
deciders: SQUAADS engineering
---

## Context

The template needed a directory layout that scales across client projects
(marketing sites, content sites, internal tools) and is unambiguous for AI
agents to navigate.

## Decision

Use Next.js App Router with the `src/` directory: `src/app/` for routes,
`src/components/` for UI, `src/lib/` for data and utilities. Tests live in a
root-level `tests/` directory. Path alias `@/*` maps to `./src/*`.

## Consequences

- Clear dependency direction: app → components → lib; `no-restricted-imports`
  enforces that components/lib never import from `src/app`.
- Agents get a stable mental model of where each change belongs.
- Migration cost is zero: this is the layout from day one of every project.
