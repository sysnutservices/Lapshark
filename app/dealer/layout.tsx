"use client";

// Dealer portal: trade buyers who buy laptops from Lapshark and resell them
// under their own name. Sign-in reuses the WhatsApp OTP login.
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Laptop, Package, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CheckoutLogin } from "@/components/LoginComponent";
import { apiError } from "@/lib/partnerApi";
import { dealerApi, DealerProfile, DealerProgramme, DEALER_STATUS_LABEL } from "@/lib/dealerApi";
import { Banner, Card, PARTNER_THEME, Spinner } from "@/components/partner/ui";
import DealerRegister from "@/components/dealer/DealerRegister";
import { DealerCtx } from "@/components/dealer/DealerContext";


const NAV = [
    { href: "/dealer", label: "Buy laptops", icon: Laptop },
    { href: "/dealer/orders", label: "My orders", icon: Package },
];

export default function DealerLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [profile, setProfile] = useState<DealerProfile | null>(null);
    const [programme, setProgramme] = useState<DealerProgramme | null>(null);
    const [state, setState] = useState<"loading" | "ready" | "error">("loading");
    const [error, setError] = useState("");

    const load = useCallback(() => {
        if (!user) return;
        setState("loading");
        dealerApi
            .profile()
            .then((r) => {
                setProfile(r.profile);
                setProgramme(r.programme);
                setState("ready");
            })
            .catch((err) => {
                setError(apiError(err).message);
                setState("error");
            });
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const shell = (body: React.ReactNode, wide = false) => (
        <div style={PARTNER_THEME} className="min-h-[70vh] bg-[#f5f7fa] py-12">
            <div className={`${wide ? "max-w-2xl" : "max-w-xl"} mx-auto px-4`}>{body}</div>
        </div>
    );

    if (!user) {
        return shell(
            <>
                <h1 className="text-2xl font-medium text-slate-900">Lapshark for dealers</h1>
                <p className="mt-2 text-sm text-slate-600">Shops and resellers can buy refurbished laptops from Lapshark at trade prices and sell them under their own name. Sign in with your mobile number to apply or to order.</p>
                <div className="mt-6"><CheckoutLogin showLogo={false} /></div>
            </>
        );
    }
    if (state === "loading") return shell(<Spinner />);
    if (state === "error" || !programme) return shell(<Banner tone="red">{error || "Something went wrong"}</Banner>);
    if (!programme.enabled) return shell(<Banner tone="amber">Dealer ordering isn&apos;t open yet. Please check back soon.</Banner>);

    if (!profile) {
        if (!programme.registrationOpen) return shell(<Banner tone="amber">Dealer registration is closed at the moment. Contact Lapshark if you&apos;d like to buy as a dealer.</Banner>);
        return shell(<DealerRegister programme={programme} onDone={load} />, true);
    }

    if (profile.status === "applied") {
        return shell(
            <Card className="text-center py-10">
                <Clock className="w-10 h-10 mx-auto text-amber-500" strokeWidth={1.5} />
                <h1 className="mt-3 text-xl font-medium text-slate-900">Application under review</h1>
                <p className="mt-2 text-slate-600">{profile.businessName} · <span className="font-mono">{profile.dealerCode}</span></p>
                <p className="mt-2 text-sm text-slate-500">We&apos;ll contact you on {profile.phone} once it has been reviewed.</p>
            </Card>
        );
    }
    if (profile.status !== "approved") {
        return shell(
            <Card className="text-center py-10">
                <ShieldAlert className="w-10 h-10 mx-auto text-rose-500" strokeWidth={1.5} />
                <h1 className="mt-3 text-xl font-medium text-slate-900">Dealer account {DEALER_STATUS_LABEL[profile.status].toLowerCase()}</h1>
                <p className="mt-2 text-sm text-slate-500">Contact Lapshark if you have questions.</p>
            </Card>
        );
    }

    return (
        <DealerCtx.Provider value={{ profile, programme }}>
            <div style={PARTNER_THEME} className="bg-[#f5f7fa] min-h-[80vh]">
                <div className="bg-white border-b border-[#111827]/[0.08]">
                    <div className="max-w-7xl mx-auto px-4 pt-5 pb-3">
                        <p className="text-[13px] text-[#6b7487]">Lapshark dealer</p>
                        <p className="mt-0.5 text-[17px] font-medium text-[#111827]">
                            {profile.businessName} <span className="ml-2 font-mono text-[13px] font-normal text-[#6b7487]">{profile.dealerCode}</span>
                        </p>
                    </div>
                    <nav className="max-w-7xl mx-auto px-2 flex gap-1 overflow-x-auto">
                        {NAV.map((n) => {
                            const active = n.href === "/dealer" ? pathname === "/dealer" : pathname.startsWith(n.href);
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
        </DealerCtx.Provider>
    );
}
