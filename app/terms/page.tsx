import React from 'react';
import { FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Terms of Service - LAPSHARK",
    description: "Read our terms and conditions regarding the use of our website and purchase of refurbished products.",
    alternates: {
        canonical: "https://lapshark.com/terms",
    },
};

export default function Terms() {
    return (
        <div className="bg-white min-h-screen py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-2xl mb-4">
                        <FileText className="w-8 h-8 text-slate-700" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Terms of Service</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Please read these terms carefully before using our services.
                    </p>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 space-y-8">

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h3>
                        <p>
                            By accessing and using this website ("Lapshark"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">2. Product Descriptions & Condition</h3>
                        <p>
                            We sell refurbished electronics. While we strive to describe products accurately:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Condition Grades:</strong> Terms like "Like New", "Excellent", and "Good" are subjective but adhere to our strict grading standards.</li>
                            <li><strong>Battery Life:</strong> Batteries are tested to hold charge but may not have the capacity of a brand-new battery.</li>
                            <li><strong>Images:</strong> Product images may be stock photos unless specified as "Actual Image".</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">3. Pricing and Payments</h3>
                        <p>
                            Prices are listed in Indian Rupees (INR) and are inclusive of GST unless stated otherwise. We reserve the right to change prices at any time without notice. In the event of a pricing error, we reserve the right to cancel orders placed at the incorrect price.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">4. Limitation of Liability</h3>
                        <p>
                            Lapshark shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our products. Our maximum liability is limited to the purchase price of the product.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">5. Governing Law</h3>
                        <p>
                            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">6. Changes to Terms</h3>
                        <p>
                            We reserve the right to modify these terms at any time. Your continued use of the site after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
