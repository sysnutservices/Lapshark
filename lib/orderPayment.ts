import { Order } from "@/types";

// paymentStatus is 'Paid' for both a prepaid order and a COD order whose
// ₹500 advance went through — split those so admins can tell at a glance
// whether cash is still owed. Shared by the admin orders page and dashboard.
export function getPaymentLabel(o: Order): string {
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
