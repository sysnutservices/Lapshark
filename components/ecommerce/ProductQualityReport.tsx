"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck, Battery, Monitor, Keyboard, MousePointer, Camera, Volume2, Mic, Wifi, Bluetooth, Usb, HardDrive, BadgeCheck, Wrench } from "lucide-react";
import { STORE_POLICIES } from "@/lib/policies";
import { trackEvent } from "@/lib/analytics";

type Status = "passed" | "minor-wear" | "failed";
type QualityReport = NonNullable<import("@/types").Product["qualityReport"]>;

const STATUS_LABEL: Record<Status, string> = {
    passed: "Passed",
    "minor-wear": "Minor Wear",
    failed: "Failed",
};
const STATUS_COLOR: Record<Status, string> = {
    passed: "text-emerald-600",
    "minor-wear": "text-amber-600",
    failed: "text-red-600",
};

const CHECKS: { key: keyof QualityReport; label: string; icon: any }[] = [
    { key: "displayStatus", label: "Display", icon: Monitor },
    { key: "keyboardStatus", label: "Keyboard", icon: Keyboard },
    { key: "trackpadStatus", label: "Trackpad", icon: MousePointer },
    { key: "webcamStatus", label: "Webcam", icon: Camera },
    { key: "speakerStatus", label: "Speakers", icon: Volume2 },
    { key: "microphoneStatus", label: "Microphone", icon: Mic },
    { key: "wifiStatus", label: "Wi-Fi", icon: Wifi },
    { key: "bluetoothStatus", label: "Bluetooth", icon: Bluetooth },
    { key: "portsStatus", label: "Ports", icon: Usb },
];

// Renders only fields the admin actually entered for this listing — never a
// fabricated checkmark. Most products will show the general-inspection
// fallback below until per-listing data is entered (see the schema comment
// on Product.qualityReport for why this is per-listing, not per serial).
export function ProductQualityReport({ productId, qualityReport }: { productId: string; qualityReport?: QualityReport }) {
    const tracked = useRef(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tracked.current || !ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !tracked.current) {
                tracked.current = true;
                trackEvent("quality_report_viewed", { productId });
                observer.disconnect();
            }
        }, { threshold: 0.4 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [productId]);

    const hasAnyData = qualityReport && Object.values(qualityReport).some((v) => v !== undefined && v !== null);

    return (
        <div ref={ref} className="rounded-2xl md:rounded-3xl border border-slate-100 bg-white p-5 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Lapshark Quality Report</h3>
            </div>

            {!hasAnyData ? (
                <p className="text-sm text-slate-500 leading-relaxed">
                    Every Lapshark laptop passes our {STORE_POLICIES.qualityCheckPoints}-point inspection —
                    covering the display, keyboard, ports, battery, and body condition — before it's listed.
                    Detailed per-unit results for this specific listing haven't been published yet.
                </p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {qualityReport?.batteryHealthPercent !== undefined && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                            <Battery className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <div>
                                <p className="text-[11px] text-slate-400 font-semibold">Battery Health</p>
                                <p className="text-sm font-bold text-slate-900">{qualityReport.batteryHealthPercent}%</p>
                            </div>
                        </div>
                    )}
                    {qualityReport?.storageHealthPercent !== undefined && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                            <HardDrive className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <div>
                                <p className="text-[11px] text-slate-400 font-semibold">SSD Health</p>
                                <p className="text-sm font-bold text-slate-900">{qualityReport.storageHealthPercent}%</p>
                            </div>
                        </div>
                    )}
                    {CHECKS.map(({ key, label, icon: Icon }) => {
                        const status = qualityReport?.[key] as Status | undefined;
                        if (!status) return null;
                        return (
                            <div key={key} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                                <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                <div>
                                    <p className="text-[11px] text-slate-400 font-semibold">{label}</p>
                                    <p className={`text-sm font-bold ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</p>
                                </div>
                            </div>
                        );
                    })}
                    {qualityReport?.serialVerified && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                            <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <p className="text-sm font-bold text-slate-900">Serial Verified</p>
                        </div>
                    )}
                    {qualityReport?.technicianChecked && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                            <Wrench className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <p className="text-sm font-bold text-slate-900">Technician Inspected</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
