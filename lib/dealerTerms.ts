// Shared by the application form (components/dealer/DealerRegister) and the
// public /dealers page, which is a server component and so can't import it
// from the client form.
// The terms a dealer accepts. Only rules the system actually enforces;
// the full agreement text is still to come from Lapshark's lawyer.
export const dealerTerms = (claimDays: number) => [
    "You buy laptops from Lapshark and resell them under your own name, on your own bill, to your own customers.",
    "Laptops come without Lapshark warranty unless you add warranty to a laptop when ordering. That warranty covers you, the dealer, not your customer.",
    `Damage in transit, or a laptop that doesn't match your order, must be reported within ${claimDays} days of delivery. There are no other returns.`,
    "Payment is by bank transfer or cash, before the laptops are dispatched or handed over. Cash is accepted only below ₹2,00,000 per order and per day.",
    "Don't present yourself as Lapshark or promise a Lapshark warranty to your customers.",
];
