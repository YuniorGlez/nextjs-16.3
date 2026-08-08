# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities privately via **GitHub Security Advisories**:

1. Open the repository → **Security** tab → **Report a vulnerability**.
2. Describe the issue, the affected version, and a minimal reproduction.

Do **not** open public issues for security problems.

We aim to acknowledge reports within 48 hours and to ship a fix as soon as a
reproduction is confirmed.

## Dependency scanning

- Dependabot runs weekly (see `.github/dependabot.yml`).
- `bun audit` runs on every CI run (see `.github/workflows/ci.yml`).

## Scope

This repository is a whitelabel base template. Projects generated from it
inherit this policy; production deployments should maintain their own
reporting channels.
