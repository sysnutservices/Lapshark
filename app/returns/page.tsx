import React from 'react';
import { RefreshCcw, Truck, CreditCard, AlertTriangle, Check } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Returns & Refunds - LAPSHARK",
    description: "Our hassle-free 14-day return policy ensures you are satisfied with your purchase.",
};

export default function Returns() {
    return (
        <div className="bg-white min-h-screen py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
                        <RefreshCcw className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Returns & Refunds</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        We want you to love your purchase. If you're not satisfied, we're here to help.
                    </p>
                </div>

                <div className="space-y-12">

                    {/* Policy Highlights */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <Truck className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">14-Day Window</h3>
                            <p className="text-sm text-gray-500">Easy returns within 14 days of delivery.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <CreditCard className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">Fast Refunds</h3>
                            <p className="text-sm text-gray-500">Processed within 5-7 business days.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <Truck className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-900 mb-1">Free Pickup</h3>
                            <p className="text-sm text-gray-500">We handle the return logistics.</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Return Eligibility</h2>
                            <p className="text-gray-600 mb-4">To be eligible for a return, your item must meet the following criteria:</p>
                            <ul className="space-y-3">
                                {[
                                    "The return request is initiated within 14 days of delivery.",
                                    "The product is in the same condition as received (no new scratches/dents).",
                                    "All original accessories (charger, cable) are included.",
                                    "The device has not been tampered with or opened.",
                                    "The warranty seal is intact."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-700">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Refund Process</h2>
                            <p className="text-gray-600">
                                Once your return is received and inspected by our technical team (usually within 48 hours of pickup), we will notify you of the approval or rejection of your refund.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                                <li><strong>Approved:</strong> Your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days.</li>
                                <li><strong>Rejected:</strong> If the device is found to be damaged by the user or parts are missing, we may reject the return or apply a restocking fee of up to 20%.</li>
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
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cancellation Policy</h2>
                            <p className="text-gray-600">
                                You can cancel your order for a full refund before it has been shipped. Once shipped, the order falls under the Return Policy.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
