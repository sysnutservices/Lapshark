import React from 'react';
import { Lock, Eye, Database, Globe } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Privacy Policy - LAPSHARK",
    description: "We value your privacy. Learn how we collect, use, and protect your personal information.",
    alternates: {
        canonical: "https://lapshark.com/privacy",
    },
};

export default function Privacy() {
    return (
        <div className="bg-white min-h-screen py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-teal-50 rounded-2xl mb-4">
                        <Lock className="w-8 h-8 text-teal-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        We value your trust and are committed to protecting your personal information.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {[
                        { icon: Database, title: "Data Collection", desc: "We collect only essential information required to process your orders and improve your experience." },
                        { icon: Lock, title: "Security", desc: "Your data is encrypted using industry-standard SSL technology." },
                        { icon: Eye, title: "Transparency", desc: "We do not sell, trade, or rent your personal identification information to others." },
                        { icon: Globe, title: "Cookies", desc: "We use cookies to enhance site navigation and analyze usage." },
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <item.icon className="w-6 h-6 text-slate-800 mb-3" />
                            <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 space-y-8">

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">1. Information We Collect</h3>
                        <p>
                            When you visit Lapshark, we may collect the following information:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Personal Information:</strong> Name, email address, phone number, shipping address (when you purchase).</li>
                            <li><strong>Payment Information:</strong> We do not store credit card details. All payments are processed via secure gateways (Razorpay).</li>
                            <li><strong>Usage Data:</strong> IP address, browser type, device type, and pages visited.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h3>
                        <p>
                            We use the collected data for:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Processing and delivering your orders.</li>
                            <li>Sending order updates and tracking information.</li>
                            <li>Improving our website functionality and customer service.</li>
                            <li>Sending promotional emails (only if you have opted in).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">3. Third-Party Services</h3>
                        <p>
                            We may employ third-party companies (e.g., shipping partners like BlueDart/Delhivery, payment gateways) to facilitate our service. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900">4. Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at: <br />
                            <strong>Email:</strong> privacy@lapshark.com <br />
                            <strong>Address:</strong> Sysnut Technologies, Banashankari 1st Stage, Bengaluru, Karnataka 560050
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}
