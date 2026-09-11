import { API_URL } from "@/api/api";

// Server-side site-config fetch for pages that need admin-saved contact
// info (phone/address) in their initial HTML — same shape/convention as
// getProductsServer(). revalidate: 60 matches the backend's own
// publicCache max-age on /site-config (see app/layout.tsx's analytics
// fetch, which uses the same value for the same reason).
export async function getSiteConfigServer(): Promise<{ contact?: { phone?: string; address?: string; email?: string } } | null> {
  try {
    const res = await fetch(`${API_URL}/site-config`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
