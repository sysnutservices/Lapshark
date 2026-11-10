"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, FileText, IndianRupee, LayoutDashboard, Laptop, Link2, ShieldAlert, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CheckoutLogin } from "@/components/LoginComponent";
import { apiError, partnerApi, PartnerProfile, PARTNER_STATUS_LABEL } from "@/lib/partnerApi";
import { Banner, Btn, Card, PARTNER_THEME, Spinner } from "@/components/partner/ui";
import { PartnerCtx } from "@/components/partner/PartnerContext";


const NAV = [
    { href: "/partner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/partner/products", label: "Laptop Catalogue", icon: Laptop },
    { href: "/partner/leads", label: "My Customers", icon: Users },
    { href: "/partner/quotations", label: "Quotations", icon: FileText, independentOnly: true },
    { href: "/partner/earnings", label: "My Earnings", icon: IndianRupee },
    { href: "/partner/dashboard#referral", label: "Referral Link", icon: Link2 },
];

const ORIENTATION = [
    "Customers always pay Lapshark directly, on lapshark.com or a Lapshark invoice. Never accept money personally.",
    "Share only the specifications, condition and warranty shown in the catalogue. Never promise more.",
    "Your referral link credits sales to you for 30 days from the customer's first visit.",
    "Register customers as leads (with their consent) so their orders are credited to you even without the link.",
    "A customer already owned by another partner can't be registered by you for 30 days.",
    "Commission is recorded when the customer pays, confirmed on delivery, and paid after payment clears and the return window passes.",
    "Commission is reversed for cancellations, returns-to-origin and refunds.",
];

export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [profile, setProfile] = useState<PartnerProfile | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "not_registered" | "disabled" | "error">("loading");
    const [error, setError] = useState("");
    const [orientating, setOrientating] = useState(false);
    const [ack, setAck] = useState(false);

    const load = useCallback(() => {
        if (!user) return;
        setState("loading");
        partnerApi
            .profile()
            .then((r) => {
                setProfile(r.profile);
                setState(r.programmeEnabled ? "ready" : "disabled");
            })
            .catch((err) => {
                const e = apiError(err);
                if (e.code === "NOT_REGISTERED" || e.status === 404) setState("not_registered");
                else {
                    setError(e.message);
                    setState("error");
                }
            });
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const shell = (body: React.ReactNode) => <div style={PARTNER_THEME} className="min-h-[70vh] bg-[#f5f7fa] py-12"><div className="max-w-xl mx-auto px-4">{body}</div></div>;

    if (!user) {
        return shell(
            <>
                <h1 className="text-2xl font-medium text-slate-900 mb-4">Partner sign in</h1>
                <CheckoutLogin showLogo={false} />
                <p className="mt-4 text-sm text-slate-600 text-center">Not a partner yet? <Link href="/partner" className="text-[#0f766e] font-medium">Learn about the programme</Link></p>
            </>
        );
    }
    if (state === "loading") return shell(<Spinner />);
    if (state === "error") return shell(<Banner tone="red">{error}</Banner>);
    if (state === "disabled") return shell(<Banner tone="amber">The partner programme is temporarily unavailable. Please check back soon.</Banner>);
    if (state === "not_registered" || !profile) {
        return shell(
            <Card className="text-center py-10">
                <h1 className="text-xl font-medium text-slate-900">You&apos;re not a Lapshark partner yet</h1>
                <p className="mt-2 text-slate-600">Apply in a few minutes. Registration is free.</p>
                <Link href="/partner/register" className="mt-6 inline-block rounded-lg bg-[#0f766e] px-5 py-2.5 text-sm font-medium text-white">Apply now</Link>
            </Card>
        );
    }

    if (profile.status === "application_submitted" || profile.status === "verification_pending") {
        return shell(
            <Card className="text-center py-10">
                <Clock className="w-10 h-10 mx-auto text-amber-500" />
                <h1 className="mt-3 text-xl font-medium text-slate-900">Application under review</h1>
                <p className="mt-2 text-slate-600">Partner ID <span className="font-mono font-medium">{profile.partnerCode}</span> · {PARTNER_STATUS_LABEL[profile.status]}</p>
                <p className="mt-2 text-sm text-slate-500">We&apos;ll let you know once it has been reviewed.</p>
            </Card>
        );
    }

    if (profile.status === "approved") {
        const finish = async () => {
            setOrientating(true);
            try {
                await partnerApi.completeOrientation();
                load();
            } catch (err) {
                setError(apiError(err).message);
            } finally {
                setOrientating(false);
            }
        };
        return shell(
            <Card>
                <h1 className="text-xl font-medium text-slate-900">Your application is approved</h1>
                <p className="mt-1 text-sm text-slate-600">A quick orientation before you start</p>
                <ol className="mt-4 space-y-2 text-sm text-slate-700 list-decimal pl-5">{ORIENTATION.map((o) => <li key={o}>{o}</li>)}</ol>
                <label className="mt-5 flex items-start gap-3 text-sm text-slate-800">
                    <input type="checkbox" className="mt-1" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                    I understand how the programme, pricing and commission work.
                </label>
                {error && <div className="mt-3"><Banner tone="red">{error}</Banner></div>}
                <div className="mt-5 flex justify-end"><Btn onClick={finish} disabled={!ack} loading={orientating}>Activate my partner account</Btn></div>
            </Card>
        );
    }

    if (profile.status !== "active") {
        return shell(
            <Card className="text-center py-10">
                <ShieldAlert className="w-10 h-10 mx-auto text-rose-500" />
                <h1 className="mt-3 text-xl font-medium text-slate-900">Partner account {PARTNER_STATUS_LABEL[profile.status].toLowerCase()}</h1>
                {(profile.rejectionReason || profile.suspensionReason) && <p className="mt-2 text-slate-600">{profile.rejectionReason || profile.suspensionReason}</p>}
                <p className="mt-2 text-sm text-slate-500">Contact Lapshark if you have questions.</p>
            </Card>
        );
    }

    return (
        <PartnerCtx.Provider value={{ profile, reload: load }}>
            <div style={PARTNER_THEME} className="bg-[#f5f7fa] min-h-[80vh]">
                <div className="bg-white border-b border-[#111827]/[0.08]">
                    <div className="max-w-7xl mx-auto px-4 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[13px] text-[#6b7487]">Lapshark partner · {profile.partnerType === "independent" ? "Independent Sales Ambassador" : "Referral Ambassador"}</p>
                            <p className="mt-0.5 text-[17px] font-medium text-[#111827]">{profile.fullName} <span className="ml-2 font-mono text-[13px] font-normal text-[#6b7487]">{profile.partnerCode}</span></p>
                        </div>
                    </div>
                    <nav className="max-w-7xl mx-auto px-2 flex gap-1 overflow-x-auto">
                        {NAV.filter((n) => !("independentOnly" in n) || profile.partnerType === "independent").map((n) => {
                            const base = n.href.split("#")[0];
                            const active = !n.href.includes("#") && (pathname === base || (base === "/partner/quotations" && pathname.startsWith(base)));
                            return (
                                <Link key={n.href} href={n.href} className={`flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm border-b-2 transition-colors duration-150 ${active ? "border-[#0f766e] text-[#111827]" : "border-transparent text-[#4b5565] hover:text-[#111827]"}`}>
                                    <n.icon className={`h-4 w-4 ${active ? "text-[#0f766e]" : "text-[#6b7487]"}`} strokeWidth={1.5} /> {n.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
            </div>
        </PartnerCtx.Provider>
    );
}
