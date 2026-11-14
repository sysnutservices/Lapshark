// Founding-partner pilot rates advertised on /partner (doubled from the
// programme spec's ₹300-₹750 on 2026-11-14). Real commission comes from the
// admin-configured rules on the server (distribution/docs/06), so the live
// rules MUST pay at least these — the page calls them the founding rates and
// promises they won't go down for FOUNDING_RATE_LOCK_MONTHS. Keep in sync
// with ILLUSTRATIVE_REFERRAL_SLABS in the backend's commissionCalc.ts (the
// admin "start from template" rule).

export const ILLUSTRATIVE_REFERRAL_SLABS = [
    { min: 15000, max: 20000, commission: 600, label: "₹15,000 – ₹20,000" },
    { min: 20000.01, max: 25000, commission: 1000, label: "₹20,001 – ₹25,000" },
    { min: 25000.01, max: 30000, commission: 1300, label: "₹25,001 – ₹30,000" },
    { min: 30000.01, max: 40000, commission: 1500, label: "₹30,001 – ₹40,000" },
] as const;

// Independent: base + 50% of the price above the approved minimum.
export const ILLUSTRATIVE_INDEPENDENT = { base: 600, sharePercent: 50 } as const;

// Founding partners keep the rates in force when they join for this long:
// they won't go down during it. A promise — honour it in the admin rules.
export const FOUNDING_RATE_LOCK_MONTHS = 6;

export function illustrativeReferralCommission(price: number): number | null {
    const slab = ILLUSTRATIVE_REFERRAL_SLABS.find((s) => price >= s.min && price <= s.max);
    return slab ? slab.commission : null;
}

export function illustrativeIndependentCommission(aboveFloor: number): number {
    return ILLUSTRATIVE_INDEPENDENT.base + Math.floor((Math.max(0, aboveFloor) * ILLUSTRATIVE_INDEPENDENT.sharePercent) / 100);
}
