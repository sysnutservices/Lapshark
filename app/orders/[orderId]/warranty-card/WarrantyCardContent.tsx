"use client";

import { ArrowLeft, Printer, ShieldCheck, Phone, Mail, CheckCircle, XCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/api/api';
import { useEffect, useState } from 'react';
import { Order, ConfigOption } from '@/types';
import { resolveSupportPhone, resolveSupportPhoneDisplay } from '@/lib/whatsapp';
import { useStore } from '@/context/StoreContext';
import { STORE_POLICIES } from '@/lib/policies';

// Same labels as Product.ts's DEFAULT_CONFIG_OPTIONS.warranty and
// STORE_POLICIES.extendedWarrantyOptions — matching on label (not parsing
// the value string) is what lets this stay correct if either list's
// wording changes without both being updated in lockstep.
function warrantyMonthsFor(warranty?: ConfigOption): number {
    const match = STORE_POLICIES.extendedWarrantyOptions.find(o => o.label === warranty?.label);
    return match?.months ?? STORE_POLICIES.warrantyMonths;
}

function addMonths(dateStr: string, months: number): Date {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d;
}

const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function WarrantyCardContent() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;
    const { siteConfig } = useStore();
    const supportPhone = resolveSupportPhone(siteConfig);
    const supportPhoneDisplay = resolveSupportPhoneDisplay(siteConfig);

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await api.get(`/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOrder(response.data.order);
            } catch (error) {
                console.error('Error fetching order:', error);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Loading warranty card...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
                <Package className="w-12 h-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
                <Link href="/account" className="text-teal-600 font-bold hover:underline">Back to My Orders</Link>
            </div>
        );
    }

    // Warranty only applies once payment is actually confirmed — this is
    // the same gate markOrderPaid uses server-side to fire the WhatsApp
    // confirmation, so a card only ever shows for an order that's really
    // been paid for.
    if (order.paymentStatus !== 'Paid') {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Warranty Card Not Available Yet</h2>
                <p className="text-slate-500 mb-6 max-w-sm">Your warranty card will be ready here as soon as payment for order #{order.orderId} is confirmed.</p>
                <Link href={`/orders/${order.orderId}`} className="text-teal-600 font-bold hover:underline">Back to Order Details</Link>
            </div>
        );
    }

    const purchaseDate = order.paidAt || order.date;

    return (
        <div className="bg-slate-100 min-h-screen py-8 md:py-12 print:bg-white print:py-0">
            {/* Site nav/footer live in the root layout, outside this
                component's DOM — hiding them by tag is the only way to get a
                clean print without touching every other page. */}
            <style jsx global>{`
                @media print {
                    nav, footer, #warranty-card-toolbar { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div id="warranty-card-toolbar" className="flex items-center justify-between mb-6 print:hidden">
                    <button onClick={() => router.push(`/orders/${order.orderId}`)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4" /> Back to Order
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors">
                        <Printer className="w-4 h-4" /> Print / Save as PDF
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 print:border-0 print:shadow-none overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 md:p-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">LAPSHARK</h1>
                            <p className="text-slate-300 text-sm">The Laptop Store</p>
                        </div>
                        <div className="text-right">
                            <p className="uppercase text-xs font-bold text-teal-400 tracking-widest mb-1">Warranty Card</p>
                            <p className="text-sm text-slate-300">#{order.orderId}</p>
                        </div>
                    </div>

                    {/* Customer & Purchase Info */}
                    <div className="grid grid-cols-2 gap-6 p-6 md:p-8 border-b border-dashed border-slate-200">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Customer</p>
                            <p className="font-bold text-slate-900">{order.customerName}</p>
                            <p className="text-sm text-slate-500">{order.shippingAddress?.phone}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Purchase Date</p>
                            <p className="font-bold text-slate-900">{formatDate(purchaseDate)}</p>
                        </div>
                    </div>

                    {/* Per-item warranty coverage */}
                    <div className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => {
                            const months = warrantyMonthsFor(item.warranty);
                            const expiresOn = addMonths(purchaseDate, months);
                            const warrantyLabel = item.warranty?.label || STORE_POLICIES.warrantyLabel;
                            return (
                                <div key={idx} className="p-6 md:p-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900">{item.title}</p>
                                        <p className="text-sm text-slate-500">
                                            {[item.selectedConfig?.ram, item.selectedConfig?.storage, `Qty: ${item.quantity}`].filter(Boolean).join(' • ')}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">Serial number: assigned at dispatch</p>
                                    </div>
                                    <div className="text-left sm:text-right flex-shrink-0">
                                        <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold">
                                            <ShieldCheck className="w-3.5 h-3.5" /> {warrantyLabel}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1.5">Valid until {formatDate(expiresOn)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Coverage summary — reuses STORE_POLICIES so this never
                        drifts from the actual published warranty policy. */}
                    <div className="grid sm:grid-cols-2 gap-6 p-6 md:p-8 bg-slate-50 border-t border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Covered</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">Screen, motherboard, keyboard, hard drive & RAM, and original accessories against manufacturing defects. {STORE_POLICIES.batteryPolicyLabel}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Not Covered</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">Physical/liquid damage, unauthorized repairs, removed serial numbers, and normal wear. Full terms at lapshark.com/warranty.</p>
                        </div>
                    </div>

                    {/* Claim / support */}
                    <div className="p-6 md:p-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                            <p className="font-bold text-slate-900 mb-1">To raise a warranty claim</p>
                            <p>Contact support with this card and your order ID as proof of purchase. Non-transferable — valid for the original purchaser only.</p>
                        </div>
                        <div className="flex flex-col gap-1.5 text-sm flex-shrink-0">
                            <a href={`tel:${supportPhone}`} className="flex items-center gap-2 font-bold text-slate-900"><Phone className="w-4 h-4 text-teal-600" /> {supportPhoneDisplay}</a>
                            <Link href="/contact" className="flex items-center gap-2 font-bold text-teal-600 hover:underline"><Mail className="w-4 h-4" /> lapshark.com/contact</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
