# SEO Implementation Reference

Companion to `SEO_IMPLEMENTATION_PLAN.md` (the audit/plan) and
`CHANGED_FILES.md` (the diff). This is the "how it works" reference for
what's live after the P0+P1 pass.

## Routes

| Route | Purpose | Source |
|---|---|---|
| `/refurbished-laptops-bangalore` | Primary local-SEO landing page | `app/refurbished-laptops-bangalore/page.tsx` |
| `/store/bangalore` | Store page (NAP, hours, map, CTAs) | `app/store/bangalore/page.tsx` |
| `/refurbished-dell-laptops-bangalore` | Brand landing page | `app/refurbished-dell-laptops-bangalore/page.tsx` |
| `/refurbished-hp-laptops-bangalore` | Brand landing page | `app/refurbished-hp-laptops-bangalore/page.tsx` |
| `/refurbished-lenovo-laptops-bangalore` | Brand landing page | `app/refurbished-lenovo-laptops-bangalore/page.tsx` |
| `/refurbished-apple-macbooks-bangalore` | Brand landing page | `app/refurbished-apple-macbooks-bangalore/page.tsx` |

All four brand pages are the existing `CampaignLandingPage` component
(`components/ecommerce/CampaignLandingPage.tsx`) filtered by `product.brand`
— the same pattern `/business-laptops` already used. Adding a 5th brand later
is a ~20-line file copy, not new infrastructure.

## Metadata system

Unchanged from what already existed: `export const metadata: Metadata` (or
`generateMetadata()` for dynamic routes) per page, with the root layout
(`app/layout.tsx`) supplying `title: { template: "%s | Lapshark" }` — **page
titles must never include "Lapshark" themselves**, or it renders twice (this
bug was caught and fixed on the store page during this pass — see
`SEO_TEST_REPORT.md`).

## Structured data (JSON-LD)

- **Sitewide** (`app/layout.tsx`): `ElectronicsStore` (was `Organization`) —
  name, address, geo, `openingHoursSpecification`, `priceRange`, telephone —
  plus the existing `WebSite`/`SearchAction` block.
- **Per-product** (`app/products/[id]/page.tsx`): unchanged `Product` +
  `Offer` + conditional `AggregateRating` + `MerchantReturnPolicy` +
  shipping, now paired with the visible `<Breadcrumbs>` component instead of
  a standalone invisible `BreadcrumbList` script.
- **New landing/store pages**: `<Breadcrumbs>` (nav + schema) and
  `<FAQSection>` (accordion + `FAQPage` schema) on each. No page emits a 2nd
  `LocalBusiness`/`ElectronicsStore` block — the one in the root layout
  already covers every page; duplicating it per-page would itself become a
  "duplicate schema" problem.

## Local business data — single source of truth

`lib/store.ts` holds `STORE_ADDRESS`, `STORE_GEO`, `STORE_HOURS`,
`STORE_MAPS_EMBED_URL`, `STORE_DIRECTIONS_URL`. Previously the address string
was typed out independently in `app/layout.tsx`, `app/LayoutContent.tsx`, and
`app/contact/ContactClient.tsx` — any future address/hours change now happens
in one file. Geo coordinates come from the store's own existing Google Maps
embed (not invented) — flagged in the plan as worth a one-line human
confirmation against the actual Google Business Profile.

`lib/policies.ts` (`STORE_POLICIES`) and `lib/whatsapp.ts` (`SUPPORT_PHONE`)
were pre-existing and are reused as-is, not duplicated.

## Analytics

`lib/analytics.ts`'s `trackEvent()` was pre-existing and unchanged. Two event
names were added to the allowlist (frontend `lib/analyticsEvents.ts` +
backend `src/utils/analyticsEvents.ts`, kept in sync per that file's own
existing convention):

- `phone_click` — fired from every `tel:` link (footer, mobile nav, homepage
  CTA, contact page, order-details support card, and the new `StoreCTAs`
  component), each tagged with a `location` string identifying which one.
- `directions_click` — fired from every "Get Directions" link (footer
  address, contact page, `StoreCTAs`), same `location` tagging.

Both reuse the existing `WhatsappClickProperties` (`{ location: string }`)
shape rather than adding near-duplicate types, and flow through the same
consent-gated `trackEvent()` → GA4/Meta/Clarity/first-party-storage pipeline
every other event already uses — no new tracking infrastructure.

## Sitemap / robots

`app/sitemap.ts` gained the 6 new static routes. `app/robots.ts` needed no
change — the new routes are public and the existing `allow: "/"` default
already covers them; nothing new needed disallowing.

## Internal linking

- Homepage (`app/HomeClient.tsx`): a banner link to
  `/refurbished-laptops-bangalore` right after the trust strip.
- Footer (`app/LayoutContent.tsx`): new "Bangalore" link column (landing
  page, store page, all 4 brand pages) on every page site-wide.
- Bangalore landing page → brand pages (only brands with in-stock products),
  → `/store/bangalore`, → `/products?priceRange=...` (via the reused
  `BudgetExplorer`), → `/products?use=...` (via the reused `ShopByNeed`).
- Store page → brand pages in stock, → existing category campaign pages
  (`/business-laptops`, `/laptops-for-students`, `/laptops-for-programming`),
  → `/products`.

## What was deliberately skipped (see plan for reasoning)

- Neighborhood pages (Jayanagar, JP Nagar, etc.) — no distinct content to
  justify them yet; the master brief itself warns against thin duplicate
  city pages.
- Renaming/redirecting existing campaign routes (`/laptops-under-20000` etc.)
  to a Bangalore-branded URL — not necessary; the gap was missing pages, not
  bad URLs on the existing ones.
- Store photos on the store page — none exist in the codebase/CMS to use;
  fabricating or substituting product photos would misrepresent the store.
  Flagged as a manual action (upload real store photos via the admin, then
  add an `<Image>` block).
