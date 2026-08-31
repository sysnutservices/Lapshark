
"use client";

import { ArrowLeft, MapPin, CreditCard, Package, Truck, CheckCircle, Clock, XCircle, ShoppingBag, Phone, HelpCircle, ChevronRight, Copy, Mail, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/api/api';
import { useEffect, useState } from 'react';
import { Order } from '@/types';
export default function OrderDetailsContent() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string; // ✅ Get orderId from URL params

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch order data
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                // GET /orders/:id is protect (ownership checked server-side) —
                // was missing the header, so this page 401'd for every order.
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

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Package className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Loading Order...</h2>
                <p className="text-slate-500">Please wait while we fetch your order details.</p>
            </div>
        );
    }
    if (!order) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
                <p className="text-slate-500 mb-8">We couldn't find the order you're looking for.</p>
                <Link href="/account" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">
                    Back to Orders
                </Link>
            </div>
        );
    }

    const steps = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = steps.indexOf(order.status);
    const isCancelled = order.status === 'Cancelled';
    // RTO (courier sent the shipment back) is a terminal exception like
    // Cancelled, not a further step down the same timeline.
    const isRTO = order.status === 'RTO';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return 'text-green-600 bg-green-100 border-green-200';
            case 'Shipped':
            case 'Out for Delivery': return 'text-teal-600 bg-teal-100 border-teal-200';
            case 'Processing': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'Cancelled':
            case 'RTO': return 'text-red-600 bg-red-100 border-red-200';
            default: return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Navigation & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/account')} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                <Link href="/account" className="hover:text-teal-600">My Account</Link>
                                <ChevronRight className="w-3 h-3" />
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl md:text-3xl font-bold text-slate-900 uppercase">#{order.orderId}</h1>

                            </div> <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <HelpCircle className="w-4 h-4" /> Need Help?
                        </button>
                        {order.status === 'Delivered' && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200">
                                <ShoppingBag className="w-4 h-4" /> Buy Again
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Timeline & Items */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Status Timeline */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            {isCancelled || isRTO ? (
                                <div className="flex items-center gap-4 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                                    <XCircle className="w-8 h-8" />
                                    <div>
                                        <h3 className="font-bold text-lg">{isRTO ? 'Returned to Origin' : 'Order Cancelled'}</h3>
                                        <p className="text-sm text-red-500">
                                            {isRTO
                                                ? "This shipment couldn't be delivered and was sent back. Please contact support."
                                                : 'This order has been cancelled. If you have any questions, please contact support.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
                                    <div
                                        className="absolute top-5 left-0 h-1 bg-green-500 rounded-full -z-10 transition-all duration-1000"
                                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                    ></div>

                                    <div className="flex justify-between">
                                        {steps.map((step, index) => {
                                            const isCompleted = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;

                                            return (
                                                <div key={index} className="flex flex-col items-center relative z-10 flex-1">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isCompleted
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                                        }`}>
                                                        {isCompleted ? (
                                                            <CheckCircle className="w-5 h-5" />
                                                        ) : (
                                                            <Clock className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-bold text-center ${isCompleted ? 'text-slate-900' : 'text-slate-500'
                                                        }`}>
                                                        {step}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-8 p-4 bg-teal-50 rounded-xl border border-teal-100 flex gap-3">
                                        <Clock className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-teal-900 text-sm mb-0.5">Estimated Delivery</h4>
                                            <p className="text-teal-700 text-sm">
                                                {order.status === 'Delivered' ? `Delivered on ${order.date}` : `Arriving by ${new Date(new Date(order.date).setDate(new Date(order.date).getDate() + 5)).toDateString()}`}
                                            </p>
                                            {order.shipment?.awb && (
                                                <p className="text-teal-700 text-sm mt-1">
                                                    AWB: {order.shipment.awb}
                                                    {order.shipment.trackingUrl && (
                                                        <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline ml-2">
                                                            Track shipment
                                                        </a>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-slate-500" />
                                    Items Ordered ({order.items.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="p-6 md:p-8 flex gap-4 md:gap-6 hover:bg-slate-50 transition-colors">
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl border border-slate-200 p-2 flex-shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col md:flex-row md:justify-between mb-2">
                                                <h3 className="text-base md:text-lg font-bold text-slate-900 line-clamp-2 md:pr-4">
                                                    {item.title}
                                                </h3>
                                                <span className="text-lg font-bold text-slate-900 mt-1 md:mt-0 whitespace-nowrap">₹{item.finalPrice.toLocaleString('en-IN')}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-2">{item?.selectedConfig?.ram} RAM • {item?.selectedConfig?.storage}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                                                <span>Total: <span className="font-bold text-slate-900">₹{(item.finalPrice * item.quantity).toLocaleString('en-IN')}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Info & Summary */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Shipping Address */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-400" /> Shipping Details
                            </h3>
                            <div className="text-sm text-slate-600 leading-relaxed">
                                <p className="font-bold text-slate-900 text-base mb-1">{order.customerName}</p>
                                <p className="mb-2 text-slate-500">{order.customerEmail}</p>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {order.shippingAddress ? order.shippingAddress.street.split(',').map((line, i) => (
                                        <p key={i}>{line.trim()}</p>
                                    )) : (
                                        <p className="text-slate-400 italic">Address not available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-slate-400" /> Payment Info
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Payment Method</span>
                                    <span className="font-bold text-slate-900">{order.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Payment Status</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700'
                                        : order.paymentStatus === 'Refunded' ? 'bg-blue-100 text-blue-700'
                                            : order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                                {order.paymentMethod === 'COD' && !!order.advanceAmount && order.status !== 'Cancelled' && (
                                    <>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Advance Paid</span>
                                            <span className="font-bold text-slate-900">₹{order.advanceAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-slate-200">
                                            <span className="text-slate-500">Due on Delivery</span>
                                            <span className="font-bold text-amber-700">₹{(order.total - order.advanceAmount).toLocaleString('en-IN')}</span>
                                        </div>
                                    </>
                                )}
                                {order.refund && (
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-slate-200">
                                        <span className="text-slate-500">Advance Refund</span>
                                        <span className="font-bold text-blue-700">
                                            {order.refund.status === 'failed'
                                                ? "Failed — we'll follow up manually"
                                                : `₹${(order.refund.amount || 0).toLocaleString('en-IN')} (${order.refund.status})`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium">₹{order.total.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Shipping</span>
                                    <span className="font-medium text-green-600">Free</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tax</span>
                                    <span className="font-medium">Included</span>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-slate-900">Total Amount</span>
                                <span className="font-extrabold text-xl text-slate-900">₹{order.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-slate-300 text-sm mb-6">Issues with your order? Our support team is here for you.</p>
                            <a href="tel:+918971319555" className="flex items-center gap-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors mb-2">
                                <Phone className="w-5 h-5" />
                                <span className="font-bold">+91 897 131 9555</span>
                            </a>
                            <a href="mailto:support@lapshark.com" className="flex items-center gap-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors">
                                <Mail className="w-5 h-5" />
                                <span className="font-bold">support@lapshark.com</span>
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
