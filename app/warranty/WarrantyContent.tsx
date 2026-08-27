"use client"

import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Truck, HelpCircle, Gavel, UserCheck, Zap, Laptop, FileText, CreditCard, RotateCcw, Battery } from 'lucide-react';

import Link from 'next/link';
import { STORE_POLICIES } from '@/lib/policies';

export default function WarrantyContent() {
    return (
        <div className="bg-slate-50 min-h-screen py-12 md:py-20 font-sans">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Warranty Policy
                    </h1>
                    <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed">
                        Lapshark is committed to delivering high-quality refurbished products. This policy outlines the terms and conditions under which we offer warranty service for our hardware products and accessories.
                    </p>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Standard Warranty</h3>
                        <p className="text-sm text-slate-500">{STORE_POLICIES.warrantyMonths} Months for all laptops and Apple devices.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Comprehensive Coverage</h3>
                        <p className="text-sm text-slate-500">Covers Motherboard, Screen, RAM, HDD, and original accessories.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Hassle-Free Service</h3>
                        <p className="text-sm text-slate-500">Free pickup and drop for eligible claims. Onsite engineer visit available.</p>
                    </div>
                </div>

                <div className="space-y-8">

                    {/* Warranty Period Section */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-teal-600" /> Warranty Period
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-teal-500">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2"><Laptop className="w-4 h-4" /> All Laptops & Apple Products</h4>
                                    <p className="text-sm text-slate-600 mt-1">Valid for <span className="font-bold">{STORE_POLICIES.warrantyMonths} Months</span> from the date of original retail purchase.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border-l-4 border-orange-500">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2"><Zap className="w-4 h-4" /> Accessories</h4>
                                    <p className="text-sm text-slate-600 mt-1">{STORE_POLICIES.warrantyMonths} Month Warranty on accessories included in the original packaging.</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                    <h4 className="font-bold text-red-800 flex items-center gap-2"><XCircle className="w-4 h-4" /> Exclusions</h4>
                                    <p className="text-sm text-red-600 mt-1">Motorola Tri-Band AC2200 WiFi Mesh System is not covered under warranty.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                            <p className="text-sm text-slate-600"><strong>Extended Warranty:</strong> Customers may purchase an extended warranty providing additional coverage for up to two years.</p>
                        </div>
                    </div>

                    {/* Coverage Details */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6" /> What is Covered
                                </h3>
                                <p className="text-sm text-slate-600 mb-4">
                                    We warrant that the refurbished hardware and accessories are free from defects in materials and workmanship under normal use.
                                </p>
                                <ul className="space-y-3">
                                    {['Screen', 'Motherboard', 'Keyboard', 'Hard Drive & RAM', `Original Accessories (${STORE_POLICIES.warrantyMonths} Months)`].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                    <p className="text-xs text-amber-800 flex items-center gap-2">
                                        <Battery className="w-4 h-4" />
                                        <span><strong>Battery Warranty:</strong> Battery warranty will be claimed only if the battery is completely dead/non-functional.</span>
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                                    <XCircle className="w-6 h-6" /> What is Not Covered
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        'Third-party accessories not from Lapshark',
                                        'Software (OS, Applications, Drivers)',
                                        'Consumable parts (Batteries) unless completely dead',
                                        'Superficial damage (scratches, dents)',
                                        'Damage from external causes (liquid, fire, drops)',
                                        'Unauthorized repairs or modifications',
                                        'Removed or defaced serial numbers',
                                        'Stolen products or those locked by passcodes'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Service Process */}
                    <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-8 text-center">How to Obtain Warranty Service</h2>
                            <div className="grid md:grid-cols-4 gap-6">
                                {[
                                    { step: '01', title: 'Contact Support', desc: 'Reach out via our Contact Us page with proof of purchase.' },
                                    { step: '02', title: 'Remote Diagnosis', desc: 'We resolve issues remotely within 24-48 hours via troubleshooting.' },
                                    { step: '03', title: 'Engineer Visit', desc: 'Onsite engineer visits within 5-6 working days for serviceable locations.' },
                                    { step: '04', title: 'Resolution', desc: 'Repair at facility, or replacement with equivalent value unit if unrepairable.' }
                                ].map((s, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                                        <span className="text-4xl font-extrabold text-white mb-4 block">{s.step}</span>
                                        <h4 className="font-bold text-lg mb-2 text-teal-400">{s.title}</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Payment & Refund Policy - NEW SECTION */}
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-8 shadow-sm border border-teal-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-teal-800" /> Payment & Refund Policy
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-teal-100">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                    <CreditCard className="w-5 h-5 text-teal-600" /> Cash on Delivery (COD)
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    If you choose <strong>Cash on Delivery (COD)</strong> as your payment method, you may be required to pay <strong>₹{STORE_POLICIES.codAdvanceAmount}</strong> as a advance payment at the placement of the order.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-teal-100">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                    <RotateCcw className="w-5 h-5 text-green-600" /> Refund Conditions
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-2">
                                    <strong>Refunds are processed only when the mistake is from our side,</strong> such as:
                                </p>
                                <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                                    <li>Wrong product delivered</li>
                                    <li>Product damaged during shipment</li>
                                    <li>Any other issue caused by Lapshark</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-5 bg-red-50 rounded-2xl border border-red-200">
                            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5" /> Non-Refundable Situations
                            </h3>
                            <p className="text-sm text-red-700 leading-relaxed mb-3">
                                <strong>No refund will be issued</strong> in the following cases:
                            </p>
                            <ul className="text-sm text-red-700 space-y-2 list-disc pl-5">
                                <li><strong>Customer not available:</strong> If the customer is not present at the delivery address at the time of delivery</li>
                                <li><strong>Order not accepted:</strong> If the customer refuses to accept the order upon delivery</li>
                                <li><strong>Customer not reachable:</strong> If the customer cannot be contacted via phone/email during delivery attempts</li>
                                <li><strong>Wrong address provided:</strong> If the customer provided an incorrect or incomplete delivery address</li>
                            </ul>
                            <p className="text-xs text-red-600 mt-3 font-medium">
                                Please ensure you are available to receive the order and provide accurate contact details to avoid any issues.
                            </p>
                        </div>
                    </div>

                    {/* Additional Terms Accordion Style */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500" /> Your Responsibilities
                            </h3>
                            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                                <li><strong>Data Backup:</strong> You are responsible for backing up all data. We are not liable for data loss during repair or replacement.</li>
                                <li><strong>Proof of Purchase:</strong> Required to validate warranty status.</li>
                                <li><strong>Passwords:</strong> You must remove security locks/passwords before service.</li>
                                <li><strong>Availability:</strong> Ensure you are available to receive warranty service or product delivery.</li>
                            </ul>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                <Truck className="w-5 h-5 text-teal-500" /> Shipping & Handling
                            </h3>
                            <p className="text-sm text-slate-600 mb-3">
                                If warranty service is required for a covered defect, <strong>Lapshark covers shipping costs</strong>. If ineligible, you may be responsible.
                            </p>
                            <p className="text-sm text-slate-600">
                                Ensure proper packaging when returning. We are not liable for damage due to improper packaging during transit.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                <Gavel className="w-5 h-5 text-slate-700" /> Legal & Liability
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed mb-2">
                                <strong>No Error-Free Guarantee:</strong> We do not guarantee uninterrupted operation.
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                <strong>Limitation:</strong> Liability is limited to repair/replacement. We are not responsible for indirect, special, or consequential damages (loss of profit, data, etc.).
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                                <UserCheck className="w-5 h-5 text-teal-700" /> Conduct & Transferability
                            </h3>
                            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                                <li><strong>Non-Transferable:</strong> Warranty applies only to the original purchaser. Resale voids warranty.</li>
                                <li><strong>Conduct:</strong> Abusive behavior towards staff may result in limitation of service. Professionalism is expected from both parties.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-slate-200">
                        <p className="text-slate-500 mb-4 text-sm">Policy governed by local jurisdiction laws. Last updated: December 2025.</p>
                        <Link href="/contact" className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">
                            <HelpCircle className="w-4 h-4" /> Raise a Warranty Claim
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};  