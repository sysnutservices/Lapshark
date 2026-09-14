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

// A revoked/expired token today just fails silently per-page (each call
// site's own try/catch shows an error banner) until the admin happens to
// navigate back through layout.tsx's gate. This makes it immediate.
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) clearSessionAndRedirect();
        return Promise.reject(err);
    }
);

