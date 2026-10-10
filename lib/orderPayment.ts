import { Order } from "@/types";

// Every checkout creates its order before the customer pays, so a payment
// window closed without paying leaves an order stuck Pending/Pending that
// looks just like a real one. Give it an hour (Razorpay retries, slow UPI
// approvals, the webhook catching up) before calling it abandoned. Once an
// admin moves the order past Pending it's being handled — never abandoned.
const ABANDON_AFTER_MS = 60 * 60 * 1000;

export function isAbandoned(o: Order): boolean {
  if (o.paymentStatus !== "Pending" || o.status !== "Pending") return false;
  const created = new Date(o.date).getTime();
  return Number.isFinite(created) && Date.now() - created > ABANDON_AFTER_MS;
}

// paymentStatus is 'Paid' for both a prepaid order and a COD order whose
// ₹500 advance went through — split those so admins can tell at a glance
// whether cash is still owed. Shared by the admin orders page and dashboard.
export function getPaymentLabel(o: Order): string {
  if (isAbandoned(o)) return "Abandoned";
  if (o.paymentStatus !== "Paid") return o.paymentStatus;
  const due = o.total - (o.advanceAmount || 0);
  if (o.paymentMethod !== "COD" || due <= 0 || o.codCollected?.at) return "Fully Paid";
  // Delivered COD: the courier has the cash but settles it to us days
  // later — only Fully Paid once an admin marks the settlement received.
  return o.status === "Delivered" ? "Awaiting Settlement" : "Partially Paid";
}

// Cash the courier collected on delivery but hasn't settled to us yet.
export function settlementPending(o: Order): number {
  return getPaymentLabel(o) === "Awaiting Settlement" ? o.total - (o.advanceAmount || 0) : 0;
}
