import { API_URL } from "@/api/api";
import type { AnalyticsEventName, AnalyticsEventPayloads } from "./analyticsEvents";

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

/**
 * Fire a tracking event. Never throws, never blocks the caller — safe to
 * call from any critical path (cart, checkout, auth) without awaiting.
 * No-ops entirely until the user has accepted cookies
 * (components/CookieConsent.tsx) — no visitor/session id is even generated
 * before that.
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

    send({
      eventName: name,
      visitorId,
      sessionId,
      userId: getUserId(),
      properties: properties || {},
      page: {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
      },
      utm,
      referrer,
    });
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
 * for API completeness / a future provider (e.g. Meta CAPI) that might need
 * an explicit identify call site.
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
