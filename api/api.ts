import axios from "axios";
export const API_URL = "https://express-opal-six.vercel.app/api";
export const API_URL2 = "https://express-opal-six.vercel.app";
// export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
// export const API_URL2 = process.env.NEXT_PUBLIC_API_URL_ROOT || "http://localhost:5000";
export const api = axios.create({
    baseURL: API_URL,   // your backend URL
    withCredentials: false,                  // if using cookies auth
});
