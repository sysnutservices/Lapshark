// Lapshark's only real financing integration today is a Bajaj Finserv EMI
// Card lead-capture flow (HomeClient's "EMI Banner" -> /loan/enquiry) — there
// is no live API that returns an actual approved EMI figure per product.
// Everything here is therefore explicitly an *estimate* (reducing-balance
// EMI formula), never presented as a quote or a guaranteed rate. Swap
// calculateEstimatedEmi's body for a real provider call if/when one exists —
// call sites don't need to change, they already just render whatever this
// returns with an "Est." label.
export const EMI_PROVIDER_NAME = "Bajaj Finserv";
export const EMI_TENURE_OPTIONS_MONTHS = [3, 6, 9, 12, 18, 24] as const;
// Representative rate for the estimate only — not a quoted/approved rate.
// Update if Lapshark's actual arranged rate with the provider differs.
const ESTIMATED_ANNUAL_RATE_PERCENT = 14;

export function calculateEstimatedEmi(
  principal: number,
  tenureMonths: number = 12,
  annualRatePercent: number = ESTIMATED_ANNUAL_RATE_PERCENT
): number {
  if (!principal || principal <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 12 / 100;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

// The lowest/most attractive-looking figure to headline on a card — longest
// tenure gives the smallest monthly number, which is what "From ₹X/month"
// conventionally shows.
export function estimateFromPerMonth(price: number): number {
  const longestTenure = EMI_TENURE_OPTIONS_MONTHS[EMI_TENURE_OPTIONS_MONTHS.length - 1];
  return calculateEstimatedEmi(price, longestTenure);
}
