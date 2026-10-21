# Decisions

## Approved scope and gates

- Follow the approved user brief and plan. This pass implements Phase 1 and Phase 2 only, then stops at Review Gate 1 until the user approves Phase 3. Phase 3 must stop at Review Gate 2 before Phase 4.
- Keep the requested stack and feature boundaries. There is no online payment, checkout, shipping-rate logic, account registration, newsletter, blog, or i18n.
- Work on `dev`; use logical `feat/*` branches merged to `dev`, Conventional Commit messages, and module-sized commits. The platform canonical remote began on `main`; any final checkpoint publication must preserve that main history and only be considered separately after the Phase 2 gate.

## Assets and brand accuracy

- The uploaded files include only the pasted build brief; `VeloreLogo.jpeg` is not present. Do not claim to have extracted or thresholded the logo and do not create a deceptive replacement. Use a clearly labeled temporary mark/wordmark treatment, keep its asset paths swappable, and list the missing client logo as a handoff dependency.
- Public image search surfaced unrelated Velore/Veloré businesses. Their product imagery, marks, claims, reviews, prices and copy are not used.
- The brief expressly allows generated placeholder product art. Use the described SVG bottle silhouette for placeholder products; do not present it as product photography. The approximate flame ribbon is clearly identified in its source comment and is not the true client vector.
- Build the atmospheric hero with CSS/SVG/canvas components specified by the brief; do not use unrelated stock fragrance photography.

## Data, credentials and deployment

- Use external MongoDB Atlas/Mongoose as requested. The managed Webdev MySQL database is disabled and must remain disabled; no Atlas URI or Vercel credentials are available in the current workspace. Keep secrets out of Git, create `.env.example` with placeholders, and make local setup instructions explicit. A missing Atlas DSN must be visible and must not trigger fabricated production data.
- Seeded sample products and reviews are explicitly marked placeholder data. Development may expose a clearly labeled placeholder catalog when the database is unavailable; production must not represent samples as authentic Velore products or reviews.
- Do not invent the WhatsApp phone number, public site origin, prices, delivery details, reviews or business claims. The phone placeholder remains `20XXXXXXXXXX`; absolute canonical, Open Graph and WhatsApp product URLs must only use an explicitly configured public origin.
- Vercel preview is conditional on credentials/access. The build targets `@astrojs/vercel`; absent access, provide the requested local run instructions and review evidence instead of claiming a deployment.

## Runtime and security compatibility

- Use strict Zod validation and allow-listed query construction before MongoDB. Public responses may use the requested shared cache window only when they are visitor-independent; no user-specific/admin response is public-cacheable.
- The brief requests `SameSite=Lax` for its owner cookie. For cross-site HTTPS Preview iframe delivery, follow the Webdev runtime contract and use `SameSite=None; Secure` where needed. Do not derive cookie security settings from `NODE_ENV` or the internal HTTP request scheme. Preserve Lax for ordinary same-site contexts/local HTTP handling where appropriate and document the compatibility decision.
- Keep `X-Frame-Options: DENY` on non-embedded production pages only if it does not break the Preview iframe; Preview must not receive DENY/SAMEORIGIN or a blocking `frame-ancestors` policy.


## External asset-source notes

- Self-hosted font files were retrieved from the Google Fonts CSS endpoint `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Plus+Jakarta+Sans:wght@400;500&display=swap`; the stylesheet points to the corresponding `fonts.gstatic.com` WOFF2 files. The browser does not request Google Fonts at runtime.
- Image search surfaced `https://www.veloreperfumes.com` (page identifies an India-focused brand with prices in rupees and cities such as Delhi) and `https://www.veloreparfumehouse.com` (page identifies founder Herné Van Staden). Neither was confirmed as the Egyptian client `@velo.re15`; both are excluded from the site and no assets/copy were reused.
