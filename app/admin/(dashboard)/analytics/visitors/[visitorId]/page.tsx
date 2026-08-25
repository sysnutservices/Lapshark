"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Eye, ShoppingCart, Heart, ArrowLeftRight, ShieldCheck, Filter,
    ArrowUpDown, MessageCircle, CreditCard, Tag, XCircle, LogIn, TrendingUp, Phone, Circle,
} from 'lucide-react';
import { api } from '@/api/api';

interface JourneyEvent {
    _id: string;
    eventName: string;
    properties: Record<string, any>;
    createdAt: string;
    source: 'client' | 'server';
}

interface Visitor {
    visitorId: string;
    userId?: { name?: string; mobile?: string; email?: string } | null;
    intentScore: number;
    intentLevel: 'cold' | 'warm' | 'hot' | 'customer';
    firstSeenAt: string;
    lastSeenAt: string;
    totalEvents: number;
    firstTouch?: { source?: string };
    lastTouch?: { source?: string };
}

const LEVEL_COLOR: Record<string, string> = {
    cold: 'bg-gray-100 text-gray-600 border-gray-200',
    warm: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hot: 'bg-orange-100 text-orange-700 border-orange-200',
    customer: 'bg-green-100 text-green-700 border-green-200',
};

const EVENT_ICON: Record<string, any> = {
    page_view: Eye,
    view_item: Eye,
    add_to_cart: ShoppingCart,
    wishlist_add: Heart,
    compare_started: ArrowLeftRight,
    warranty_select: ShieldCheck,
    filter_used: Filter,
    sort_used: ArrowUpDown,
    whatsapp_click: MessageCircle,
    begin_checkout: CreditCard,
    coupon_applied: Tag,
    checkout_payment_failed: XCircle,
    login: LogIn,
    purchase: TrendingUp,
    generate_lead: Phone,
};

function describeEvent(e: JourneyEvent): string {
    const p = e.properties || {};
    switch (e.eventName) {
        case 'view_item': return `Viewed ${p.title || 'a product'}${p.finalPrice ? ` — ₹${p.finalPrice}` : ''}`;
        case 'add_to_cart': return `Added ${p.title || 'a product'} to cart`;
        case 'wishlist_add': return `Wishlisted ${p.title || 'a product'}`;
        case 'compare_started': return `Started comparing ${p.title || 'a product'}`;
        case 'warranty_select': return `Selected warranty: ${p.warrantyValue || '—'}`;
        case 'filter_used': return `Filtered by ${p.filterType}: ${p.value}`;
        case 'sort_used': return `Sorted by ${p.sortBy}`;
        case 'whatsapp_click': return `Clicked WhatsApp (${p.location || 'site'})`;
        case 'begin_checkout': return `Started checkout — ₹${p.finalTotal || 0} via ${p.paymentMethod || '—'}`;
        case 'coupon_applied': return `Applied coupon ${p.couponCode} (−₹${p.discountAmount})`;
        case 'checkout_payment_failed': return `Payment failed${p.reason ? `: ${p.reason}` : ''}`;
        case 'login': return `Logged in (${p.method || 'otp'})`;
        case 'purchase': return `Purchased order ${p.orderId} — ₹${p.total}`;
        case 'generate_lead': return `Submitted an EMI enquiry`;
        case 'page_view': return `Visited ${p.path || 'a page'}`;
        default: return e.eventName;
    }
}

export default function VisitorJourneyPage() {
    const params = useParams();
    const router = useRouter();
    const visitorId = params.visitorId as string;

    const [visitor, setVisitor] = useState<Visitor | null>(null);
    const [events, setEvents] = useState<JourneyEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        api
            .get(`/admin/analytics/visitors/${visitorId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setVisitor(res.data.visitor);
                setEvents(res.data.events || []);
            })
            .catch(() => {
                setVisitor(null);
                setEvents([]);
            })
            .finally(() => setLoading(false));
    }, [visitorId]);

    if (loading) {
        return <div className="text-center py-16 text-gray-400">Loading...</div>;
    }

    if (!visitor) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-400 mb-4">Visitor not found.</p>
                <button onClick={() => router.push('/admin/analytics/visitors')} className="text-blue-600 font-medium">
                    Back to Visitors
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.push('/admin/analytics/visitors')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Visitors
            </button>

            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
                <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${LEVEL_COLOR[visitor.intentLevel] || LEVEL_COLOR.cold}`}>
                        {visitor.intentLevel} — score {visitor.intentScore}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Customer</p>
                    <p className="font-medium text-gray-900">
                        {visitor.userId?.name ? `${visitor.userId.name} (${visitor.userId.mobile})` : 'Anonymous'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">First Touch</p>
                    <p className="font-medium text-gray-900">{visitor.firstTouch?.source || 'Direct'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Last Touch</p>
                    <p className="font-medium text-gray-900">{visitor.lastTouch?.source || 'Direct'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">First Seen</p>
                    <p className="font-medium text-gray-900">{new Date(visitor.firstSeenAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Total Events</p>
                    <p className="font-medium text-gray-900">{visitor.totalEvents}</p>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Journey Timeline</h3>
                {events.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No events recorded yet.</p>
                ) : (
                    <div className="space-y-1">
                        {events.map((e) => {
                            const Icon = EVENT_ICON[e.eventName] || Circle;
                            return (
                                <div key={e._id} className="flex items-start gap-3 py-3 border-t border-gray-50 first:border-t-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{describeEvent(e)}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(e.createdAt).toLocaleString('en-IN')}
                                            {e.source === 'server' && ' · server-confirmed'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
