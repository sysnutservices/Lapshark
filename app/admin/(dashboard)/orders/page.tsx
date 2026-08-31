"use client";

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Order } from '@/types';
import { Eye, Search, Filter, ChevronDown, Check, X, Clock, Truck, Package } from 'lucide-react';

export default function OrderManager() {
    const { orders, updateOrderStatus } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.orderId?.toString()?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'Shipped':
            case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cancelled':
            case 'RTO': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPaymentColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
            case 'Refunded': return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 text-sm">Manage and track customer orders</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search order ID or name..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <select
                        className="bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="RTO">RTO</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Shipping Status</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map(order => (
                                <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{order.orderId}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(order.date).toLocaleString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>

                                    <td className="px-6 py-4 font-medium text-gray-900">{order.customerName}</td>
                                    <td className="px-6 py-4 font-bold">₹{order.total.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPaymentColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <p className="text-sm text-gray-500 uppercase font-medium">Order ID: {selectedOrder.orderId}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Customer</label>
                                    <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                                    <p className="text-sm text-gray-500">john@example.com (Mock)</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Order Info</label>
                                    <p className="text-sm font-medium text-gray-500">Order date:  {new Date(selectedOrder.date).toLocaleString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}</p>
                                    <p className="text-sm font-medium text-gray-500">Payment: {selectedOrder.paymentMethod}</p>
                                    <p className="text-sm text-gray-500">Payment Status: <span className={`px-2 rounded-full text-xs font-bold border ${getPaymentColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span></p>
                                    {selectedOrder.paymentMethod === 'COD' && !!selectedOrder.advanceAmount && selectedOrder.status !== 'Cancelled' && (
                                        <p className="text-sm text-gray-500">
                                            Advance paid: ₹{selectedOrder.advanceAmount.toLocaleString('en-IN')} · Collect on delivery: <span className="font-bold text-amber-700">₹{(selectedOrder.total - selectedOrder.advanceAmount).toLocaleString('en-IN')}</span>
                                        </p>
                                    )}
                                    {selectedOrder.refund && (
                                        <p className="text-sm text-gray-500">
                                            Refund: ₹{(selectedOrder.refund.amount || 0).toLocaleString('en-IN')} —{' '}
                                            <span className={`font-bold ${selectedOrder.refund.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                                                {selectedOrder.refund.status === 'failed' ? 'Failed — refund manually' : selectedOrder.refund.status}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Shipping Address</label>
                                    <p className="text-sm text-gray-500">{selectedOrder.shippingAddress?.street}</p>
                                    <p className="text-sm text-gray-500">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                                    <p className="text-sm text-gray-500">{selectedOrder.shippingAddress?.zip}</p>
                                    <p className="text-sm text-gray-500">Location : <a href={selectedOrder.mapLink} target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-3">Items Ordered</label>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 font-medium text-gray-600">Product</th>
                                                <th className="px-4 py-2 font-medium text-gray-600 text-right">Price</th>
                                                <th className="px-4 py-2 font-medium text-gray-600 text-right">Qty</th>
                                                <th className="px-4 py-2 font-medium text-gray-600 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <img src={item.image} className="w-8 h-8 rounded object-cover    " alt="" />
                                                            <div>
                                                                <span className="font-medium text-gray-900">{item.title}</span>
                                                                {/* Snapshot frozen at purchase time — never recomputed
                                                                    from the live product, so this stays accurate even
                                                                    after the offer expires or is edited/removed. */}
                                                                {item.extraOfferDiscount ? (
                                                                    <div className="text-xs text-rose-600 font-medium">
                                                                        {item.extraOfferLabel || 'Product Offer'}: -₹{item.extraOfferDiscount.toLocaleString('en-IN')}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {item.originalPrice ? (
                                                            <>
                                                                <div className="text-xs text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</div>
                                                                <div>₹{item.finalPrice.toLocaleString('en-IN')}</div>
                                                            </>
                                                        ) : (
                                                            <>₹{item.finalPrice.toLocaleString('en-IN')}</>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-medium">₹{(item.finalPrice * item.quantity).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <div className="text-right space-y-0.5">
                                        {(selectedOrder as any).couponValue > 0 && (
                                            <p className="text-sm text-gray-500">
                                                Coupon{(selectedOrder as any).coupon ? ` (${(selectedOrder as any).coupon})` : ''}: <span className="text-rose-600 font-medium">-₹{(selectedOrder as any).couponValue.toLocaleString('en-IN')}</span>
                                            </p>
                                        )}
                                        <p className="text-xl font-bold text-gray-900 mt-1">Total: ₹{selectedOrder.total.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-3">Update Status</label>
                                <div className="flex gap-2">
                                    {['Pending', 'Processing', 'Shipped', 'Delivered'].map((status) => (
                                        <button
                                            key={status}
                                            disabled={selectedOrder.status === status || statusUpdating}
                                            onClick={async () => {
                                                setStatusUpdating(true);
                                                try {
                                                    // "Shipped" books the real Ekart shipment server-side, so this
                                                    // waits for the response instead of updating optimistically —
                                                    // a courier-side failure must not show "Shipped" when it isn't.
                                                    const updated = await updateOrderStatus(selectedOrder.orderId, status as any);
                                                    setSelectedOrder(updated);
                                                } catch (err: any) {
                                                    alert(err?.response?.data?.message || `Couldn't update status to ${status}`);
                                                } finally {
                                                    setStatusUpdating(false);
                                                }
                                            }}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-60 ${selectedOrder.status === status
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status === 'Shipped' && selectedOrder.status !== 'Shipped' && statusUpdating ? 'Shipping...' : status}
                                        </button>

                                    ))}
                                </div>
                                {selectedOrder.shipment?.awb && (
                                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm">
                                        <p className="text-gray-700"><span className="font-bold">AWB:</span> {selectedOrder.shipment.awb}</p>
                                        {selectedOrder.shipment.courierStatus && (
                                            <p className="text-gray-500 mt-1">Courier status: {selectedOrder.shipment.courierStatus}</p>
                                        )}
                                        {selectedOrder.shipment.trackingUrl && (
                                            <a href={selectedOrder.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline mt-1 inline-block">
                                                Track shipment
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
