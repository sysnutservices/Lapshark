# Lapshark Local SEO + Conversion — Implementation Plan

Audit date: 2026-09-11. Scope: `Lapshark` frontend repo (Next.js). `lapshark_backend`
touched only where a frontend change requires it (analytics event allowlist).

## 1. Existing architecture

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, MUI.
  Deployed on a Hostinger VPS via PM2 (`lapshark_frontend`, port 3000) — not
  Vercel/Netlify, those are unused GitHub-integration leftovers.
- **Backend**: separate repo (`express_backend` on GitHub / `lapshark_backend`
  locally), Express + Mongoose, PM2 `lapshark_backend` port 5000.
- No test framework on the frontend (`lint`/`build` only). Backend uses a
  `ts-node ...selftest.ts` convention, no jest/vitest either — matches this
  codebase's own established pattern for "one runnable check."

## 2. Existing SEO capabilities — already implemented, do NOT rebuild

This codebase is **not** a blank slate. A prior pass already built most of the
technical-SEO and analytics foundation the master prompt asks for:

- `app/robots.ts`, `app/sitemap.ts` — dynamic sitemap (300s revalidate,
  products + blogs pulled live), sensible disallow list (cart/checkout/
  account/wishlist/compare/orders).
- Root layout: title template, canonical, OG/Twitter defaults, `Organization`
  JSON-LD with real address/phone, `WebSite` JSON-LD with a working
  `SearchAction`.
- Per-page metadata on home, `/products`, `/business-laptops`, and dynamic
  `generateMetadata` on `/products/[id]` (markdown-stripped, word-boundary
  clamped descriptions, canonical, OG image).
- Product JSON-LD: `Product` + `Offer` + conditional `AggregateRating` (real
  reviews only, never fabricated) + `MerchantReturnPolicy` + shipping +
  `BreadcrumbList` — all sourced from real product/policy data.
- **Campaign landing pages already exist**: `/business-laptops`,
  `/laptops-for-students`, `/laptops-for-programming`,
  `/laptops-under-20000`, `/laptops-under-30000` — all built on one shared
  `CampaignLandingPage` component + `getProductsServer()`, which already
  filters to real, in-stock inventory. This is exactly the reusable pattern
  Phase 4/16 of the brief asks for — new landing pages should extend it, not
  reinvent it.
- **Analytics is already a full stack**: GA4 + Meta Pixel + Clarity, gated on
  cookie consent, first-party event storage, GA4/Meta standard-event mapping,
  purchase conversion with CAPI dedup via a shared `eventId`. 27 event types
  already tracked, including `whatsapp_click` / `whatsapp_expert_click` /
  `whatsapp_product_click`, `view_item`, `add_to_cart`, `begin_checkout`,
  `purchase`, `budget_category_selected`, `shop_by_need_selected`.
- Centralized business data: `lib/policies.ts` (`STORE_POLICIES`),
  `lib/whatsapp.ts` (`SUPPORT_PHONE`, `buildWhatsAppLink`) — single source of
  truth already in place, reused site-wide.
- Reusable components already available: `WhatsAppCTA`, `TrustStrip`,
  `BudgetExplorer`, `ShopByNeed`, `ProductCard`.

## 3. Real gaps found

### P0 — Critical

| Gap | Evidence |
|---|---|
| No `phone_click` or `directions_click` analytics events | `tel:` links exist in 5 files (`LayoutContent.tsx`, `Navbar.tsx`, `ContactClient.tsx`, `HomeClient.tsx`, `OrderDetailsContent.tsx`); `lib/analyticsEvents.ts` has no such event names; grep for the event names returns nothing outside the WhatsApp ones. |
| No `LocalBusiness` schema | Root layout emits `@type: Organization`, not a `LocalBusiness` subtype — no `geo`, no `openingHoursSpecification`, no `priceRange`, despite the data existing (address already in the schema; opening hours in `STORE_POLICIES.supportHoursLabel`; coordinates recoverable from the store's own Google Maps embed on `/contact`, `lat 12.934458, lng 77.553945`). |
| No visible breadcrumb UI | `BreadcrumbList` JSON-LD exists only on the product page (schema-only, invisible to users) — no `<Breadcrumbs>` component anywhere in `components/`. |

### P1 — High

| Gap | Evidence |
|---|---|
| No Bangalore-specific SEO landing page | Store is Bangalore-only; no `/refurbished-laptops-bangalore` (or equivalent) route exists. This is the single biggest local-SEO gap — every other page targets India broadly. |
| No dedicated store page | No `/store/bangalore` (or equivalent). Store info (NAP, hours) only lives inside `/contact`, buried in a generic contact-form page with no directions CTA, just a passive map iframe. |
| No brand landing pages | `LAPTOP_BRANDS` (Dell, HP, Lenovo, Acer, Asus, Apple, ...) exists as a filter list and `product.brand` is a real field, but there's no `/refurbished-dell-laptops-bangalore`-style page — trivial to add on the existing `CampaignLandingPage` pattern (same shape as `/business-laptops`). |
| No active "Get Directions" CTA | Only a passive embedded iframe on `/contact`; no button linking out to Google Maps for the store itself (the one `maps.google.com` link that does exist, in `CheckoutContent.tsx`, is a courier-delivery direction, unrelated). |

### P2 — Medium

- Existing budget/use-case campaign pages aren't Bangalore-branded in title/H1/copy — missing the local+budget keyword combination ("refurbished laptops under 20000 Bangalore").
- No FAQ content/schema anywhere yet (none of the required pages exist yet to hang FAQs on).
- No internal links to a Bangalore or store page from Navbar/homepage/footer (can't link to what doesn't exist yet).

### P3 — Optional / explicitly deprioritized

- Neighborhood pages (Jayanagar, JP Nagar, BTM Layout, ...): the master brief
  itself warns against "hundreds of thin city/location pages." Recommend
  **skipping these** unless the business can supply genuinely distinct
  per-neighborhood content (e.g. an actual second location) — otherwise
  they're near-duplicate doorway pages against the Bangalore page.
- Product image filename rewrites: images are admin-uploaded/CDN-hosted;
  renaming is a data-model change disproportionate to the SEO gain. Alt text
  (already present per product) is the higher-value, lower-risk piece to
  check/tighten.

## 4. What will NOT be touched

- Checkout, cart, payment, auth, admin — zero changes.
- No renaming of existing indexed routes (`/laptops-under-20000` etc.) — the
  gap is *missing Bangalore branding/pages*, not bad URLs, so there's nothing
  here that needs a redirect-risking rename.
- No new dependencies — everything below reuses existing components/libs.

## 5. Proposed work, in reviewable chunks

1. **Analytics** — add `phone_click` + `directions_click` to
   `lib/analyticsEvents.ts` (frontend) and the matching allowlist in
   `lapshark_backend/src/utils/analyticsEvents.ts`; wire `trackEvent()` onto
   the existing `tel:` links and the new directions CTA. Mechanical, reuses
   `trackEvent()` as-is.
2. **LocalBusiness schema** — upgrade the root layout's `Organization` block
   to `ElectronicsStore` (most specific applicable subtype) with `geo`,
   `openingHoursSpecification`, `priceRange`. Requires structuring
   `STORE_POLICIES.supportHoursLabel` into a machine-readable
   day/open/close shape (kept in the one existing file, not duplicated).
3. **Breadcrumbs** — one small reusable `<Breadcrumbs>` component (visible
   nav + JSON-LD in one place), used on product pages and the new
   landing/store pages.
4. **New pages**, all on the existing `CampaignLandingPage` /
   `getProductsServer()` pattern:
   - `/refurbished-laptops-bangalore` — richer than a bare campaign page:
     brand grid, budget grid, use-case grid, "Visit Lapshark" block, FAQs —
     composed from *existing* sub-components (`TrustStrip`, `WhatsAppCTA`,
     `ShopByNeed`, `BudgetExplorer`) rather than new ones.
   - `/store/bangalore` — NAP, hours, directions CTA, embedded map (reuse the
     existing iframe embed), FAQs, `LocalBusiness` schema.
   - Brand pages (`/refurbished-dell-laptops-bangalore` etc.) — literally the
     `/business-laptops` pattern with `product.brand` as the filter; **only
     for brands with real in-stock inventory**, checked against
     `getProductsServer()` at build/request time, not the full
     `LAPTOP_BRANDS` filter list.
5. **Internal linking** — link the new Bangalore/store pages from
   Navbar/footer/homepage.
6. **Sitemap** — add the new static routes to `app/sitemap.ts`.
7. **Docs** (per brief, Phase 26/30): `SEO_IMPLEMENTATION.md`,
   `LOCAL_SEO_CONTENT_GUIDE.md`, `CHANGED_FILES.md`, `SEO_TEST_REPORT.md`,
   plus a final summary in chat.

## 6. Risks

- The backend analytics event allowlist lives in a **separate repo**
  (`lapshark_backend`) with its own deploy — adding frontend-only event names
  without updating it means the new events 400 silently (analytics is
  designed to fail closed, so nothing breaks, but nothing gets recorded
  either).
- Geo coordinates are recovered from the store's own existing Google Maps
  embed URL, not invented — but should still get a one-line human
  confirmation against the actual Google Business Profile before publishing.
- Opening hours currently exist only as a free-text label; structuring them
  for schema is a one-time judgment call on the exact hours, not a code risk.
- Brand pages must be checked against live inventory before creation —
  skip any brand with zero in-stock matches (mirrors what `/business-laptops`
  already does for its one category).

## 7. Testing strategy

- `npm run build` + `npm run lint` on the frontend after each chunk (no
  frontend test suite exists to run).
- Manual metadata/schema spot-check (view-source or a JSON-LD validator) on:
  homepage, `/refurbished-laptops-bangalore`, `/store/bangalore`, one brand
  page, one product page.
- Sitemap/robots: fetch `/sitemap.xml` and `/robots.txt` after build, confirm
  new routes present and no disallowed route leaked in.
- No changes touch checkout/cart/payment/auth code paths, so no regression
  testing needed there — confirmed by diff review (`CHANGED_FILES.md`), not
  by re-testing those flows.

---

**This plan does not modify any files yet.** Next step is picking a scope
(see chat) before P0/P1 implementation begins.
