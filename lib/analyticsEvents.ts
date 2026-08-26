// Client-side type registry for trackEvent() calls — autocomplete/type-safety
// only. The backend (lapshark_backend/src/utils/analyticsEvents.ts) holds the
// authoritative list that actually gets enforced; keep the two in sync by
// hand (two independently-deployed repos, no shared package). A mismatch
// fails safe: the backend just 400s an event it doesn't recognize.
export const ANALYTICS_EVENTS = [
  "page_view",
  "view_item",
  "add_to_cart",
  "wishlist_add",
  "compare_started",
  "warranty_select",
  "filter_used",
  "sort_used",
  "search",
  "whatsapp_click",
  "begin_checkout",
  "coupon_applied",
  "checkout_payment_failed",
  "login",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface PageViewProperties {
  path: string;
  title?: string;
  referrer?: string;
}

export interface ViewItemProperties {
  productId: string;
  title: string;
  category?: string;
  brand?: string;
  price?: number;
  finalPrice?: number;
}

export interface AddToCartProperties {
  productId: string;
  title: string;
  quantity: number;
  finalPrice?: number;
  price?: number;
}

export interface WishlistProperties {
  productId: string;
  title: string;
}

export interface CompareProperties {
  productId: string;
  title: string;
}

export interface WarrantySelectProperties {
  productId: string;
  warrantyValue: string;
  warrantyPrice?: number;
}

export interface FilterUsedProperties {
  filterType: string;
  value: string;
}

export interface SortUsedProperties {
  sortBy: string;
}

export interface SearchProperties {
  query: string;
}

export interface WhatsappClickProperties {
  location: string;
}

export interface BeginCheckoutProperties {
  finalTotal: number;
  paymentMethod: string;
  itemCount: number;
}

export interface CouponAppliedProperties {
  couponCode: string;
  discountAmount: number;
}

export interface CheckoutPaymentFailedProperties {
  reason?: string;
}

export interface LoginProperties {
  method: string;
}

// Maps each event name to its payload shape — trackEvent() uses this to type
// the `properties` argument per call.
export interface AnalyticsEventPayloads {
  page_view: PageViewProperties;
  view_item: ViewItemProperties;
  add_to_cart: AddToCartProperties;
  wishlist_add: WishlistProperties;
  compare_started: CompareProperties;
  warranty_select: WarrantySelectProperties;
  filter_used: FilterUsedProperties;
  sort_used: SortUsedProperties;
  search: SearchProperties;
  whatsapp_click: WhatsappClickProperties;
  begin_checkout: BeginCheckoutProperties;
  coupon_applied: CouponAppliedProperties;
  checkout_payment_failed: CheckoutPaymentFailedProperties;
  login: LoginProperties;
}
