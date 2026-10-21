# Velore Fragrance Storefront & Admin — Plan

## Scope and delivery boundary

Build the requested English-only Velore storefront and owner-only admin in the specified stack. Orders are inquiries sent to WhatsApp; there is no checkout, payment, shipping-rate logic, customer account system, newsletter, blog, or localization. Delivery information remains editable text in `SiteSettings`. Store EGP as whole-pound integers. The owner account is configured only through environment variables; there is no `AdminUser` collection.

Work in four phases and keep the user’s review gates binding. Phases 1 (Foundation) and 2 (Storefront) are complete and Review Gate 1 was approved. This active implementation covers Phase 3 (Admin) and must stop at Review Gate 2 with the requested evidence; do not begin Phase 4 until the user explicitly approves that gate. Use Conventional Commits, one logical module per commit, on `dev` with `feat/*` branches merged into `dev`; run `pnpm typecheck && pnpm lint && pnpm build` after each phase and fix failures before proceeding.

## Implementation approach

Use Astro 5 in server output mode with `@astrojs/vercel` as the requested deployment adapter, `@astrojs/react` islands and `@astrojs/tailwind` with Tailwind 3.4. Prerender `/`, `/about`, `/contact`, `/delivery`, and `/404`; use request-time rendering for product/catalog content and APIs where MongoDB data is needed. Keep public pages content-bearing in the initial HTML for search indexing, and hydrate only interactive regions (`client:visible` by default; `client:load` only for above-the-fold interaction). Make `PUBLIC_SITE_URL` the sole source of canonical/social absolute URLs; do not derive them from internal Preview request hosts.

Use strict TypeScript, `@/*` for `src/*`, shared `.strict()` Zod schemas, and `z.infer` types. Keep route handlers thin and put product/category/settings behavior in services. All database filters must be built from validated allow-listed values; never pass request query/body objects directly into MongoDB. Use a cached Mongoose connection singleton suitable for serverless execution. The site uses the explicitly supplied MongoDB Atlas DSN at runtime, outside source control. If the DSN is missing or temporarily unreachable, setup and build checks must remain possible and the preview must make missing database configuration/data obvious rather than silently presenting fabricated production facts. Seeded demonstration catalog entries and testimonials remain clearly marked placeholders.

Build the inquiry list as a persistent Nanostores client store with guarded localStorage access. A shared WhatsApp message builder will produce the specified, URL-encoded `wa.me` message for a single item or the drawer’s multiple-item list. Prefer `SiteSettings.whatsappNumber` over `PUBLIC_WHATSAPP_NUMBER`; never invent a number and show the specified development warning if neither is configured. Product inquiry records are not stored in MongoDB.

The first two phases produce the public APIs, visual storefront, placeholder-safe catalog/product/discovery pages, static pages and WhatsApp flow. Keep the security, SEO, performance and accessibility behaviors in scope across their planned phases. Phase 3 will add the explicitly requested env-based owner login, JWT middleware, Mongo-backed login attempt rate limit, Origin checks, CRUD interfaces, optimistic TanStack Query updates, settings and placeholder checklist. Phase 4 will finish the security headers, CSP, caching, sitemap/robots/JSON-LD, tests, performance tuning and final documentation. No secret values belong in files or commits.

### Data and API boundaries

Create Mongoose models and matching Zod schemas for `Product`, `Category`, `SiteSettings` and `LoginAttempt`. Products include their requested slug/name/tagline/description, category references, gender, concentration, notes pyramid, accords, longevity/sillage, seasons/occasions, variants, image metadata, badges, product type, discovery-set inclusions, status, featured/placeholder flags, SEO and timestamps. Add the unique slug index, the status/gender/category compound index, and text index on name and notes. Validate at least one variant, exactly one primary image when images exist, and required included product IDs for discovery sets. Category deletion must be refused when products reference it. Use a fixed singleton key for settings and a TTL index on `LoginAttempt.expiresAt` with 15-minute expiry.

Keep the public API envelope `{ ok: true, data } | { ok: false, error: { code, message, fields? } }`. Public product listing returns published products only and accepts only the documented filters and sort values (`featured`, `newest`, `price-asc`, `price-desc`), pagination and search fields. Public product detail includes related items; categories are returned as a tree; public settings reveal only non-sensitive fields. Later admin APIs are protected by middleware. Add `Cache-Control: s-maxage=60, stale-while-revalidate=300` to public API/SSR responses that are safe to cache.

## Project structure

```text
velore/
├── astro.config.mjs                 # Astro 5 SSR + Vercel adapter, React, Tailwind
├── tailwind.config.ts               # Velore tokens
├── tsconfig.json                    # strict mode and @/* alias
├── package.json / pnpm-lock.yaml    # pinned pnpm toolchain and scripts
├── .env.example                     # names only; no credentials
├── README.md / DECISIONS.md / TODO.md
├── plan.md
├── assets-source/                   # original client logo, when supplied; never served
├── public/
│   ├── brand/                       # temporary logo/icon/OG assets where source is available
│   ├── fonts/                       # self-hosted woff2 fonts
│   ├── robots.txt / sitemap.xml     # search directives/documents
│   └── manus-routes.json            # complete current page route manifest
├── scripts/                         # seed.ts, create-admin.ts
└── src/
    ├── env.d.ts / middleware.ts
    ├── styles/global.css
    ├── layouts/                     # BaseLayout, StoreLayout, AdminLayout
    ├── pages/                       # public Astro routes and API routes
    │   ├── index.astro
    │   ├── shop/index.astro / shop/[category].astro
    │   ├── product/[slug].astro / discovery-sets.astro
    │   ├── about.astro / contact.astro / delivery.astro / 404.astro
    │   ├── admin/                   # Phase 3 only; SSR and noindex
    │   └── api/                     # public product/category/settings; admin later
    ├── components/
    │   ├── astro/                   # layouts, logo, cards, headings, placeholders, SEO
    │   ├── react/                   # hero, catalog, PDP, inquiry, social, admin later
    │   └── ui/{reactbits,aceternity}/ # only adapted components actually used
    ├── hooks/                       # reduced motion, debounce, product hooks
    ├── lib/
    │   ├── db/{connect.ts,models/}
    │   ├── schemas/ / services/ / auth/ / stores/
    │   ├── whatsapp.ts / format.ts / api-client.ts / rate-limit.ts
    ├── types/
    └── test/                        # Vitest; Playwright critical flows
```

Keep source organized by route and concern. React islands own only browser interaction; Astro owns page composition, semantic HTML, initial content and metadata. UI library code will be vendored only when used and recolored to the brand tokens.

## Design plan

**Design movement:** restrained contemporary perfumery editorial, using the user’s Cozy Fragrances / Lail Fragrances references as directional inspiration without copying their assets or content.

**Core principles:** dark-first contrast; gold used sparingly; editorial whitespace; fragrance information presented clearly before decoration.

**Color philosophy:** obsidian gives the storefront a quiet, gallery-like ground; warm ivory keeps reading comfortable; champagne gold signals craft and action without becoming a body-text color. Use `#0B0B0B`, `#141414`, `#1C1C1C`, `#262626`, `#F5F2EB`, `#CFCAC0`, `#C5A059`, `#D4AF37`, and `#8E7340` exactly as specified. Reserve gold sheen for large display elements and primary actions.

**Layout paradigm:** a cinematic, open hero and editorially paced home sections, followed by the explicitly requested four-column desktop/two-column mobile catalog with hairline separators. Product information uses generous vertical spacing and consistent hierarchy; small screens prioritize the scent, available size, price and WhatsApp action.

**Signature elements:** tracked section labels between two gold hairlines; an approximate flame-ribbon S-curve that is clearly commented as temporary; simple bottle silhouettes with obsidian-to-gold shading for placeholder product art.

**Interaction philosophy:** restrained, direct interactions that clarify fragrance choice and inquiry status. Filters are keyboard-accessible and reflected in the URL; the selected size and price are immediately visible; inquiry changes have clear counts and totals. Avoid unnecessary movement.

**Animation:** use Framer Motion and the requested ReactBits/Aceternity motifs selectively. Animate only `transform` and `opacity`; honor `prefers-reduced-motion` with a shared hook. Keep canvas particles lazy and capped, and disable them when reduced motion is requested. Use subtle entrance/reveal transitions for the flame path, headline, and notes pyramid.

**Typography system:** self-host Cormorant Garamond for light/regular editorial headings and Plus Jakarta Sans for body, controls, and tracked uppercase labels. Preload primary weights and use `font-display: swap`.

**Brand essence:** exclusive local fragrance discovery for customers in Egypt, expressed through an editorial storefront and WhatsApp-led ordering. Personality: composed, sensorial, considered.

**Brand voice:** concise, specific and understated. Primary CTA: “Discover the Collection”. Supporting prompt: “Find your scent”. Do not add unsupported ingredient, longevity, origin, customer-review or delivery claims.

**Wordmark and logo:** the supplied brief describes a champagne-gold serif V crossed by a flame/ribbon above a widely tracked VELORE wordmark and EAU DE PARFUM line. The user supplied `VeloreLogo.jpeg`; it is preserved unchanged in `assets-source/` and used to generate temporary transparent PNG variants, including the monogram favicon/apple touch/OG assets. Keep one swappable path constant. The README must state: “Logo assets are temporary raster extractions. Replace with client-supplied SVG files.” Replace those raster variants with client-supplied SVG assets for production when available.

**Signature brand color:** champagne gold `#C5A059`, supported by the requested brighter and muted shades.

## Commit-sized modules and review gates

**Phase 1 — Foundation:** initialize Git and branch workflow; scaffold the exact Astro/React/Tailwind/strict-TypeScript toolchain; create tokens/fonts/global styles; preserve the supplied original logo and generate temporary raster variants for the Logo component; build base/store layouts, header, footer and SEO components; add Mongoose singleton/models; add Zod schemas; add idempotent seed/settings; create PlaceholderBottle. Use the requested module-sized Conventional Commits. Clearly document that the PNG assets are temporary raster extractions and the original JPEG is preserved unchanged.

**Phase 2 — Storefront:** build public product/category/settings APIs; implement cinematic home hero and its FlameDraw/SplitTextReveal/GoldParticles components; add featured collection, family tiles, marked sample testimonials and story; implement URL-synced catalog filters; add PDP buy box, volume toggle, notes pyramid, longevity/sillage/accords and gallery; add JSON-LD, related items and sticky mobile action; implement inquiry store, accessible drawer and WhatsApp message builder; add discovery sets; finish About, Contact, Delivery and 404. After validating Phase 1 and 2, stop at Review Gate 1. Supply run instructions and the requested screenshots/evidence, and wait for explicit approval before Phase 3.

**Phase 3 — Admin (only after Gate 1 approval):** implement env-based owner login and session, middleware guard, login-attempt TTL rate limiting and Origin checks; dashboard overview and placeholder-content checklist; product table and editor; category manager/reordering; site settings; TanStack Query optimistic updates with rollback, toast and invalidation. Stop at Review Gate 2 with requested screenshots and a written walkthrough; wait for approval before Phase 4.

**Phase 4 — Polish and release (only after Gate 2 approval):** image handling, lazy hydration and caching; remaining security headers/CSP/Origin checks; SEO metadata, sitemap, robots and structured data; Vitest and Playwright coverage; final setup/deployment/admin documentation and `DECISIONS.md`. Vercel commercial launch instructions must state that a Pro plan or client-owned team is required.

## Known constraints and decisions to record

- The user supplied `VeloreLogo.jpeg`; it is preserved in `assets-source/` and its temporary raster outputs are generated. A client-provided SVG replacement remains a production handoff item.
- The image search returned visually similar but unrelated Velore/Veloré businesses; none are adopted. Do not use their product photography, marks, prices, reviews or copy.
- MongoDB Atlas credentials were supplied through protected project input, but the first seed attempt did not complete because of a TLS/transport handshake failure; the database may be partially seeded and the idempotent script should be retried after connectivity is resolved. Vercel access has not been supplied. Keep values out of Git, maintain a complete `.env.example`, and provide setup/deployment instructions; do not claim a Vercel preview without access.
- Generated seed products and all images/testimonials remain explicit placeholders. Public production output must not imply they are real catalog facts or reviews.
- For embedded HTTPS Preview, follow the web development runtime contract: use a Secure cookie eligible for cross-site iframe requests (`SameSite=None`) where required, without deriving security attributes from `NODE_ENV` or the internal HTTP request scheme; keep normal same-site behavior and local plain-HTTP handling separate. Document this compatibility choice alongside the user brief’s requested `SameSite=Lax` behavior.
