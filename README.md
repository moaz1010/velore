# Velore Fragrance Storefront & Admin

An English-only luxury fragrance storefront for Velore in Egypt. Customer orders are inquiries sent through WhatsApp; this project intentionally has no online payment, checkout, shipping-rate logic, customer accounts, newsletter, blog or i18n.

## Status

This is the approved Phase 1 + Phase 2 implementation. Work stops at Review Gate 1; the admin dashboard is not implemented until the user approves that gate. Product records, product art and testimonials are placeholders until the client supplies real catalog and review data. The referenced `VeloreLogo.jpeg` was not present in this session’s uploads, so the temporary mark is not an extraction from the original brand file.

**Logo assets are temporary raster extractions. Replace with client-supplied SVG files.** The current workspace did not contain the source JPEG; this note remains the required handoff guidance and the missing source is called out in `DECISIONS.md`.

## Requirements

- Node.js 22 or later
- pnpm 11.25.0 (`packageManager` is pinned)
- MongoDB Atlas M0 connection string for live product/category/settings data

## Local development

```sh
pnpm install
cp .env.example .env
# Set MONGODB_URI and PUBLIC_SITE_URL only when those values are available.
pnpm dev
```

The development server listens on `http://localhost:3000`. Without `MONGODB_URI`, data-backed features show a visible setup/demo state; they must not imply that seeded placeholder products are genuine Velore products. To seed the configured Atlas database after setting its DSN, run:

```sh
pnpm seed
```

At Review Gate 1, run `pnpm typecheck`, `pnpm lint`, and `pnpm build` after changes. The Vitest and Playwright dependencies are prepared, but test files and `scripts/create-admin.ts` are deferred to Phases 3–4 and are not yet available.

## Environment variables

| Name | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. Use a strong, least-privilege database user scoped to the Velore database. |
| `JWT_SECRET` | Secret for the owner’s later admin session implementation. |
| `ADMIN_EMAIL` | Single owner email for the later admin implementation. |
| `ADMIN_PASSWORD_HASH` | Owner password hash for the later admin implementation; its setup utility is deferred until Phase 3 is approved. |
| `PUBLIC_SITE_URL` | Explicit public origin used for canonical metadata and absolute product URLs. Do not guess it. |
| `PUBLIC_WHATSAPP_NUMBER` | Digits-only international number with country code; placeholder is `20XXXXXXXXXX`. Do not use the placeholder to send orders. |
| `PUBLIC_INSTAGRAM_HANDLE` | Public Instagram handle; default placeholder is `velo.re15`. |

Never commit `.env` or real credentials. `.env.example` contains names and safe placeholders only.

## Seed/catalog placeholders

The idempotent seed script defines five fragrance families, eight clearly named placeholder products and one discovery set, with every seeded record flagged `isPlaceholder: true`. It has not been run against Atlas because no connection string was available in this session. Placeholder reviews display as “Sample review” in development and are not presented as real in production. Before launch, replace sample products, images, notes, prices, reviews, the missing logo, and approximate flame path with client-approved materials; configure the real WhatsApp number and public origin. No customer order inquiries are stored in MongoDB.

## Deployment

The Astro build uses `@astrojs/vercel` and the app needs serverless SSR plus MongoDB Atlas runtime access. Configure the environment variables in the deployment environment; never bake secrets into a build or source file. Vercel Hobby is restricted to non-commercial use. A commercial client launch needs Vercel Pro or a client-owned team. No Vercel preview is claimed until deployment access and credentials are available.

The Atlas network rule may need `0.0.0.0/0` for Vercel’s dynamic egress IPs. Restrict the database user to the Velore database with least privilege and use a strong generated password. A MongoDB Atlas DSN is required at runtime.

## Scope and handoff

See `TODO.md` for the phased outcome checklist and review gates and `DECISIONS.md` for non-obvious decisions. Phase 3 (admin) and Phase 4 (security/SEO/test/release polish) are blocked until their respective user approvals. Final launch dependencies include real product photography, client SVG/logo source, true flame vector, real reviews, real WhatsApp number, verified prices/notes and a configured production origin.
