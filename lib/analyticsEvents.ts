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
  "whatsapp_expert_click",
  "whatsapp_product_click",
  "begin_checkout",
  "add_payment_info",
  "coupon_applied",
  "checkout_payment_failed",
  "login",
  "remove_from_cart",
  "view_item_list",
  "select_item",
  "laptop_recommendation_started",
  "laptop_recommendation_completed",
  "emi_info_viewed",
  "quality_report_viewed",
  "compare_product",
  "budget_category_selected",
  "shop_by_need_selected",
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

export interface WhatsappProductClickProperties {
  productId: string;
  title: string;
  location: string;
}

export interface RemoveFromCartProperties {
  productId: string;
  title: string;
  quantity: number;
  finalPrice?: number;
}

export interface ViewItemListProperties {
  listName: string;
  itemCount: number;
}

export interface SelectItemProperties {
  productId: string;
  title: string;
  finalPrice?: number;
  listName?: string;
}

export interface RecommendationStartedProperties {
  entryPoint: string;
}

export interface RecommendationCompletedProperties {
  useCase: string;
  budget: string;
  performanceTier?: string;
  resultCount: number;
}

export interface EmiInfoViewedProperties {
  price: number;
}

export interface QualityReportViewedProperties {
  productId: string;
}

// Fired once a comparison actually has 2+ products to look at (see
// CompareContent) — distinct from compare_started (ProductCard), which
// fires per single item added to the list.
export interface CompareProductProperties {
  productIds: string[];
  count: number;
}

export interface BudgetCategorySelectedProperties {
  budget: string;
}

export interface ShopByNeedSelectedProperties {
  useCase: string;
}

export interface BeginCheckoutProperties {
  finalTotal: number;
  paymentMethod: string;
  itemCount: number;
}

export interface PaymentInfoProperties {
  paymentMethod: string;
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
  whatsapp_expert_click: WhatsappClickProperties;
  whatsapp_product_click: WhatsappProductClickProperties;
  remove_from_cart: RemoveFromCartProperties;
  view_item_list: ViewItemListProperties;
  select_item: SelectItemProperties;
  laptop_recommendation_started: RecommendationStartedProperties;
  laptop_recommendation_completed: RecommendationCompletedProperties;
  emi_info_viewed: EmiInfoViewedProperties;
  quality_report_viewed: QualityReportViewedProperties;
  compare_product: CompareProductProperties;
  budget_category_selected: BudgetCategorySelectedProperties;
  shop_by_need_selected: ShopByNeedSelectedProperties;
  begin_checkout: BeginCheckoutProperties;
  add_payment_info: PaymentInfoProperties;
  coupon_applied: CouponAppliedProperties;
  checkout_payment_failed: CheckoutPaymentFailedProperties;
  login: LoginProperties;
}
