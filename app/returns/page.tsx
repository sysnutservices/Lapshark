import React from 'react';
import { RefreshCcw, Truck, CreditCard, AlertTriangle, Check } from 'lucide-react';
import { Metadata } from 'next';
import { STORE_POLICIES } from '@/lib/policies';

export const metadata: Metadata = {
    title: "Returns & Refunds - LAPSHARK",
    description: `Our hassle-free ${STORE_POLICIES.returnDays}-day return policy ensures you are satisfied with your purchase.`,
    alternates: {
        canonical: "https://lapshark.com/returns",
    },
};

// Answers below are taken from copy visible on this page — Google requires FAQ
// markup to match on-page content, and LLMs quote the answer text directly.
// This page is the policy of record: STORE_POLICIES.returnConditions is
// itself sourced from what's written here, so keep the two in sync.
const faqs = [
    {
        q: "How long do I have to return a laptop to Lapshark?",
        a: `Returns are accepted within ${STORE_POLICIES.returnDays} days of delivery. The return request must be initiated within that window.`,
    },
    {
        q: "What makes a product eligible for return?",
        a: `${STORE_POLICIES.returnConditions.join(" ")}`,
    },
    {
        q: "How long does a refund take?",
        a: `Once your return is received and inspected by our technical team, usually within 48 hours of pickup, we notify you of approval or rejection. Approved refunds are credited automatically to your original method of payment within ${STORE_POLICIES.refundWindowLabel}.`,
    },
    {
        q: "What happens if my return is rejected?",
        a: `If the device is found to be damaged by the user or parts are missing, we may reject the return or apply a restocking fee of up to ${STORE_POLICIES.restockingFeeMaxPercent}%.`,
    },
    {
        q: "What should I do if my laptop arrives damaged?",
        a: "If you receive a damaged or defective product, notify us immediately within 24 hours at support@lapshark.com with photos or video of the unboxing. We will arrange an immediate replacement.",
    },
    {
        q: "Can I cancel my order?",
        a: "You can cancel your order for a full refund before it has been shipped. Once shipped, the order falls under the Return Policy.",
    },
    {
        q: "Does Lapshark charge for return pickup?",
        a: STORE_POLICIES.returnPickupFree ? "No. Pickup is free and Lapshark handles the return logistics." : "Pickup fees may apply — check your return confirmation for details.",
    },
    // Moved from app/warranty/WarrantyContent.tsx — payment/COD/refund
    // content belongs on this page, not the warranty page.
    {
        q: "Do I need to pay in advance for Cash on Delivery?",
        a: `If you choose Cash on Delivery (COD) as your payment method, you may be required to pay ₹${STORE_POLICIES.codAdvanceAmount} as an advance payment when placing the order.`,
    },
    {
        q: "When does Lapshark issue a refund for a wrong or damaged order?",
        a: "Separately from the return process above: if the wrong product was delivered, the product was damaged during shipment, or another issue was caused by Lapshark, we issue a full refund.",
    },
    {
        q: "When will no refund be issued?",
        a: "No refund is issued if the customer is not present at the delivery address at the time of delivery, refuses to accept the order upon delivery, cannot be contacted by phone or email during delivery attempts, or provided an incorrect or incomplete delivery address.",
    },
];

export default function Returns() {
    return (
        <div className="bg-white min-h-screen py-12 md:py-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: faqs.map((f) => ({
                            "@type": "Question",
                            name: f.q,
                            acceptedAnswer: { "@type": "Answer", text: f.a },
                        })),
                    }),
                }}
            ></script>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-teal-50 rounded-2xl mb-4">
                        <RefreshCcw className="w-8 h-8 text-teal-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Returns & Refunds</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                        We want you to love your purchase. If you're not satisfied, we're here to help.
                    </p>
                </div>

                <div className="space-y-12">

                    {/* Policy Highlights */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <Truck className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">{STORE_POLICIES.returnDays}-Day Window</h3>
                            <p className="text-sm text-slate-500">Easy returns within {STORE_POLICIES.returnDays} days of delivery.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <CreditCard className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">Fast Refunds</h3>
                            <p className="text-sm text-slate-500">Processed within {STORE_POLICIES.refundWindowLabel}.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <Truck className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">Free Pickup</h3>
                            <p className="text-sm text-slate-500">We handle the return logistics.</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Return Eligibility</h2>
                            <p className="text-slate-600 mb-4">To be eligible for a return, your item must meet the following criteria:</p>
                            <ul className="space-y-3">
                                {STORE_POLICIES.returnConditions.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Refund Process</h2>
                            <p className="text-slate-600">
                                Once your return is received and inspected by our technical team (usually within 48 hours of pickup), we will notify you of the approval or rejection of your refund.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
                                <li><strong>Approved:</strong> Your refund will be processed, and a credit will automatically be applied to your original method of payment within {STORE_POLICIES.refundWindowLabel}.</li>
                                <li><strong>Rejected:</strong> If the device is found to be damaged by the user or parts are missing, we may reject the return or apply a restocking fee of up to {STORE_POLICIES.restockingFeeMaxPercent}%.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Damaged on Arrival</h2>
                            <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl flex gap-4">
                                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                <p className="text-amber-800 text-sm">
                                    If you receive a damaged or defective product, please notify us immediately (within 24 hours) at <strong>support@lapshark.com</strong> with photos/video of the unboxing. We will arrange an immediate replacement.
                                </p>
                            </div>
                            <p className="text-slate-600 mt-4">
                                A full refund instead of a replacement applies if the wrong product was delivered, the product was damaged during shipment, or another issue was caused by Lapshark.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cancellation Policy</h2>
                            <p className="text-slate-600">
                                You can cancel your order for a full refund before it has been shipped. Once shipped, the order falls under the Return Policy.
                            </p>
                        </section>

                        {/* Moved from app/warranty/WarrantyContent.tsx — payment/COD and
                            refund-eligibility content belongs here, not on the warranty page. */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cash on Delivery (COD)</h2>
                            <p className="text-slate-600">
                                If you choose Cash on Delivery (COD) as your payment method, you may be required to pay <strong>₹{STORE_POLICIES.codAdvanceAmount}</strong> as an advance payment when placing the order — the remainder is collected on delivery.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">When No Refund Is Issued</h2>
                            <p className="text-slate-600 mb-3">No refund is issued if:</p>
                            <ul className="space-y-3">
                                {[
                                    "The customer is not present at the delivery address at the time of delivery",
                                    "The customer refuses to accept the order upon delivery",
                                    "The customer cannot be contacted by phone or email during delivery attempts",
                                    "The customer provided an incorrect or incomplete delivery address",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
