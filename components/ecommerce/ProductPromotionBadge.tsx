import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { ExtraOfferSnapshot, extraOfferBadgeText, getExtraOfferStatus } from "@/lib/pricing";

// Reusable "EXTRA ₹1,500 OFF" / "EXTRA 10% OFF" / custom-label badge — one
// place so ProductCard, the PDP, cart and checkout never format this
// differently. Renders nothing if there's no active offer to show (callers
// don't need their own null-check).
export function ProductPromotionBadge({ offer, className = "" }: { offer: ExtraOfferSnapshot | null; className?: string }) {
    if (!offer) return null;
    return (
        <Badge className={`rounded-full bg-rose-50 px-2 py-0.5 text-[10px] md:text-xs font-bold text-rose-700 hover:bg-rose-50 ${className}`}>
            {extraOfferBadgeText(offer)}
        </Badge>
    );
}

// "Offer ends 7 Sep" / "Offer starts 1 Sep" — only ever shown for a
// scheduled or active-with-expiry offer; an expired one is never rendered
// (the offer itself already stops affecting price, and there's nothing
// useful to tell the customer about a promotion that's over).
export function ProductPromotionExpiry({ product, className = "" }: { product: Pick<Product, "extraOffer">; className?: string }) {
    const offer = product.extraOffer;
    const status = getExtraOfferStatus(offer);
    if (status !== "active" && status !== "scheduled") return null;

    const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    if (status === "scheduled" && offer?.startAt) {
        return <p className={`text-xs font-semibold text-slate-500 ${className}`}>Offer starts {fmt(offer.startAt)}</p>;
    }
    if (status === "active" && offer?.endAt) {
        return <p className={`text-xs font-semibold text-rose-600 ${className}`}>Offer ends {fmt(offer.endAt)}</p>;
    }
    return null;
}
