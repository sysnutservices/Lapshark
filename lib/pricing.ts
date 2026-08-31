import { CartItem, Product } from "@/types";

// Frontend mirror of lapshark_backend/src/utils/pricing.ts's
// calculateProductPrice — this is for DISPLAY only (product card, product
// page, cart, checkout, admin preview). The two apps are separate repos/
// runtimes so a literal shared module isn't possible; the backend copy at
// order-creation time is what's actually authoritative and re-derives this
// from the live product regardless of what the browser computed or sent.
// Keep the two in sync by hand if the discount math ever changes.

export type ExtraOfferStatus = "none" | "scheduled" | "active" | "expired" | "disabled";

export interface ExtraOfferSnapshot {
  discountType: NonNullable<Product["extraOffer"]>["discountType"];
  discountValue: number;
  offerLabel?: string;
  discountAmount: number;
}

export interface ProductPriceResult {
  sellingPrice: number;
  finalPrice: number;
  offer: ExtraOfferSnapshot | null;
}

export function getExtraOfferStatus(offer: Product["extraOffer"] | null | undefined, now: Date = new Date()): ExtraOfferStatus {
  if (!offer) return "none";
  if (!offer.isActive) return "disabled";
  if (offer.startAt && now < new Date(offer.startAt)) return "scheduled";
  if (offer.endAt && now > new Date(offer.endAt)) return "expired";
  return "active";
}

export function isExtraOfferActive(offer: Product["extraOffer"] | null | undefined, now: Date = new Date()): boolean {
  return getExtraOfferStatus(offer, now) === "active";
}

function round(n: number): number {
  return Math.round(n);
}

// sellingPrice: product.finalPrice, optionally plus config addon cost —
// caller's choice, mirrors the backend. The offer never applies to addon
// cost, so pass the base finalPrice here and add configCost to the result
// yourself if you need it (see ProductCard/ProductsDetailsClient).
export function calculateProductPrice(sellingPrice: number, offer: Product["extraOffer"] | null | undefined, now: Date = new Date()): ProductPriceResult {
  const base = Math.max(0, round(sellingPrice));

  if (!isExtraOfferActive(offer, now) || !offer) {
    return { sellingPrice: base, finalPrice: base, offer: null };
  }

  let finalPrice: number;
  if (offer.discountType === "specialPrice") {
    finalPrice = round(offer.discountValue);
  } else if (offer.discountType === "percentage") {
    finalPrice = round(base - (base * offer.discountValue) / 100);
  } else {
    finalPrice = round(base - offer.discountValue);
  }

  finalPrice = Math.min(base, Math.max(0, finalPrice));
  const discountAmount = base - finalPrice;
  if (discountAmount <= 0) {
    return { sellingPrice: base, finalPrice: base, offer: null };
  }

  return {
    sellingPrice: base,
    finalPrice,
    offer: { discountType: offer.discountType, discountValue: offer.discountValue, offerLabel: offer.offerLabel, discountAmount },
  };
}

export interface PricedCartItem extends CartItem {
  livePrice: number; // current price (offer-adjusted selling price + config addon cost)
  originalSellingPrice: number; // same, before the offer — the "cross out" line
  offer: ExtraOfferSnapshot | null;
  // True when livePrice differs from the finalPrice the item carried at
  // add-to-cart time — an offer changed/expired/started while it sat in
  // the cart (spec: "revalidate at checkout, don't silently charge a
  // different amount").
  priceChanged: boolean;
}

// Cart/checkout revalidation: the cart only stores a finalPrice snapshot
// from whenever the item was added (see CartContext.addToCart), which can
// go stale. This recomputes the CURRENT price from the live product list
// (already loaded by useStore()) — one function so Cart and Checkout never
// price the same item two different ways. Config addon cost is read back
// from the item's own stored configOptions (each option object carries its
// own `.price`), same values the customer actually picked.
export function priceCartItem(item: CartItem, products: Product[]): PricedCartItem {
  const lookupId = (item as any).originalId || item.productId;
  const liveProduct = products.find((p) => p.productId === lookupId || p._id === lookupId);
  const configCost =
    ((item as any).configOptions?.ram?.price || 0) +
    ((item as any).configOptions?.storage?.price || 0) +
    ((item as any).configOptions?.warranty?.price || 0);

  if (!liveProduct) {
    // Product no longer in the live catalogue (deleted/unpublished) — fall
    // back to the stored snapshot rather than crash; checkout's own
    // per-item product lookup will reject it properly if it's really gone.
    return { ...item, livePrice: item.finalPrice, originalSellingPrice: item.finalPrice, offer: null, priceChanged: false };
  }

  const pricing = calculateProductPrice(liveProduct.finalPrice, liveProduct.extraOffer);
  const livePrice = pricing.finalPrice + configCost;
  return {
    ...item,
    livePrice,
    originalSellingPrice: pricing.sellingPrice + configCost,
    offer: pricing.offer,
    priceChanged: Math.abs(livePrice - item.finalPrice) >= 1,
  };
}

// The badge text shown across ProductCard/PDP/cart/checkout — one place so
// "EXTRA ₹1,500 OFF" vs "EXTRA 10% OFF" vs a custom label never drifts
// between components.
export function extraOfferBadgeText(offer: ExtraOfferSnapshot): string {
  if (offer.offerLabel) return offer.offerLabel;
  if (offer.discountType === "percentage") return `EXTRA ${offer.discountValue}% OFF`;
  return `EXTRA ₹${offer.discountAmount.toLocaleString("en-IN")} OFF`;
}
