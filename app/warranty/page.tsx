import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Warranty Policy - LAPSHARK",
    description: "Learn about our comprehensive 1-year warranty coverage for refurbished laptops.",
};

export default function Warranty() {
    return (
        <div className="bg-white min-h-screen py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-green-50 rounded-2xl mb-4">
                        <ShieldCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Warranty Policy</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Every Lapshark refurbished device is backed by our comprehensive warranty to ensure your peace of mind.
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-slate max-w-none space-y-12">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Coverage Overview</h2>
                        <p className="text-gray-600 mb-6">
                            Lapshark provides a <strong>1-Year Comprehensive Warranty</strong> on all refurbished laptops sold through our platform, effective from the date of delivery. This warranty covers defects in materials and workmanship under normal use.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                                <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-5 h-5" /> What's Covered
                                </h3>
                                <ul className="space-y-2 text-sm text-green-900">
                                    <li>• Motherboard failures & component malfunctions</li>
                                    <li>• Hard drive / SSD failures</li>
                                    <li>• RAM (Memory) defects</li>
                                    <li>• Screen/Display malfunctions (dead pixels less than 3)</li>
                                    <li>• Power adapter failure (first 3 months)</li>
                                    <li>• Keyboard and Trackpad functionality</li>
                                </ul>
                            </div>
                            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                                    <XCircle className="w-5 h-5" /> What's Not Covered
                                </h3>
                                <ul className="space-y-2 text-sm text-red-900">
                                    <li>• Accidental damage (drops, spills, cracks)</li>
                                    <li>• Liquid damage or water submersion</li>
                                    <li>• Software issues (OS corruption, viruses)</li>
                                    <li>• Battery life degradation (consumable part)</li>
                                    <li>• Cosmetic wear and tear (scratches, dents)</li>
                                    <li>• Unauthorized repairs or modifications</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Battery Warranty</h2>
                        <p className="text-gray-600">
                            Batteries are consumable components that degrade over time. We guarantee that your battery will hold at least <strong>80% health</strong> upon arrival. The battery itself is covered under warranty for <strong>3 months</strong> from the date of delivery.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Claim Process</h2>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <ol className="list-decimal list-inside space-y-4 text-gray-700">
                                <li className="pl-2">
                                    <strong>Initiate Claim:</strong> Contact our support team at <span className="text-blue-600 font-medium">support@lapshark.com</span> or call <strong>+91 897 131 9555</strong> with your Order ID and description of the issue.
                                </li>
                                <li className="pl-2">
                                    <strong>Diagnosis:</strong> Our technicians will attempt to troubleshoot the issue remotely via phone or video call.
                                </li>
                                <li className="pl-2">
                                    <strong>Pickup:</strong> If hardware repair is needed, we will arrange a free pickup from your location (within India).
                                </li>
                                <li className="pl-2">
                                    <strong>Repair/Replace:</strong> We will repair the device within 7-10 business days. If a repair is not possible, we will provide a replacement unit of equivalent or higher specifications.
                                </li>
                            </ol>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Software & Data</h2>
                        <div className="flex items-start gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <p className="text-sm text-blue-800">
                                Lapshark is not responsible for any data loss during the repair process. We strongly recommend backing up your data before handing over the device. Software issues, driver conflicts, and operating system errors are not covered under hardware warranty.
                            </p>
                        </div>
                    </section>

                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-500 text-sm">
                    <p>Policy Last Updated: March 1, 2024</p>
                </div>
            </div>
        </div>
    );
}
