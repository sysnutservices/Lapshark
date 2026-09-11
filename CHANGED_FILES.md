# Changed Files — Local SEO + Conversion (P0 + P1)

Frontend repo (`Lapshark`) unless noted. All changes are additive/metadata —
no checkout, cart, payment, auth, or admin code touched.

## New files

| File | Reason |
|---|---|
| `lib/store.ts` | Single source of truth for store NAP, geo coordinates, hours, maps embed/directions URLs. Coordinates recovered from the existing `/contact` Google Maps embed, not invented. |
| `components/Breadcrumbs.tsx` | Reusable visible breadcrumb nav + `BreadcrumbList` JSON-LD (previously schema-only on the product page, invisible to users). |
| `components/ecommerce/StoreCTAs.tsx` | Shared "Call / WhatsApp / Get Directions" CTA row, used on the Bangalore and store pages so the copy/links/analytics tags can't drift between them. |
| `components/ecommerce/FAQSection.tsx` | Shared visible FAQ accordion + matching `FAQPage` JSON-LD. |
| `app/refurbished-laptops-bangalore/page.tsx` | Main local-SEO landing page — brand/budget/use-case navigation, "why Lapshark," refurbishment process, visit-store block, FAQs. |
| `app/store/bangalore/page.tsx` | Dedicated store page — NAP, hours, embedded map, brands/categories in stock, CTAs, FAQs. |
| `app/refurbished-dell-laptops-bangalore/page.tsx` | Brand landing page, same shape as the existing `/business-laptops`. |
| `app/refurbished-hp-laptops-bangalore/page.tsx` | Same, HP. |
| `app/refurbished-lenovo-laptops-bangalore/page.tsx` | Same, Lenovo. |
| `app/refurbished-apple-macbooks-bangalore/page.tsx` | Same, Apple. |
| `SEO_IMPLEMENTATION_PLAN.md` | Phase 1/2 audit + plan (this project's own record). |
| `SEO_IMPLEMENTATION.md` | Phase 26 documentation. |
| `LOCAL_SEO_CONTENT_GUIDE.md` | Phase 26 documentation. |
| `SEO_TEST_REPORT.md` | Phase 27/28 validation record. |

## Modified files

| File | Change | Reason |
|---|---|---|
| `app/layout.tsx` | `Organization` → `ElectronicsStore` JSON-LD, added `geo`, `openingHoursSpecification`, `priceRange`, `image`; now imports address/geo/hours from `lib/store.ts` instead of inlining the address a 2nd time. | P0: no `LocalBusiness` schema existed. |
| `lib/analyticsEvents.ts` | Added `phone_click`, `directions_click` event names + payload types. | P0: neither event existed despite 5 live `tel:` links. |
| `app/LayoutContent.tsx` | Footer phone link now fires `phone_click`; address is now a `Get Directions` link firing `directions_click`; added a "Bangalore" footer link column (6 links); footer grid widened from 4 to 5 columns; added a homepage→Bangalore-page banner link (see `app/HomeClient.tsx` below, same file's `<main>{children}</main>` unaffected). | P0 tracking + P1 internal linking. |
| `components/Navbar.tsx` | Mobile-menu phone link now fires `phone_click`. | P0 tracking. |
| `app/HomeClient.tsx` | Hero "talk to an expert" phone CTA now fires `phone_click`; added a homepage banner linking to `/refurbished-laptops-bangalore`. | P0 tracking + P1 internal linking. |
| `app/contact/ContactClient.tsx` | Phone link now fires `phone_click`; store address is now also a tracked `Get Directions` link; removed the dead `<SEO>` import (unused — the page already has real `generateMetadata`/`export const metadata`, this client-side title mutator was legacy and never rendered). | P0 tracking + cleanup. |
| `app/orders/[orderId]/OrderDetailsContent.tsx` | Support-card phone link now fires `phone_click`. | P0 tracking (completeness — not GBP traffic, but the same dead gap). |
| `app/products/[id]/page.tsx` | Replaced inline `BreadcrumbList`-only JSON-LD with the new `<Breadcrumbs>` component (adds the visible nav, keeps the schema). | P0: breadcrumb schema existed but nothing was visible. |
| `app/sitemap.ts` | Added the 6 new routes. | New indexable pages must be discoverable. |

## Backend repo (`lapshark_backend`)

| File | Change | Reason |
|---|---|---|
| `src/utils/analyticsEvents.ts` | Added `phone_click`, `directions_click` to `ALLOWED_EVENTS`. | Without this, the two new frontend events 400 at `POST /analytics/events` (fails closed, not a crash, but silently records nothing). **Needs its own deploy** — see Manual Actions in the final summary. |

## Explicitly not touched

Checkout, cart, payment, auth, admin routes/components, database schemas
(besides the one backend allowlist array), existing route URLs, dependencies.
