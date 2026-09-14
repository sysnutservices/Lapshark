import axios from "axios";
// Falls back to production, so a build with no env set behaves exactly as the
// old hardcoded value did. Local dev overrides this via .env.development.local,
// which Next only loads when NODE_ENV=development — it can never leak into a
// production build even though .env files are not gitignored here.
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://lapshark.com/api";
export const WHATSAPP_URL = "https://wamigo.cloud";
export const api = axios.create({
    baseURL: API_URL,   // your backend URL
    withCredentials: false,                  // if using cookies auth
});

// api.ts is a plain module, not a component — it can't call useAuth()'s
// logout(). Clears the same localStorage keys logout() clears and hard-
// navigates instead; a full navigation remounts AuthContext, which reads
// the now-empty localStorage on mount, landing at the same end state.
const clearSessionAndRedirect = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
    } else {
        window.location.reload();
    }
};

// Guards against a reload storm: several admin pages fire multiple
// requests in parallel, and a real session-revocation cascades a 401 to
// all of them at once — without this, each one would independently reload.
let handledSessionExpiry = false;

// A revoked/expired token today just fails silently per-page (each call
// site's own try/catch shows an error banner) until the admin happens to
// navigate back through layout.tsx's gate. This makes it immediate --
// BUT only when there actually was a session to revoke: plenty of pages
// (the admin login page itself, any public page) fire requests against
// admin-only endpoints before the user is logged in at all -- StoreContext
// eagerly fetches /orders, /coupons, /users on mount regardless of auth
// state -- and those 401s are completely expected, not a revoked session.
// Treating every 401 as "log out and reload" turned that into an infinite
// reload loop on /admin/login itself (each reload re-fires the same
// requests, which 401 again), which is what actually broke admin login,
// not the account/password.
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401 && localStorage.getItem("token") && !handledSessionExpiry) {
            handledSessionExpiry = true;
            clearSessionAndRedirect();
        }
        return Promise.reject(err);
    }
);

