"use client";

// Small shared building blocks for the partner portal and the admin
// ambassador CRM — plain Tailwind to match the existing admin pages.
import React from "react";
import { LucideIcon, Loader2 } from "lucide-react";

// Lapshark teal for the partner pages (portal, register). The admin CRM uses
// these same primitives without it and keeps its blue fallbacks.
// unslop pass, Damir Sokolovsky (@heydamir), CC BY 4.0.
export const PARTNER_THEME = {
    "--p-accent": "#0f766e", "--p-accent-hover": "#115e59", "--p-muted": "#6b7487", "--p-radius": "10px",
    "--p-info-bg": "#eceff4", "--p-info-border": "rgba(17,24,39,0.08)", "--p-info-text": "#111827", "--p-info-ring": "rgba(17,24,39,0.12)",
} as React.CSSProperties;

export function Field({ label, error, hint, children, className = "" }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
    return (
        <label className={`block ${className}`}>
            <span className="block text-sm font-medium text-slate-700">{label}</span>
            <div className="mt-1">{children}</div>
            {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
        </label>
    );
}

export const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--p-accent,#2563EB)] focus:outline-none focus:ring-2 focus:ring-[var(--p-accent,#2563EB)]/20 disabled:bg-slate-100";

export function Btn({ children, variant = "primary", loading, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; loading?: boolean }) {
    const styles = {
        primary: "bg-[var(--p-accent,#2563EB)] text-white hover:bg-[var(--p-accent-hover,#1d4ed8)]",
        secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
        ghost: "text-slate-600 hover:bg-slate-100",
    }[variant];
    return (
        <button {...props} disabled={props.disabled || loading} className={`inline-flex items-center justify-center gap-2 rounded-[var(--p-radius,0.5rem)] px-4 py-2 text-sm font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function Stat({ label, value, icon: Icon, tone = "blue" }: { label: string; value: React.ReactNode; icon: LucideIcon; tone?: "blue" | "teal" | "navy" | "amber" | "slate" }) {
    const t = {
        blue: "bg-blue-50 text-[#2563EB]",
        teal: "bg-teal-50 text-[#309286]",
        navy: "bg-sky-50 text-[#084a83]",
        amber: "bg-amber-50 text-amber-600",
        slate: "bg-slate-100 text-slate-600",
    }[tone];
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <span className={`rounded-lg p-2.5 ${t}`}><Icon className="w-5 h-5" /></span>
            <div className="min-w-0">
                <p className="text-xs font-medium leading-snug text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
            </div>
        </div>
    );
}

const PILL: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    blue: "bg-[var(--p-info-bg,#eff6ff)] text-[var(--p-info-text,#1d4ed8)] ring-[var(--p-info-ring,rgba(37,99,235,0.2))]",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-rose-50 text-rose-700 ring-rose-600/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
    teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
};

export function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: keyof typeof PILL }) {
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PILL[tone]}`}>{children}</span>;
}

export const statusTone = (s: string): keyof typeof PILL =>
    ({
        active: "green", approved: "teal", application_submitted: "blue", verification_pending: "amber", suspended: "amber", rejected: "red", terminated: "red",
        new: "blue", contacted: "slate", qualified: "teal", quotation_sent: "blue", negotiation: "amber", won: "green", lost: "red",
        pending: "amber", delivery_confirmed: "teal", eligible: "blue", processing: "blue", paid: "green", reversed: "red",
    } as Record<string, keyof typeof PILL>)[s] || "slate";

export function Banner({ tone = "blue", children }: { tone?: "blue" | "amber" | "red" | "green"; children: React.ReactNode }) {
    const t = { blue: "bg-[var(--p-info-bg,#eff6ff)] border-[var(--p-info-border,#bfdbfe)] text-[var(--p-info-text,#1e40af)]", amber: "bg-amber-50 border-amber-200 text-amber-800", red: "bg-rose-50 border-rose-200 text-rose-800", green: "bg-emerald-50 border-emerald-200 text-emerald-800" }[tone];
    return <div className={`rounded-lg border px-4 py-3 text-sm ${t}`}>{children}</div>;
}

export function Spinner() {
    return (
        <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--p-muted,#2563EB)]" strokeWidth={1.5} />
        </div>
    );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-slate-800">{title}</p>
            {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
    React.useEffect(() => {
        if (!open) return;
        const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} className={`mt-10 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Close">×</button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
