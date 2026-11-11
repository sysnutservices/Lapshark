// Thin client for the Sales Ambassador API (distribution/docs/04-api.md).
// All money values from the API are rupees (the server converts from paise).
import { api } from "@/api/api";

const auth = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export type PartnerType = "referral" | "independent";
export type PartnerStatus =
    | "application_submitted"
    | "verification_pending"
    | "approved"
    | "active"
    | "suspended"
    | "rejected"
    | "terminated";
export type LeadStatus = "new" | "contacted" | "qualified" | "quotation_sent" | "negotiation" | "won" | "lost";
export type CommissionStatus = "pending" | "delivery_confirmed" | "eligible" | "approved" | "processing" | "paid" | "reversed";

export interface PartnerProfile {
    _id: string;
    partnerCode: string;
    partnerType: PartnerType;
    status: PartnerStatus;
    fullName: string;
    email: string;
    emailVerified: boolean;
    phone: string;
    city: string;
    state: string;
    pan: { masked: string } | null;
    payout: { method: "upi" | "bank"; masked: string } | null;
    agreement: { version: string; acceptedAt: string } | null;
    orientationCompletedAt?: string;
    rejectionReason?: string;
    suspensionReason?: string;
    createdAt: string;
}

export interface Programme {
    programmeEnabled: boolean;
    registrationOpen: boolean;
    agreementVersion: string;
    minimumAge: number;
    leadOwnershipDays: number;
    // Real counts from the database — the landing page's live counter.
    cohort: { size: number; taken: number };
    interestCount: number;
}

export interface Lead {
    _id: string;
    customerName: string;
    phone: string;
    email?: string;
    location?: string;
    customerType: string;
    requirements?: string;
    preferredSpecs?: string;
    budget: number | null;
    source?: string;
    status: LeadStatus;
    followUpAt?: string | null;
    notes?: string;
    ownershipExpiresAt: string;
    ownershipActive: boolean;
    existingCustomer: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LeadActivity {
    _id: string;
    type: string;
    actorType: string;
    description: string;
    createdAt: string;
}

export interface PartnerProduct {
    _id: string;
    title: string;
    slug?: string;
    brand: string;
    category: string;
    image: string;
    specs?: Record<string, string>;
    condition: string;
    batteryHealthPercent: number | null;
    warrantyOptions: string[];
    mrp: number;
    sellingPrice: number;
    offerLabel?: string;
    stockStatus: "in_stock" | "low_stock";
    productUrl: string | null;
    partnerMinimumPrice?: number | null;
    // Independent partners only (quotation builder).
    configOptions?: { ram: ConfigOption[]; storage: ConfigOption[]; warranty: ConfigOption[] };
    stock?: number;
}

export interface ConfigOption {
    value: string;
    label: string;
    price: number;
}

export type QuoteStatus = "draft" | "pending_approval" | "active" | "expired" | "rejected" | "superseded" | "cancelled" | "converted";

export interface QuoteItem {
    _id?: string;
    productId: string;
    title: string;
    image?: string;
    slug?: string;
    config: { ram?: string; storage?: string; warranty?: string };
    configLabels: string[];
    quantity: number;
    listedUnitPrice: number;
    floorUnitPrice: number | null;
    quotedUnitPrice: number;
    level: 1 | 2 | 3;
    estCommissionPerUnit: number;
    commissionApproved: boolean;
}

export interface Quotation {
    _id: string;
    quoteNumber: string;
    version: number;
    leadId?: string;
    customer: { name: string; phone: string; email?: string; location?: string };
    customerNote?: string;
    status: QuoteStatus;
    validUntil: string | null;
    createdAt: string;
    convertedOrderNumber?: string;
    items: QuoteItem[];
    totals: { listed: number; quoted: number; discount: number; estCommission: number; shipping: number };
    shareUrl: string | null;
}

export interface PublicQuote {
    quoteNumber: string;
    version: number;
    status: QuoteStatus;
    validUntil: string | null;
    createdAt: string;
    customer: { name: string };
    customerNote?: string;
    preparedBy: { firstName: string; partnerCode: string } | null;
    items: { productId: string; title: string; image?: string; slug?: string; config: { ram?: string; storage?: string; warranty?: string }; configLabels: string[]; quantity: number; listedUnitPrice: number; unitPrice: number }[];
    totals: { listed: number; total: number; savings: number; shipping: number };
    terms: string[];
}

export interface QuoteLineInput {
    productId: string;
    quantity: number;
    unitPrice: number;
    config: { ram?: string; storage?: string; warranty?: string };
}

export interface Commission {
    _id: string;
    orderNumber: string;
    productTitle: string;
    quantity: number;
    unitSellingPrice: number;
    commission: number;
    status: CommissionStatus;
    onHold: boolean;
    holdNote?: string;
    attributionType: string;
    ruleVersion: number | null;
    calcReason: string;
    deliveredAt?: string;
    reversedAt?: string;
    reversalReason?: string;
    createdAt: string;
}

export interface Payout {
    _id: string;
    payoutNumber: string;
    status: "processing" | "paid" | "failed";
    method: "upi" | "bank";
    destinationMasked: string;
    gross: number;
    adjustments: number;
    tdsPercent: number;
    tds: number;
    net: number;
    commissionCount: number;
    adjustmentCount: number;
    reference?: string;
    paidAt?: string;
    failureReason?: string;
    createdAt: string;
}

export interface PayoutSummary {
    summary: { eligible: number; approved: number; inPayout: number; openAdjustments: number };
    adjustments: { amount: number; reason: string; kind: string; createdAt: string }[];
    payouts: Payout[];
}

export interface Dashboard {
    partner: { partnerCode: string; partnerType: PartnerType; fullName: string };
    cards: {
        totalLeads: number;
        activeLeads: number;
        quotationsSent: number;
        followUpsDue: number;
        ordersCompleted: number;
        laptopsSold: number;
        totalSales: number;
        pendingCommission: number;
        approvedCommission: number;
        paidCommission: number;
    };
    leadConversion: { total: number; won: number; rate: number };
    leadsByStatus: Record<string, number>;
    monthly: { month: string; commission: number; units: number }[];
}

export const partnerApi = {
    programme: () => api.get<Programme>("/partners/programme").then((r) => r.data),
    joinWaitlist: (body: unknown) => api.post<{ ok: boolean; alreadyOnList: boolean; waitingCount: number }>("/partners/waitlist", body).then((r) => r.data),
    profile: () => api.get<{ profile: PartnerProfile; programmeEnabled: boolean }>("/partners/profile", { headers: auth() }).then((r) => r.data),
    register: (body: unknown) => api.post<{ profile: PartnerProfile }>("/partners/register", body, { headers: auth() }).then((r) => r.data),
    completeOrientation: () => api.post<{ profile: PartnerProfile }>("/partners/orientation/complete", {}, { headers: auth() }).then((r) => r.data),
    dashboard: () => api.get<Dashboard>("/partners/dashboard", { headers: auth() }).then((r) => r.data),
    referralLink: () => api.get<{ code: string; url: string }>("/partners/referral-link", { headers: auth() }).then((r) => r.data),
    products: (params: Record<string, string>) => api.get<{ products: PartnerProduct[]; count: number }>("/partners/products", { headers: auth(), params }).then((r) => r.data),
    leads: (params: Record<string, string>) => api.get<{ leads: Lead[]; total: number; page: number; pageSize: number }>("/partners/leads", { headers: auth(), params }).then((r) => r.data),
    lead: (id: string) => api.get<{ lead: Lead; activities: LeadActivity[] }>(`/partners/leads/${id}`, { headers: auth() }).then((r) => r.data),
    createLead: (body: unknown) => api.post<{ lead: Lead; notice?: string }>("/partners/leads", body, { headers: auth() }).then((r) => r.data),
    updateLead: (id: string, body: unknown) => api.patch<{ lead: Lead }>(`/partners/leads/${id}`, body, { headers: auth() }).then((r) => r.data),
    addNote: (id: string, note: string) => api.post(`/partners/leads/${id}/activities`, { note }, { headers: auth() }).then((r) => r.data),
    quotePreview: (items: QuoteLineInput[]) =>
        api.post<{ items: QuoteItem[]; totals: Quotation["totals"]; needsApproval: boolean }>("/partners/quotations/price", { items }, { headers: auth() }).then((r) => r.data),
    quotations: (params: Record<string, string>) =>
        api.get<{ quotations: Quotation[]; total: number; page: number; pageSize: number }>("/partners/quotations", { headers: auth(), params }).then((r) => r.data),
    quotation: (id: string) =>
        api
            .get<{ quotation: Quotation; versions: { _id: string; version: number; status: QuoteStatus; total: number; createdAt: string }[]; discountRequest: { status: string; reason: string; decisionNote?: string; decidedAt?: string } | null }>(`/partners/quotations/${id}`, { headers: auth() })
            .then((r) => r.data),
    createQuotation: (body: unknown) => api.post<{ quotation: Quotation }>("/partners/quotations", body, { headers: auth() }).then((r) => r.data),
    reviseQuotation: (id: string, body: unknown) => api.post<{ quotation: Quotation }>(`/partners/quotations/${id}/revise`, body, { headers: auth() }).then((r) => r.data),
    cancelQuotation: (id: string) => api.post(`/partners/quotations/${id}/cancel`, {}, { headers: auth() }).then((r) => r.data),
    payouts: () => api.get<PayoutSummary>("/partners/payouts", { headers: auth() }).then((r) => r.data),
    publicQuote: (token: string) => api.get<{ quotation: PublicQuote }>(`/quotes/${encodeURIComponent(token)}`).then((r) => r.data),
    commissions: (params: Record<string, string>) => api.get<{ commissions: Commission[]; total: number; page: number; pageSize: number }>("/partners/commissions", { headers: auth(), params }).then((r) => r.data),
};

// Admin endpoints — loosely typed; the admin page shapes them for display.
export const partnerAdminApi = {
    get: <T = any>(path: string, params?: Record<string, string>) => api.get<T>(path, { headers: auth(), params }).then((r) => r.data),
    post: <T = any>(path: string, body?: unknown) => api.post<T>(path, body ?? {}, { headers: auth() }).then((r) => r.data),
    patch: <T = any>(path: string, body?: unknown) => api.patch<T>(path, body ?? {}, { headers: auth() }).then((r) => r.data),
    put: <T = any>(path: string, body?: unknown) => api.put<T>(path, body ?? {}, { headers: auth() }).then((r) => r.data),
    // Payout batches: the same key always returns the same payouts (never pays twice).
    postIdempotent: <T = any>(path: string, key: string, body?: unknown) =>
        api.post<T>(path, body ?? {}, { headers: { ...auth(), "Idempotency-Key": key } }).then((r) => r.data),
};

export const newIdempotencyKey = () =>
    (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, "");

export function apiError(err: any): { message: string; errors: Record<string, string>; status?: number; code?: string } {
    const d = err?.response?.data;
    return {
        message: d?.message || "Something went wrong. Please try again.",
        errors: d?.errors || {},
        status: err?.response?.status,
        code: d?.code,
    };
}

export const inr = (n: number | null | undefined) =>
    n === null || n === undefined ? "—" : (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    quotation_sent: "Quotation sent",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
};

export const COMMISSION_STATUS_LABEL: Record<CommissionStatus, string> = {
    pending: "Pending",
    delivery_confirmed: "Delivered",
    eligible: "Eligible",
    approved: "Approved",
    processing: "Processing",
    paid: "Paid",
    reversed: "Reversed",
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
    draft: "Draft",
    pending_approval: "Waiting for approval",
    active: "Active",
    expired: "Expired",
    rejected: "Special price rejected",
    superseded: "Replaced by newer version",
    cancelled: "Cancelled",
    converted: "Order placed",
};

export const quoteTone = (s: QuoteStatus) =>
    (({ active: "green", pending_approval: "amber", converted: "teal", expired: "slate", rejected: "red", cancelled: "slate", superseded: "slate", draft: "slate" }) as const)[s];

export const PRICING_LEVEL_LABEL: Record<1 | 2 | 3, string> = {
    1: "Listed price",
    2: "Negotiated",
    3: "Special approval",
};

export const PARTNER_STATUS_LABEL: Record<PartnerStatus, string> = {
    application_submitted: "Application submitted",
    verification_pending: "Verification pending",
    approved: "Approved",
    active: "Active",
    suspended: "Suspended",
    rejected: "Rejected",
    terminated: "Terminated",
};
