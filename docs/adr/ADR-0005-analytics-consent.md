---
title: "Consent-first Google Analytics (GA4)"
status: accepted
date: 2026-07-01
deciders: SQUAADS engineering
---

## Context

Client sites in EU jurisdictions must not load tracking cookies before
consent. A naive gtag embed violates consent rules and gets the template
flagged in every privacy audit.

## Decision

Google Analytics loads only after the visitor accepts cookies, enforced by
`useCookieConsent` (`src/lib/cookies.ts`) and the `Analytics` component. The
client may configure a lawful default through `settings.analytics` from the
admin; `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT=true` remains a legacy fallback.
GA4 is also validated server-side, and event parameters are allowlisted and
sanitized to exclude PII.

## Consequences

- Default posture is GDPR-safe; no tracking before consent.
- Analytics data for users who decline is lost — accepted; the client can
  request the waiver env var in writing.
- Event tracking goes through `trackEvent(name, params)` so consent checks
  are centralized.
