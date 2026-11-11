// ILLUSTRATIVE pilot rates from the programme spec, for marketing examples on
// /partner only. Real commission comes from admin-configured rules on the
// server (distribution/docs/06). Every place that shows these numbers must
// label them as examples, not promises. Keep in sync with
// ILLUSTRATIVE_REFERRAL_SLABS in the backend's commissionCalc.ts.

export const ILLUSTRATIVE_REFERRAL_SLABS = [
    { min: 15000, max: 20000, commission: 300, label: "₹15,000 – ₹20,000" },
    { min: 20000.01, max: 25000, commission: 500, label: "₹20,001 – ₹25,000" },
    { min: 25000.01, max: 30000, commission: 650, label: "₹25,001 – ₹30,000" },
    { min: 30000.01, max: 40000, commission: 750, label: "₹30,001 – ₹40,000" },
] as const;

// Spec's independent example: base ₹300 + 50% of the price above the floor.
export const ILLUSTRATIVE_INDEPENDENT = { base: 300, sharePercent: 50 } as const;

export function illustrativeReferralCommission(price: number): number | null {
    const slab = ILLUSTRATIVE_REFERRAL_SLABS.find((s) => price >= s.min && price <= s.max);
    return slab ? slab.commission : null;
}

export function illustrativeIndependentCommission(aboveFloor: number): number {
    return ILLUSTRATIVE_INDEPENDENT.base + Math.floor((Math.max(0, aboveFloor) * ILLUSTRATIVE_INDEPENDENT.sharePercent) / 100);
}
