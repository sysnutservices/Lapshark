// Client for the dealer channel API (distribution/docs/13-dealer-channel.md).
// Unlike the partner API, dealer money fields are integer PAISE (named *Paise).
import { api } from "@/api/api";

const auth = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export type DealerStatus = "applied" | "approved" | "suspended" | "rejected";
export type DealerOrderStatus = "placed" | "paid" | "packed" | "dispatched" | "delivered" | "cancelled";
export type PaymentMethod = "bank_transfer" | "cash";
export type ClaimType = "transit_damage" | "not_as_described" | "warranty";
export type ClaimStatus = "open" | "replacement" | "credit_note" | "repair" | "rejected";

export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
}

export interface DealerProfile {
    id: string;
    dealerCode: string;
    status: DealerStatus;
    businessName: string;
    contactName: string;
    phone: string;
    email: string | null;
    address: Address;
    gstinMasked: string | null;
    panMasked: string | null;
    agreementVersion: string;
    createdAt: string;
}

// Vetting answers on an application (and business type / volume on an
// enquiry). Codes mirror DEALER_* in the backend's dealer/logic.ts.
export const BUSINESS_TYPE_LABEL = {
    retail_shop: "Laptop or computer shop",
    online_seller: "Online seller (Amazon, Flipkart, Instagram, own site)",
    it_reseller: "IT services or corporate supplier",
    refurbisher: "Refurbisher or repair shop",
    other: "Other",
} as const;
export const YEARS_IN_BUSINESS_LABEL = { lt1: "Less than 1 year", "1to3": "1 to 3 years", "3to5": "3 to 5 years", "5plus": "More than 5 years" } as const;
export const MONTHLY_VOLUME_LABEL = { "1to5": "1 to 5 laptops", "6to20": "6 to 20 laptops", "21to50": "21 to 50 laptops", "50plus": "More than 50 laptops" } as const;
export type BusinessType = keyof typeof BUSINESS_TYPE_LABEL;
export type YearsInBusiness = keyof typeof YEARS_IN_BUSINESS_LABEL;
export type MonthlyVolume = keyof typeof MONTHLY_VOLUME_LABEL;

export interface DealerVetting {
    businessType: BusinessType;
    yearsInBusiness: YearsInBusiness;
    monthlyVolume: MonthlyVolume;
    interests?: string;
}

export type DealerEnquiryStatus = "new" | "contacted" | "closed";
export interface DealerEnquiry {
    id: string;
    phone: string;
    businessName: string;
    contactName: string;
    city: string;
    businessType: BusinessType;
    monthlyVolume: MonthlyVolume;
    message: string;
    source: { utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string };
    status: DealerEnquiryStatus;
    statusAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export const ENQUIRY_STATUS_LABEL: Record<DealerEnquiryStatus, string> = { new: "New", contacted: "Contacted", closed: "Closed" };

export interface DealerProgramme {
    enabled: boolean;
    registrationOpen: boolean;
    agreementVersion: string;
    claimWindowDays: number;
}

export interface CatalogueProduct {
    productId: string;
    title: string;
    brand?: string;
    category?: string;
    slug?: string;
    condition?: string;
    image?: string;
    specs?: Record<string, string>;
    stock: number;
    listedPricePaise: number;
    pricePaise: number;
    warranty: { months: number; pricePaise: number } | null;
}

export interface DealerOrderLine {
    id: string;
    productId: string;
    title: string;
    condition?: string;
    image?: string;
    quantity: number;
    unitPricePaise: number;
    warrantyMonths: number;
    warrantyPricePaise: number;
    lineTotalPaise: number;
    serials: string[];
}

export interface DealerClaim {
    id: string;
    type: ClaimType;
    serial: string;
    description: string;
    evidenceUrl?: string;
    status: ClaimStatus;
    resolutionNote?: string;
    decidedAt?: string;
    createdAt: string;
}

export interface DealerOrder {
    id: string;
    orderNumber: string;
    dealerCode: string;
    businessName: string;
    status: DealerOrderStatus;
    lines: DealerOrderLine[];
    totalPaise: number;
    paidPaise: number;
    duePaise: number;
    paymentMethod: PaymentMethod;
    payments: { id: string; method: PaymentMethod; amountPaise: number; reference: string; receivedAt: string; recordedAt?: string; note?: string }[];
    fulfilment: { method: "courier" | "pickup"; address?: Address; courier?: string; awb?: string; handedTo?: string };
    statusHistory: { status: DealerOrderStatus; at: string; note?: string }[];
    invoiceRef: { number?: string; note?: string } | null;
    dealerNote: string | null;
    cancelReason: string | null;
    refundNote?: string | null;
    paidAt?: string;
    packedAt?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
    claims: DealerClaim[];
    createdAt: string;
    dealerId?: string;
}

export interface PaymentInstructions {
    bankTransfer: string | null;
    pickup: string | null;
    cashLimitPaise: number;
}

export const dealerApi = {
    programme: () => api.get<DealerProgramme>("/dealers/programme").then((r) => r.data),
    profile: () => api.get<{ profile: DealerProfile | null; programme: DealerProgramme }>("/dealers/profile", { headers: auth() }).then((r) => r.data),
    enquire: (body: unknown) => api.post<{ ok: true; alreadyEnquired: boolean }>("/dealers/enquiries", body).then((r) => r.data),
    register: (body: unknown) => api.post<{ profile: DealerProfile }>("/dealers/register", body, { headers: auth() }).then((r) => r.data),
    catalogue: () => api.get<{ products: CatalogueProduct[] }>("/dealers/catalogue", { headers: auth() }).then((r) => r.data),
    orders: () => api.get<{ orders: DealerOrder[] }>("/dealers/orders", { headers: auth() }).then((r) => r.data),
    order: (id: string) =>
        api
            .get<{ order: DealerOrder; payment: PaymentInstructions; claimWindowDays: number; units: { serial: string; warrantyMonths: number; warrantyUntil: string | null }[] }>(`/dealers/orders/${id}`, { headers: auth() })
            .then((r) => r.data),
    placeOrder: (body: unknown) => api.post<{ order: DealerOrder; payment: PaymentInstructions }>("/dealers/orders", body, { headers: auth() }).then((r) => r.data),
    cancel: (id: string) => api.post<{ order: DealerOrder }>(`/dealers/orders/${id}/cancel`, {}, { headers: auth() }).then((r) => r.data),
    claim: (id: string, body: unknown) => api.post<{ order: DealerOrder }>(`/dealers/orders/${id}/claims`, body, { headers: auth() }).then((r) => r.data),
};

export const dealerAdminApi = {
    get: <T = any>(path: string, params?: Record<string, string>) => api.get<T>(path, { headers: auth(), params }).then((r) => r.data),
    post: <T = any>(path: string, body?: unknown) => api.post<T>(path, body ?? {}, { headers: auth() }).then((r) => r.data),
    patch: <T = any>(path: string, body?: unknown) => api.patch<T>(path, body ?? {}, { headers: auth() }).then((r) => r.data),
    put: <T = any>(path: string, body?: unknown) => api.put<T>(path, body ?? {}, { headers: auth() }).then((r) => r.data),
};

export const rs = (paise: number | null | undefined) =>
    paise === null || paise === undefined ? "—" : "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// "18,500" or "18500.50" typed by an admin -> paise. NaN for anything else.
export const rupeesInputToPaise = (v: string): number => {
    const t = v.replace(/[,\s₹]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
    return Math.round(Number(t) * 100);
};

export const ORDER_STATUS_LABEL: Record<DealerOrderStatus, string> = {
    placed: "Awaiting payment",
    paid: "Paid, being packed",
    packed: "Packed",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

export const orderTone = (s: DealerOrderStatus) =>
    (({ placed: "amber", paid: "blue", packed: "teal", dispatched: "teal", delivered: "green", cancelled: "red" }) as const)[s];

export const DEALER_STATUS_LABEL: Record<DealerStatus, string> = { applied: "Under review", approved: "Approved", suspended: "Suspended", rejected: "Rejected" };

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
    transit_damage: "Damaged in transit",
    not_as_described: "Doesn't match the order",
    warranty: "Warranty repair",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
    open: "Open",
    replacement: "Replacement",
    credit_note: "Credit note",
    repair: "Repair",
    rejected: "Rejected",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = { bank_transfer: "Bank transfer", cash: "Cash" };
