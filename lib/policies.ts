// Single source of truth for warranty/return/COD numbers shown across the
// site (homepage, marquee, product cards/pages, cart, FAQ, warranty/returns
// pages, structured data, metadata). Before this file existed these numbers
// were hardcoded independently in ~15 files — consistent by luck, not by
// construction. Change a number here, not at each call site.
//
// Values below are taken from the actual policy pages that already exist
// (app/warranty/WarrantyContent.tsx, app/returns/page.tsx) — these are the
// real, currently-published Lapshark policies, not invented numbers.
export const STORE_POLICIES = {
  warrantyMonths: 6,
  warrantyLabel: "6-Month Warranty",

  returnDays: 14,
  returnLabel: "14-Day Returns",
  returnPickupFree: true,
  // Real conditions from app/returns/page.tsx — kept here so return-policy
  // copy anywhere else on the site can't drift from what that page (the
  // actual policy of record) says. This is deliberately NOT "no questions
  // asked" — a return still has to meet these to be accepted.
  returnConditions: [
    "The return request is initiated within 14 days of delivery.",
    "The product is in the same condition as received (no new scratches/dents).",
    "All original accessories (charger, cable) are included.",
    "The device has not been tampered with or opened.",
    "The warranty seal is intact.",
  ],
  refundWindowLabel: "5-7 business days",
  restockingFeeMaxPercent: 20,

  // From WarrantyContent.tsx: battery is covered under the *same* 6-month
  // warranty, only if fully dead — not a separate/shorter battery-specific
  // term. app/contact/ContactClient.tsx previously claimed "batteries
  // covered for 3 months", which contradicted this; fixed to match.
  batteryPolicyLabel: "Battery covered under the standard 6-month warranty if it stops working entirely — wear-related capacity loss isn't covered.",

  qualityCheckPoints: 40,
  qualityCheckLabel: "40+ Point Quality Check",

  codAvailable: true,
  codAdvanceAmount: 500,

  // Paid warranty extensions offered at checkout (admin/products config) —
  // real add-on pricing, not part of the free standard warranty above.
  extendedWarrantyOptions: [
    { label: "6 Months Warranty", months: 6, price: 0 },
    { label: "1 Year Warranty", months: 12, price: 1500 },
    { label: "2 Year Warranty", months: 24, price: 2999 },
  ],
} as const;
