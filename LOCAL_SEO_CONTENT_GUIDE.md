# Local SEO Content Guide

## Target keyword groups (by page)

| Page | Primary keyword | Secondary |
|---|---|---|
| `/refurbished-laptops-bangalore` | refurbished laptops bangalore | second hand laptops bangalore, used laptops bangalore |
| `/store/bangalore` | lapshark bangalore store, refurbished laptop store banashankari | laptop store near me (Bangalore intent) |
| `/refurbished-dell-laptops-bangalore` | refurbished dell laptops bangalore | dell latitude bangalore |
| `/refurbished-hp-laptops-bangalore` | refurbished hp laptops bangalore | hp elitebook/probook bangalore |
| `/refurbished-lenovo-laptops-bangalore` | refurbished lenovo laptops bangalore | lenovo thinkpad bangalore |
| `/refurbished-apple-macbooks-bangalore` | refurbished macbook bangalore | second hand macbook bangalore |
| `/laptops-under-20000`, `/laptops-under-30000` (existing) | refurbished laptops under 20000/30000 | same + "bangalore" — see Content rules below |

## Page intent

- **Bangalore landing page**: the money page for "refurbished laptops
  bangalore" — commercial intent, needs to answer "can I trust this, can I
  see it in person, what's in stock" fast. Structure follows the master
  brief's own order: intro → brand → budget → use-case → why us → process →
  visit store → FAQ.
- **Store page**: local-pack / "near me" / GBP-referral intent — someone who
  already decided to buy and wants directions, hours, or to confirm the
  store is real before visiting. NAP and CTAs above the fold.
- **Brand pages**: brand-qualified commercial intent ("refurbished dell
  bangalore") — same shape as the existing budget/use-case campaign pages,
  deliberately not reinvented.

## Internal linking strategy

Homepage → Bangalore page → brand pages → products, and Bangalore/store
pages → existing budget (`/laptops-under-20000`) and use-case
(`/laptops-for-students`) pages via the already-reused `BudgetExplorer` /
`ShopByNeed` components. Footer links every page to the full Bangalore
cluster site-wide. Don't add more entry points than this without a reason —
the existing pages already link to `/products` and each other; the new pages
slot into that graph rather than growing a parallel one.

## Content rules

- Every claim must trace to `lib/policies.ts` (`STORE_POLICIES`) or
  `lib/store.ts` — warranty months, return days, quality-check points, store
  hours, address. If a page needs a new claim, add it to one of those files
  first (single source of truth), don't hardcode it in the page.
- Never invent ratings, reviews, testimonials, parking info, or landmarks.
  The product schema already enforces this (`AggregateRating` only emitted
  when `product.reviews > 0`) — new pages must hold the same line.
- FAQ content must answer real, verifiable questions (see `FAQSection`
  usages) — not keyword-stuffed variations of the same question.

## Existing budget/use-case pages — optional next step

`/laptops-under-20000`, `/laptops-under-30000`, `/laptops-for-students`,
`/laptops-for-programming`, `/business-laptops` are not Bangalore-branded
today (title/H1 don't mention the city), missing the local+budget keyword
combination ("refurbished laptops under 20000 bangalore"). Two ways to close
this, deliberately not done in this pass (P2, needs a product decision, not
just code):

1. Add one Bangalore-mentioning sentence to each page's copy/description
   (cheap, low risk, no URL change).
2. A true `/refurbished-laptops-under-20000-bangalore`-style page — only
   worth it if search-volume data (Search Console / a keyword tool) actually
   shows meaningful separate demand for the city-qualified term; otherwise
   it's a near-duplicate of both `/laptops-under-20000` and the new
   Bangalore landing page's budget section.

## Review strategy

No fabricated reviews/ratings anywhere in this codebase (verified — product
schema and this content guide both enforce it). The actual lever is
review *acquisition*, not review *display*: prompting real customers
(post-delivery or post-store-visit) to leave a Google review is a manual
Google Business Profile action, not a code change — see the final summary's
Manual Actions list.

## GBP (Google Business Profile) strategy

The website side of GBP support is done (LocalBusiness schema, NAP-consistent
store page, directions/call/WhatsApp CTAs, real hours). What's left is
entirely on the Google Business Profile side and needs a human with account
access — see Manual Actions in the final summary (claim/verify listing,
confirm categories, add real store photos, respond to reviews).

## Local conversion strategy

`phone_click` / `directions_click` / `whatsapp_*` are now all tracked with a
`location` tag identifying where the click happened. Once real traffic flows
in, the admin analytics dashboard (`app/admin/(dashboard)/analytics`) can
answer "which page/CTA actually drives calls and directions requests" —
that's the data needed to decide whether e.g. the Bangalore page's own
"Visit Lapshark" block outperforms the sitewide footer CTA, and where to
invest further.
