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

