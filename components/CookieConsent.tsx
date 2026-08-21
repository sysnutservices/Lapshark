"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "lapshark_cookie_consent";

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(CONSENT_KEY)) {
            setVisible(true);
        }
    }, []);

    const handleChoice = (choice: "accepted" | "declined") => {
        localStorage.setItem(CONSENT_KEY, choice);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            aria-live="polite"
            className="fixed inset-x-4 bottom-24 z-[60] animate-[fade-in_0.4s_ease-out] md:inset-x-auto md:left-4 md:right-auto md:bottom-4 md:max-w-sm"
        >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <p className="text-sm leading-relaxed text-slate-600">
                    We use cookies to remember your preferences, keep your cart in sync, and understand how you use Lapshark. See our{" "}
                    <Link
                        href="/privacy"
                        className="font-medium text-teal-600 underline underline-offset-2 hover:text-teal-700"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
                <div className="mt-4 flex items-center gap-3">
                    <Button size="sm" className="flex-1" onClick={() => handleChoice("accepted")}>
                        Accept All
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleChoice("declined")}
                    >
                        Decline
                    </Button>
                </div>
            </div>
        </div>
    );
}
