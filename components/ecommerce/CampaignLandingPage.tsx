import { CheckCircle } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { TrustStrip } from "@/components/ecommerce/TrustStrip";
import { WhatsAppCTA } from "@/components/ecommerce/WhatsAppCTA";

// Shared shell for intent-matched landing pages (/laptops-for-students,
// /laptops-under-20000, /business-laptops, ...) — each route page is just
// this component plus its own metadata + a product filter, so adding a new
// campaign page never means rebuilding the layout (Phase 14: reusable
// infrastructure, not N one-off pages).
export function CampaignLandingPage({
    title,
    subtitle,
    whyPoints,
    products,
    whatsappMessage,
}: {
    title: string;
    subtitle: string;
    whyPoints: string[];
    products: Product[];
    whatsappMessage: string;
}) {
    const inStock = products.filter((p) => p.stock > 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                <p className="mt-3 text-base text-slate-500">{subtitle}</p>
            </div>

            <div className="mb-10 md:mb-14">
                <TrustStrip className="justify-center" />
            </div>

            {whyPoints.length > 0 && (
                <div className="max-w-2xl mx-auto mb-10 md:mb-14 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {whyPoints.map((point) => (
                        <div key={point} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                            <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" /> {point}
                        </div>
                    ))}
                </div>
            )}

            {inStock.length === 0 ? (
                <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-2xl mb-10">
                    <p>Nothing matching is in stock right now — talk to an expert and we'll help you find the closest fit.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-14">
                    {inStock.map((p) => (
                        <ProductCard key={p._id || p.id} product={p} />
                    ))}
                </div>
            )}

            <div className="flex justify-center">
                <WhatsAppCTA location="campaign_landing" label="Not sure? Talk to an Expert" extraMessage={whatsappMessage} />
            </div>
        </div>
    );
}
