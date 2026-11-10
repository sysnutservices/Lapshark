// Sales Ambassador referral capture (distribution/docs/07-attribution.md).
//
// Any page accepts ?ref=LSA-000101. The first valid code is kept for 30 days
// and is NOT overwritten by a later, different code (first valid source
// wins). The server re-validates everything — this is only a carrier.

const KEY = "lapshark_ref";
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_RE = /^LSA-\d{6}$/;

interface StoredReferral {
    code: string;
    capturedAt: string; // ISO
}

function read(): StoredReferral | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const v = JSON.parse(raw) as StoredReferral;
        if (!CODE_RE.test(v.code) || Date.now() - new Date(v.capturedAt).getTime() > WINDOW_MS) {
            localStorage.removeItem(KEY);
            return null;
        }
        return v;
    } catch {
        localStorage.removeItem(KEY);
        return null;
    }
}

export function captureReferralFromUrl(): void {
    if (typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
    if (!code || !CODE_RE.test(code)) return;
    if (read()) return; // an unexpired earlier code wins
    try {
        localStorage.setItem(KEY, JSON.stringify({ code, capturedAt: new Date().toISOString() }));
    } catch {
        /* storage full / disabled — referral simply not carried */
    }
}

// Fields to spread into the /orders/create body.
export function referralForCheckout(): { referralCode?: string; referralCapturedAt?: string } {
    const v = read();
    return v ? { referralCode: v.code, referralCapturedAt: v.capturedAt } : {};
}
