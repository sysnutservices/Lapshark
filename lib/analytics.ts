import { API_URL } from "@/api/api";
import type { AnalyticsEventName, AnalyticsEventPayloads } from "./analyticsEvents";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const CONSENT_KEY = "lapshark_cookie_consent";
const VISITOR_KEY = "lapshark_visitor_id";
const SESSION_KEY = "lapshark_session_id";
const SESSION_META_KEY = "lapshark_session_meta";

function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function parseUtm(search: string) {
  const params = new URLSearchParams(search);
  const utm = {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    term: params.get("utm_term") || undefined,
    content: params.get("utm_content") || undefined,
  };
  return Object.values(utm).some(Boolean) ? utm : undefined;
}

interface SessionContext {
  sessionId: string;
  utm?: Record<string, string | undefined>;
  referrer?: string;
  landingPage?: string;
}

// utm/referrer/landing-page are captured once, when a session first begins,
// and reused for every event in that session — sending them fresh on every
// call would mean a later page with no UTM params in its URL overwrites the
// visitor's real "last touch" with blanks on the backend.
function getSessionContext(): SessionContext {
  let sessionId: string | null = null;
  let meta: Omit<SessionContext, "sessionId"> | null = null;
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
    const raw = sessionStorage.getItem(SESSION_META_KEY);
    meta = raw ? JSON.parse(raw) : null;
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fall through to a
    // fresh in-memory-only session below.
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    meta = {
      utm: parseUtm(window.location.search),
      referrer: document.referrer || undefined,
      landingPage: window.location.pathname,
    };
    try {
      sessionStorage.setItem(SESSION_KEY, sessionId);
      sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    } catch {
      // ignore — session just won't persist across a reload this run
    }
  }

  return { sessionId, ...(meta || {}) };
}

function getUserId(): string | undefined {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const user = JSON.parse(raw);
    return user?.id || user?._id || undefined;
  } catch {
    return undefined;
  }
}

function send(payload: Record<string, unknown>) {
  const url = `${API_URL}/analytics/events`;
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // fall through to fetch
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // analytics failures must never surface to the caller
  });
}

// Only these have GA4 "recommended event" names / Meta standard-event
// names — everything else still gets forwarded (GA4 accepts any custom
// event name; Meta's fbq('trackCustom', ...) is exactly for this), just
// without the special commerce-shaped params built below.
const GA4_STANDARD_EVENTS: Partial<Record<AnalyticsEventName, string>> = {
  view_item: "view_item",
  add_to_cart: "add_to_cart",
  begin_checkout: "begin_checkout",
  wishlist_add: "add_to_wishlist",
  login: "login",
};

const META_STANDARD_EVENTS: Partial<Record<AnalyticsEventName, string>> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  wishlist_add: "AddToWishlist",
};

const COMMERCE_EVENTS: ReadonlySet<AnalyticsEventName> = new Set([
  "view_item",
  "add_to_cart",
  "wishlist_add",
]);

// Fans a tracked event out to whichever third-party providers are actually
// loaded (window.gtag/fbq/clarity only exist if their script ran, which
// only happens if the matching NEXT_PUBLIC_* env var is set — see
// app/layout.tsx). No-ops per-provider when that provider isn't present,
// so this is safe to call unconditionally from trackEvent().
function dispatchToProviders(name: AnalyticsEventName, properties: Record<string, unknown>, eventId: string) {
  const value = (properties.finalPrice ?? properties.price ?? properties.finalTotal) as number | undefined;

  if (typeof window.gtag === "function") {
    const ga4Name = GA4_STANDARD_EVENTS[name] || name;
    const params: Record<string, unknown> = { ...properties };
    if (COMMERCE_EVENTS.has(name)) {
      params.currency = "INR";
      params.value = value;
      params.items = [
        {
          item_id: properties.productId,
          item_name: properties.title,
          item_brand: properties.brand,
          item_category: properties.category,
          price: value,
        },
      ];
    } else if (name === "begin_checkout") {
      params.currency = "INR";
      params.value = properties.finalTotal;
    } else if (name === "page_view") {
      params.page_path = properties.path;
      params.page_title = properties.title;
      params.page_location = window.location.href;
    }
    window.gtag("event", ga4Name, params);
  }

  if (typeof window.fbq === "function") {
    const metaName = META_STANDARD_EVENTS[name];
    const data: Record<string, unknown> = {};
    if (properties.productId) data.content_ids = [properties.productId];
    if (properties.title) data.content_name = properties.title;
    if (value !== undefined) {
      data.value = value;
      data.currency = "INR";
    }

    if (name === "page_view") {
      window.fbq("track", "PageView", {}, { eventID: eventId });
    } else if (metaName) {
      window.fbq("track", metaName, data, { eventID: eventId });
    } else {
      window.fbq("trackCustom", name, data, { eventID: eventId });
    }
  }

  if (typeof window.clarity === "function") {
    if (name === "begin_checkout") window.clarity("set", "checkout_started", "true");
    if (name === "login") window.clarity("set", "customer_type", "returning");
  }
}

/**
 * Fire a tracking event. Never throws, never blocks the caller — safe to
 * call from any critical path (cart, checkout, auth) without awaiting.
 * No-ops entirely until the user has accepted cookies
 * (components/CookieConsent.tsx) — no visitor/session id is even generated
 * before that. Also fans out to GA4/Meta Pixel/Clarity when those scripts
 * are loaded (see app/layout.tsx) — nothing to configure per call site,
 * dispatchToProviders() maps the shared internal event onto each one.
 */
export function trackEvent<T extends AnalyticsEventName>(
  name: T,
  properties?: AnalyticsEventPayloads[T]
) {
  if (typeof window === "undefined") return;
  try {
    if (!hasConsent()) return;

    const visitorId = getVisitorId();
    const { sessionId, utm, referrer } = getSessionContext();
    const eventId = crypto.randomUUID();
    const props = (properties || {}) as Record<string, unknown>;

    send({
      eventName: name,
      visitorId,
      sessionId,
      eventId,
      userId: getUserId(),
      properties: props,
      page: {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
      },
      utm,
      referrer,
    });

    dispatchToProviders(name, props, eventId);
  } catch {
    // trackEvent must never throw into the caller.
  }
}

/**
 * No-op beyond confirming an id is available: trackEvent() already reads
 * the current userId fresh from localStorage on every call, so once
 * AuthContext's loginWithUser sets localStorage["user"], every subsequent
 * trackEvent automatically carries the known userId — that's the entire
 * anonymous-visitor-to-customer merge, no separate step needed. Exported
 * for API completeness / a future provider that might need an explicit
 * identify call site.
 */
export function identifyCustomer(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return getUserId();
}

export function trackPageView(path: string, title?: string) {
  trackEvent("page_view", {
    path,
    title,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
  });
}

/**
 * A fresh id to mint once at the start of checkout (see
 * CheckoutContent.tsx) and carry through: sent to the backend with the
 * order (Order.metaEventId), reused here for the Purchase conversion fired
 * on success, and reused again server-side for the Meta CAPI Purchase call
 * in markOrderPaid — the one shared id is what lets Meta dedupe the browser
 * Pixel hit and the server CAPI hit into a single conversion.
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Fires the GA4 `purchase` / Meta Pixel `Purchase` conversion on checkout
 * success. Deliberately does NOT go through trackEvent()/the backend —
 * markOrderPaid already records the first-party purchase event and the
 * Meta CAPI echo server-side (see orderController.ts), which is the
 * reliable path that doesn't depend on this redirect actually completing.
 * This call is purely for the two providers that need a browser-side hit.
 */
export function trackPurchaseConversion(params: {
  eventId: string;
  orderId: string;
  total: number;
  items: Array<{ productId: string; title: string; quantity: number; finalPrice?: number; price?: number }>;
}) {
  if (typeof window === "undefined") return;
  try {
    if (!hasConsent()) return;

    if (typeof window.gtag === "function") {
      window.gtag("event", "purchase", {
        transaction_id: params.orderId,
        value: params.total,
        currency: "INR",
        items: params.items.map((i) => ({
          item_id: i.productId,
          item_name: i.title,
          price: i.finalPrice ?? i.price,
          quantity: i.quantity,
        })),
      });
    }

    if (typeof window.fbq === "function") {
      window.fbq(
        "track",
        "Purchase",
        {
          value: params.total,
          currency: "INR",
          content_ids: params.items.map((i) => i.productId),
          contents: params.items.map((i) => ({ id: i.productId, quantity: i.quantity })),
        },
        { eventID: params.eventId }
      );
    }

    if (typeof window.clarity === "function") {
      window.clarity("set", "purchase_completed", "true");
    }
  } catch {
    // never throw into the caller
  }
}
