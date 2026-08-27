"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWhatsApp, buildProductWhatsAppMessage } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

interface Props {
    product?: { title: string; finalPrice?: number; slug?: string; id?: string; productId?: string; _id?: string };
    location: string; // analytics location tag, e.g. "product_page", "compare_page", "recommendation_result"
    label?: string;
    extraMessage?: string;
    className?: string;
}

// One button for every "talk to a human" entry point — product page,
// comparison page, recommendation quiz results — so the message format and
// the event fired are never reinvented per call site.
export function WhatsAppCTA({ product, location, label = "WhatsApp Expert", extraMessage, className = "" }: Props) {
    const handleClick = () => {
        const productId = product ? (product.productId || product.id || product._id || "") : "";
        if (product) {
            trackEvent("whatsapp_product_click", { productId, title: product.title, location });
            openWhatsApp(buildProductWhatsAppMessage(product, extraMessage));
        } else {
            trackEvent("whatsapp_expert_click", { location });
            openWhatsApp(extraMessage || "Hi Lapshark, I need help finding the right laptop.");
        }
    };

    return (
        <Button
            onClick={handleClick}
            variant="outline"
            className={`h-auto rounded-xl border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 ${className}`}
        >
            <MessageCircle className="w-4 h-4 mr-2" /> {label}
        </Button>
    );
}
