# MoonGift Production Security Review

## Scope

This review covers the Next.js application, public and admin API routes, Supabase access patterns, RLS policies, environment validation, logging, monitoring hooks, and production-readiness gaps addressed in this hardening pass.

## Implemented Controls

- Added centralized API error handling with structured error responses.
- Added structured application logging with configurable `LOG_LEVEL`.
- Added monitoring hooks through `captureEvent` and optional `MONITORING_WEBHOOK_URL`.
- Added in-memory rate limiting to all unauthenticated public APIs:
  - `/api/quotes`
  - `/api/advisor`
- Added Cloudflare Turnstile CAPTCHA verification for quote requests.
- Added stricter Zod validation for public and admin API payloads and UUID route parameters.
- Changed public quote creation to use the SSR anon Supabase client so RLS is exercised instead of bypassed by the service-role client.
- Added production environment validation for required server-side secrets.
- Added browser security headers through Next.js headers configuration.
- Audited and documented RLS intent in `supabase/schema.sql`.
- Added database integrity constraints and indexes for common CRM access patterns.

## RLS Audit Summary

| Table | Intended Access | Current Policy Posture |
| --- | --- | --- |
| `profiles` | Self-read; admin read/write | Acceptable for MVP/admin CRM |
| `products` | Public read for active products; admin mutate | Acceptable |
| `leads` | Public insert only; admin read/update | Hardened to anon/authenticated insert policy |
| `quotes` | Admin only | Acceptable |
| `quote_items` | Admin only | Acceptable |
| `activity_logs` | Admin read/insert | Acceptable; no update/delete policies |

## Remaining Recommendations

- Replace in-memory rate limiting with Redis/Upstash or platform edge rate limits for horizontal scaling.
- Add CSRF Origin checks for authenticated mutating routes.
- Add E2E and RLS regression tests in CI.
- Add immutable audit logging via database triggers for all sensitive table mutations.
- Add tenant-scoped organizations and memberships before launching as multi-tenant SaaS.
- Add centralized secret management and rotation playbooks.
- Add dependency/security scanning to CI.
