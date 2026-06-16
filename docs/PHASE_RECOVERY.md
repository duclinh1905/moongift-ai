PHASE_RECOVERY.md
Scope
Comparison target:

Base: origin/main

Source: work

This recovery document inventories every file added in work but not present in origin/main, then provides a ranked recovery plan for rebuilding the implementation without relying on downloadable archives, patch files, or generated code.

Added File Inventory
Phase 4 CMS SEO
File path	Phase	Complete source code size estimate	Dependencies	Can be recreated independently?
app/(dashboard)/dashboard/cms/page.tsx	Phase 4 CMS SEO	~977 bytes	components/crm/cms-manager, lib/cms-admin, lib/supabase/server, dashboard auth/layout	No — depends on CMS manager, CMS type registry, Supabase client, and CMS schema tables.
app/api/cms/[type]/route.ts	Phase 4 CMS SEO	~1.4 KB	lib/api, lib/auth, lib/cms-admin, lib/supabase/admin	No — depends on centralized API helpers, auth helpers, CMS type registry, and admin Supabase client.
app/api/cms/[type]/[id]/route.ts	Phase 4 CMS SEO	~1.9 KB	lib/api, lib/auth, lib/cms-admin, lib/schema, lib/supabase/admin	No — depends on API helpers, role checks, UUID validation, and CMS schema.
app/blog/page.tsx	Phase 4 CMS SEO	~915 bytes	components/landing/site-header, components/ui/card, lib/cms	Partially — can be recreated with fallback CMS data, but requires lib/cms for runtime content.
app/blog/[slug]/page.tsx	Phase 4 CMS SEO	~2.2 KB	components/landing/site-header, lib/cms, lib/env, Next metadata APIs	No — depends on CMS blog helpers and site URL env helper.
app/blog/category/[category]/page.tsx	Phase 4 CMS SEO	~1.8 KB	components/landing/site-header, components/ui/card, lib/cms, lib/seo	No — depends on blog CMS data and SEO metadata helper.
app/blog/tag/[tag]/page.tsx	Phase 4 CMS SEO	~1.7 KB	components/landing/site-header, components/ui/card, lib/cms, lib/seo	No — depends on blog CMS data and SEO metadata helper.
app/case-studies/page.tsx	Phase 4 CMS SEO	~936 bytes	components/landing/site-header, components/ui/card, lib/cms	Partially — page structure is simple, but runtime content requires lib/cms.
app/case-studies/[slug]/page.tsx	Phase 4 CMS SEO	~2.2 KB	components/landing/site-header, lib/cms, lib/env, Next metadata APIs	No — depends on CMS case study helpers and site URL env helper.
app/collections/page.tsx	Phase 4 CMS SEO	~1.4 KB	components/landing/site-header, components/ui/card, lib/cms, lib/seo	No — depends on collection CMS helpers and SEO helpers.
app/collections/[slug]/page.tsx	Phase 4 CMS SEO	~2.5 KB	components/landing/site-header, components/ui/button, components/ui/card, lib/cms, lib/seo, lib/utils	No — depends on collections, products, currency helper, and SEO helpers.
app/industries/page.tsx	Phase 4 CMS SEO	~841 bytes	components/landing/site-header, components/ui/card, lib/cms	Partially — page structure is simple, but industry landing data requires lib/cms.
app/industries/[slug]/page.tsx	Phase 4 CMS SEO	~2.2 KB	components/landing/site-header, components/ui/button, lib/cms, lib/env, Next metadata APIs	No — depends on CMS landing page helpers and site URL env helper.
app/products/[slug]/page.tsx	Phase 4 CMS SEO	~4.2 KB	components/ui/button, components/ui/card, lib/cms, lib/env, lib/utils, Next metadata APIs	No — depends on product CMS helpers, site URL helper, and currency formatting.
components/crm/cms-manager.tsx	Phase 4 CMS SEO	~13.1 KB	components/ui/button, components/ui/input, components/ui/textarea, lib/cms-admin, browser fetch to CMS APIs	No — depends on UI primitives, CMS type registry, and CMS API routes.
lib/cms-admin.ts	Phase 4 CMS SEO	~782 bytes	None beyond TypeScript runtime	Yes — standalone CMS type registry and labels.
lib/cms.ts	Phase 4 CMS SEO	~9.4 KB	lib/supabase/server, lib/products	No — core CMS data layer depends on Supabase server client and legacy product fallback data.
lib/seo.tsx	Phase 4 CMS SEO	~1.9 KB	next metadata types, lib/env, React/JSX runtime	Partially — helper is mostly standalone but depends on site URL env helper and JSX support.
Phase 5 Personalization Engine
File path	Phase	Complete source code size estimate	Dependencies	Can be recreated independently?
lib/configuration.ts	Phase 5 Personalization	~1.9 KB	None beyond TypeScript runtime	Yes — pricing and personalization constants/calculation logic are standalone.
components/forms/send-quote-button.tsx	Phase 5 Personalization	~1.3 KB	components/ui/button, browser fetch, quote send API route	No — depends on quote send endpoint and UI button primitive.
app/api/quotes/[id]/send/route.ts	Phase 5 Personalization	~3.8 KB	lib/api, lib/auth, lib/email, lib/quote-pdf, lib/schema, lib/supabase/admin, lib/activity	No — depends on quote PDF generation, email delivery, auth, API helpers, Supabase admin, and activity logging.
lib/email.ts	Phase 5 Personalization	~1.2 KB	lib/env, lib/logger	Partially — can be recreated independently after env/logger helpers exist.
lib/quote-pdf.ts	Phase 5 Personalization	~2.3 KB	Quote/line item data shape, Web/Node byte encoding APIs	Partially — standalone PDF byte builder, but useful only with quote send workflow.
Phase 6 Operations
File path	Phase	Complete source code size estimate	Dependencies	Can be recreated independently?
app/(dashboard)/dashboard/operations/page.tsx	Phase 6 Operations	~3.3 KB	components/operations/operations-console, components/ui/card, lib/supabase/server	No — depends on operations console, Supabase operations tables, and dashboard shell.
app/api/operations/route.ts	Phase 6 Operations	~9.1 KB	zod, lib/api, lib/auth, lib/activity, lib/operations, lib/supabase/admin	No — depends on API helpers, role checks, activity logging, operation constants, and operations schema.
components/operations/operations-console.tsx	Phase 6 Operations	~8.1 KB	components/ui/button, components/ui/input, components/ui/textarea, lib/operations, operations API route	No — depends on UI primitives, operations constants, and operations API route.
lib/operations.ts	Phase 6 Operations	~849 bytes	None beyond TypeScript runtime	Yes — standalone operations status/type constants and formatter.
Shared CRM, Security, API, Monitoring, and Repository Support
File path	Phase	Complete source code size estimate	Dependencies	Can be recreated independently?
PHASE_STATUS.md	Shared Phase 4–6 Documentation	~15.1 KB	Repository audit context	Yes — documentation only.
changes-6c8d854-422c63b.patch	Shared Export Artifact	~273.1 KB	Git patch generation output	Yes — artifact only; should not be recreated as application source.
components/crm/pipeline-board.tsx	Shared CRM Workflow	~4.1 KB	components/ui/button, browser drag/drop or click interactions, leads API route	No — depends on CRM lead status update route and UI button primitive.
docs-security-review.md	Shared Security Documentation	~2.3 KB	Repository security audit context	Yes — documentation only.
eslint.config.mjs	Shared Tooling	~421 bytes	ESLint, Next.js ESLint config	Yes — standalone tooling config.
lib/api.ts	Shared API Hardening	~2.4 KB	next/server, zod, lib/logger, lib/monitoring	No — foundational helper depends on logger and monitoring helpers.
lib/captcha.ts	Shared Public API Security	~1.5 KB	lib/env, lib/logger, Cloudflare Turnstile API	Partially — can be recreated once env/logger exist.
lib/crm.ts	Shared CRM Workflow	~547 bytes	None beyond TypeScript runtime	Yes — standalone CRM status constants/labels.
lib/logger.ts	Shared Observability	~1.4 KB	lib/env	Partially — depends on env helper for log level.
lib/monitoring.ts	Shared Observability	~854 bytes	lib/env, lib/logger	No — depends on env and logger helpers.
lib/rate-limit.ts	Shared API Security	~1.6 KB	Runtime memory store / standard JS APIs	Yes — standalone in-memory rate limiter.
lib/roles.ts	Shared Role-Based Access	~539 bytes	None beyond TypeScript runtime	Yes — standalone role constants and role hierarchy helper.
Recovery Plan
Phase 4 CMS SEO
Implementation Order
lib/cms-admin.ts

Establish CMS type registry and labels.

Required before CMS manager and CMS API routes.

lib/cms.ts

Rebuild CMS data layer, types, fallback content, and fetch helpers.

Required before public CMS pages, sitemap, homepage, and product pages.

lib/seo.tsx

Rebuild shared SEO helpers.

Required before collections, blog archives, and any standardized metadata/schema work.

app/api/cms/[type]/route.ts

Rebuild CMS create/list API route.

Requires lib/api, lib/auth, lib/cms-admin, and admin Supabase helper to exist.

app/api/cms/[type]/[id]/route.ts

Rebuild CMS update/delete API route.

Requires CMS type registry, route param validation, auth, and admin Supabase helper.

components/crm/cms-manager.tsx

Rebuild CMS admin form UI.

Requires CMS APIs, CMS type registry, and UI primitives.

app/(dashboard)/dashboard/cms/page.tsx

Rebuild dashboard CMS entry page.

Requires CMS manager and CMS type registry.

app/products/[slug]/page.tsx

Rebuild product detail pages.

Requires product CMS helper, metadata helpers, currency helper, and UI primitives.

app/blog/page.tsx

Rebuild public blog index.

Requires blog CMS helper and card/header components.

app/blog/[slug]/page.tsx

Rebuild blog article detail pages.

Requires blog CMS helper, metadata generation, and JSON-LD support.

app/blog/category/[category]/page.tsx

Rebuild blog category archive pages.

Requires blog CMS helper and SEO helper.

app/blog/tag/[tag]/page.tsx

Rebuild blog tag archive pages.

Requires blog CMS helper and SEO helper.

app/case-studies/page.tsx

Rebuild case study listing page.

Requires case study CMS helper.

app/case-studies/[slug]/page.tsx

Rebuild case study detail pages.

Requires case study CMS helper and metadata generation.

app/collections/page.tsx

Rebuild collection listing page.

Requires collection CMS helper and SEO helper.

app/collections/[slug]/page.tsx

Rebuild collection detail pages.

Requires collection/product CMS helpers, SEO helper, and currency helper.

app/industries/page.tsx

Rebuild industry landing index.

Requires landing page CMS helper.

app/industries/[slug]/page.tsx

Rebuild industry landing pages.

Requires landing page CMS helper and FAQ schema support.

app/page.tsx

Rebuild homepage redesign.

Should happen after CMS helpers and public CMS routes exist.

components/landing/site-header.tsx

Add public navigation links after public routes are restored.

app/sitemap.ts

Rebuild dynamic sitemap after all public CMS route helpers exist.

app/robots.ts

Rebuild robots rules after final public/private route surface is known.

supabase/schema.sql

Restore CMS tables, CMS columns, RLS policies, indexes, and seed CMS content.

Must be applied before runtime CMS features are usable.

Phase 5 Personalization
Implementation Order
lib/configuration.ts

Rebuild pricing constants and configured pricing calculator.

This is the standalone core of the personalization engine.

supabase/schema.sql

Restore product variant, personalization option, packaging option, pricing rule tables, and quote item configuration/cost columns.

lib/schema.ts

Restore validation for configured quote item payloads.

components/forms/quote-builder.tsx

Rebuild UI for product variants, packaging, personalization, messages, and configured pricing.

app/api/quotes/[id]/items/route.ts

Rebuild configured quote item creation and cost/margin calculations.

app/(dashboard)/dashboard/quotes/[id]/page.tsx

Reconnect quote builder, personalization/packaging data, and quote detail display.

app/(dashboard)/dashboard/revenue/page.tsx

Restore personalization revenue, packaging revenue, average order value, and gross margin analytics.

lib/quote-pdf.ts

Rebuild quote PDF byte generation.

lib/email.ts

Rebuild quote email webhook sender.

app/api/quotes/[id]/send/route.ts

Rebuild quote delivery endpoint using PDF generation, storage metadata, email delivery, and activity logging.

components/forms/send-quote-button.tsx

Rebuild dashboard trigger for quote send workflow.

supabase/schema.sql

Restore quote sent metadata fields and quote PDF storage bucket setup if not already applied.

Phase 6 Operations
Implementation Order
lib/operations.ts

Rebuild approval, production, delivery, and supplier status constants.

This is standalone and should be first.

supabase/schema.sql

Restore operations tables:

artwork_assets

approval_requests

suppliers

production_jobs

recipients

shipments

shipment_events

supplier_performance

Restore RLS policies, indexes, enum types, and seed suppliers.

supabase/activity_logs.sql

Restore expanded activity entity support for operations events.

lib/activity.ts

Restore TypeScript entity types for artwork, approval, production, delivery, supplier, and recipient events.

app/api/operations/route.ts

Rebuild secured operations API endpoint for artwork, approvals, production, recipient imports, shipments, suppliers, and supplier performance.

components/operations/operations-console.tsx

Rebuild operations console forms.

Requires operations API and operations constants.

app/(dashboard)/dashboard/operations/page.tsx

Rebuild operations dashboard page and executive metrics.

Requires operations tables and operations console.

app/(dashboard)/dashboard/layout.tsx

Restore Operations navigation entry after the page exists.

app/(dashboard)/dashboard/leads/[id]/page.tsx

Restore expanded timeline display if operations events should appear in lead context.

Shared Foundation Recovery Order
These files support multiple phases and should be restored before phase-specific API/UI code that depends on them.

lib/roles.ts

Role constants and hierarchy.

lib/env.ts

Environment validation and required server/public variables.

lib/logger.ts

Structured logging.

lib/monitoring.ts

Monitoring event capture.

lib/api.ts

Centralized API error handling, validation, trusted-origin checks, and response helpers.

lib/rate-limit.ts

Public/API rate limiting helper.

lib/captcha.ts

CAPTCHA verification for public quote requests.

lib/auth.ts

Staff/CRM role auth helpers.

middleware.ts

Dashboard access enforcement.

next.config.ts

Security headers.

app/api/quotes/route.ts

Restore hardened public quote request creation.

app/api/advisor/route.ts

Restore hardened advisor endpoint.

app/api/leads/[id]/route.ts

Restore hardened lead update endpoint.

app/api/leads/[id]/quote/route.ts

Restore lead-to-quote generation endpoint.

app/api/quotes/[id]/route.ts

Restore quote update endpoint.

lib/crm.ts

CRM statuses and labels.

components/crm/pipeline-board.tsx

Sales pipeline board.

app/(dashboard)/dashboard/pipeline/page.tsx

Pipeline dashboard page.

components/forms/lead-status-form.tsx

Lead status update form.

app/(dashboard)/dashboard/quotes/page.tsx

Quote list updates.

docs-security-review.md

Security documentation.

eslint.config.mjs

Lint tooling.

package.json

Dependency/script definitions.

package-lock.json

Locked dependency graph.

Files That Should Not Be Recovered as Application Source
File path	Reason
changes-6c8d854-422c63b.patch	Generated export artifact, not application source. Do not recreate unless specifically exporting changes again.
PHASE_STATUS.md	Documentation only. Useful for planning, but not required for runtime.
docs-security-review.md	Documentation only. Useful for operational/security review, but not required for runtime.
Recommended Full Recovery Sequence
Restore shared foundation:

lib/roles.ts

lib/env.ts

lib/logger.ts

lib/monitoring.ts

lib/api.ts

lib/rate-limit.ts

lib/captcha.ts

lib/auth.ts

middleware.ts

next.config.ts

package.json

package-lock.json

eslint.config.mjs

Restore database foundation:

supabase/schema.sql

supabase/activity_logs.sql

Restore Phase 4 CMS SEO data and admin:

lib/cms-admin.ts

lib/cms.ts

lib/seo.tsx

app/api/cms/[type]/route.ts

app/api/cms/[type]/[id]/route.ts

components/crm/cms-manager.tsx

app/(dashboard)/dashboard/cms/page.tsx

Restore Phase 4 public growth pages:

app/products/[slug]/page.tsx

app/blog/page.tsx

app/blog/[slug]/page.tsx

app/blog/category/[category]/page.tsx

app/blog/tag/[tag]/page.tsx

app/case-studies/page.tsx

app/case-studies/[slug]/page.tsx

app/collections/page.tsx

app/collections/[slug]/page.tsx

app/industries/page.tsx

app/industries/[slug]/page.tsx

app/page.tsx

components/landing/site-header.tsx

app/sitemap.ts

app/robots.ts

Restore Phase 5 personalization engine:

lib/configuration.ts

lib/schema.ts

components/forms/quote-builder.tsx

app/api/quotes/[id]/items/route.ts

app/(dashboard)/dashboard/quotes/[id]/page.tsx

app/(dashboard)/dashboard/revenue/page.tsx

Restore Phase 5 quote delivery:

lib/quote-pdf.ts

lib/email.ts

app/api/quotes/[id]/send/route.ts

components/forms/send-quote-button.tsx

Restore Phase 6 operations:

lib/operations.ts

lib/activity.ts

app/api/operations/route.ts

components/operations/operations-console.tsx

app/(dashboard)/dashboard/operations/page.tsx

Restore shared CRM workflow updates:

lib/crm.ts

components/crm/pipeline-board.tsx

app/(dashboard)/dashboard/pipeline/page.tsx

components/forms/lead-status-form.tsx

app/(dashboard)/dashboard/leads/[id]/page.tsx

app/(dashboard)/dashboard/quotes/page.tsx

app/(dashboard)/dashboard/layout.tsx

Restore hardened API routes:

app/api/quotes/route.ts

app/api/quotes/[id]/route.ts

app/api/leads/[id]/route.ts

app/api/leads/[id]/quote/route.ts

app/api/advisor/route.ts

Restore documentation:

PHASE_STATUS.md

docs-security-review.md

Do not restore generated export artifact unless explicitly needed:

changes-6c8d854-422c63b.patch