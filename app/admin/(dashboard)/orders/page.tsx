"use client";

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Order } from '@/types';
import { Search, Filter, ChevronDown, Check, X, Clock, Truck, Package, Pencil, ShieldCheck } from 'lucide-react';

export default function OrderManager() {
    const { orders, updateOrderStatus, setItemSerialNumber, approveCancellation, rejectCancellation, requestReview } = useStore();
    const [reviewRequesting, setReviewRequesting] = useState(false);
    const [reviewRequestSent, setReviewRequestSent] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [paymentFilter, setPaymentFilter] = useState<string>('All');
    const [dateFilter, setDateFilter] = useState<string>('All');
    // yyyy-mm-dd strings straight from <input type="date">, used only when
    // dateFilter is 'Custom'. Either end may be left blank (open-ended).
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    // Inline "ship without a courier" form — separate from the Shipped
    // button since it skips the real Ekart booking entirely (local
    // delivery, a courier Ekart doesn't cover, etc.).
    const [showManualShip, setShowManualShip] = useState(false);
    const [manualCourierName, setManualCourierName] = useState('');
    const [manualTrackingNumber, setManualTrackingNumber] = useState('');
    const [manualTrackingUrl, setManualTrackingUrl] = useState('');
    const [cancelActionLoading, setCancelActionLoading] = useState(false);
    // Serial number capture, keyed by item _id — null/undefined means "not
    // currently editing this row" (shows the saved value + Edit button, or
    // an empty input if nothing's saved yet).
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [serialInput, setSerialInput] = useState('');
    const [savingSerialItemId, setSavingSerialItemId] = useState<string | null>(null);

    const startEditingSerial = (itemId: string, currentValue?: string) => {
        setEditingItemId(itemId);
        setSerialInput(currentValue || '');
    };

    // Clicking an order's row expands its details inline; clicking it again
    // (or another order) collapses it. Per-order form state resets on switch.
    const toggleOrder = (order: Order) => {
        if (selectedOrder?.orderId === order.orderId) {
            setSelectedOrder(null);
            return;
        }
        setSelectedOrder(order);
        setShowManualShip(false);
        setManualCourierName('');
        setManualTrackingNumber('');
        setManualTrackingUrl('');
        setReviewRequestSent(false);
        setEditingItemId(null);
    };

    const sendReviewRequest = async () => {
        if (!selectedOrder) return;
        setReviewRequesting(true);
        try {
            await requestReview(selectedOrder.orderId);
            setReviewRequestSent(true);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Couldn't send review request");
        } finally {
            setReviewRequesting(false);
        }
    };

    const confirmManualShip = async () => {
        if (!selectedOrder) return;
        setStatusUpdating(true);
        try {
            const updated = await updateOrderStatus(selectedOrder.orderId, 'Shipped', {
                courierName: manualCourierName.trim() || undefined,
                trackingNumber: manualTrackingNumber.trim() || undefined,
                trackingUrl: manualTrackingUrl.trim() || undefined,
            });
            setSelectedOrder(updated);
            setShowManualShip(false);
            setManualCourierName('');
            setManualTrackingNumber('');
            setManualTrackingUrl('');
        } catch (err: any) {
            alert(err?.response?.data?.message || "Couldn't mark order as shipped");
        } finally {
            setStatusUpdating(false);
        }
    };

    const saveSerial = async (item: { _id?: string }) => {
        if (!selectedOrder || !item._id) return;
        const trimmed = serialInput.trim();
        if (!trimmed) return;
        setSavingSerialItemId(item._id);
        try {
            const updated = await setItemSerialNumber(selectedOrder.orderId, item._id, trimmed);
            setSelectedOrder(updated);
            setEditingItemId(null);
        } catch (err: any) {
            // Same pattern as the status-update error handling below —
            // covers the 409 duplicate-serial response from the backend.
            alert(err?.response?.data?.message || "Couldn't save serial number");
        } finally {
            setSavingSerialItemId(null);
        }
    };

    // [start, end) window for the date filter, in the admin's local time —
    // null on either side means unbounded.
    const dateRange = (() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
        switch (dateFilter) {
            case 'Today': return { start: today, end: addDays(today, 1) };
            case 'Yesterday': return { start: addDays(today, -1), end: today };
            case 'This Month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
            case 'This Year': return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
            case 'Custom': {
                // Appending T00:00 parses as local midnight — a bare
                // yyyy-mm-dd would parse as UTC and shift the day in IST.
                const from = dateFrom ? new Date(`${dateFrom}T00:00`) : null;
                const to = dateTo ? addDays(new Date(`${dateTo}T00:00`), 1) : null;
                return { start: from, end: to };
            }
            default: return { start: null, end: null };
        }
    })();

    const term = searchTerm.trim().toLowerCase();
    // Phone search compares digits only, so spaces/dashes/"+91" in either
    // the typed term or the saved number don't matter. Only used when the
    // term looks like a phone number — otherwise an order ID's digits would
    // match random phone numbers.
    const isPhoneTerm = /^[\d\s+()-]+$/.test(term);
    const phoneDigits = term.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const matchesFilters = (order: Order) => {
        const matchesSearch =
            (order.orderId?.toString()?.toLowerCase().includes(term) ?? false) ||
            (order.customerName?.toLowerCase().includes(term) ?? false) ||
            (isPhoneTerm && !!phoneDigits &&
                (order.shippingAddress?.phone?.replace(/\D/g, '').includes(phoneDigits) ?? false));
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        const matchesPayment = paymentFilter === 'All' || order.paymentStatus === paymentFilter;
        const orderTime = new Date(order.date).getTime();
        const matchesDate =
            (!dateRange.start || orderTime >= dateRange.start.getTime()) &&
            (!dateRange.end || orderTime < dateRange.end.getTime());
        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    };
    // Keep the expanded order in the list even once it stops matching —
    // e.g. filtered to "Pending" and just marked Processing — otherwise
    // its details vanish mid-edit along with the row.
    const filteredOrders = orders.filter(order =>
        order.orderId === selectedOrder?.orderId || matchesFilters(order)
    );
    // Summary counts only genuine matches, not a pinned expanded order.
    const matchingOrders = orders.filter(matchesFilters);
    // Cancelled/RTO orders never turned into revenue, so they're kept out of
    // the headline total and shown on their own instead.
    const isLostOrder = (o: Order) => o.status === 'Cancelled' || o.status === 'RTO';
    const lostOrders = matchingOrders.filter(isLostOrder);
    // Money actually received. paymentStatus alone can't say that: a COD
    // order's advance also marks it "Paid" (and it never changes after), so
    // COD counts only the advance until it's Delivered and the courier has
    // collected the rest. Prepaid counts in full once Paid.
    const receivedAmount = (o: Order) => {
        if (isLostOrder(o)) return 0;
        if (o.paymentMethod === 'COD') {
            if (o.status === 'Delivered') return o.total || 0;
            return o.paymentStatus === 'Paid' ? o.advanceAmount || 0 : 0;
        }
        return o.paymentStatus === 'Paid' ? o.total || 0 : 0;
    };
    const matchingTotal = matchingOrders.reduce((sum, o) => sum + receivedAmount(o), 0);
    const lostTotal = lostOrders.reduce((sum, o) => sum + (o.total || 0), 0);

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

    // Expanded inline under the order row (replaces the old modal) so all
    // details are visible in place without covering the list.
    const orderDetails = selectedOrder && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Customer</label>
                    <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.shippingAddress?.phone}</p>
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
                    {(() => {
                        // Mirrors backend isCOD check (lapshark_backend/src/services/ekart.ts)
                        // so this reflects exactly what createShipment will send to Ekart.
                        const codAmount = selectedOrder.total - (selectedOrder.advanceAmount || 0);
                        const isCOD = selectedOrder.paymentMethod === 'COD' && codAmount > 0;
                        return (
                            <p className="text-sm text-gray-500">
                                Ekart payment mode: <span className="font-bold">{isCOD ? 'COD' : 'Prepaid'}</span>
                            </p>
                        );
                    })()}
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
                                <React.Fragment key={idx}>
                                <tr>
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
                                {/* Serial number — captured here at fulfillment time, not at
                                    order creation, since a real unit isn't picked for the
                                    order until now. Keyed to this specific item (item._id),
                                    never the whole order, so a multi-item order gets one
                                    serial per laptop. Warranty card reads item.serialNumber
                                    directly — nothing else to wire up once this saves. */}
                                <tr className="bg-gray-50/50">
                                    <td colSpan={4} className="px-4 py-2.5">
                                        {item.serialNumber && editingItemId !== item._id ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">Serial Number:</span>
                                                <span className="font-mono font-medium text-gray-900">{item.serialNumber}</span>
                                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Assigned
                                                </span>
                                                <button
                                                    onClick={() => startEditingSerial(item._id!, item.serialNumber)}
                                                    className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-blue-600"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-gray-500 flex-shrink-0">Serial Number</label>
                                                <input
                                                    type="text"
                                                    autoFocus={editingItemId === item._id}
                                                    placeholder="Scan or type serial number"
                                                    value={editingItemId === item._id ? serialInput : ''}
                                                    onFocus={() => { if (editingItemId !== item._id) startEditingSerial(item._id!, ''); }}
                                                    onChange={(e) => setSerialInput(e.target.value)}
                                                    // A USB barcode/QR scanner types the code then sends
                                                    // Enter — this saves on Enter with no extra wiring.
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveSerial(item); }}
                                                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    onClick={() => saveSerial(item)}
                                                    disabled={savingSerialItemId === item._id || !serialInput.trim()}
                                                    className="px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                >
                                                    {savingSerialItemId === item._id ? 'Saving...' : 'Save'}
                                                </button>
                                                {item.serialNumber && (
                                                    <button
                                                        onClick={() => setEditingItemId(null)}
                                                        className="text-xs font-bold text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-4">
                    <div className="text-right space-y-0.5">
                        {!!selectedOrder.shippingCost && (
                            <p className="text-sm text-gray-500">
                                Shipping: <span className="font-medium">₹{selectedOrder.shippingCost.toLocaleString('en-IN')}</span>
                            </p>
                        )}
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

                {selectedOrder.status !== 'Shipped' && selectedOrder.status !== 'Delivered' && (
                    <div className="mt-2">
                        {!showManualShip ? (
                            <button
                                type="button"
                                onClick={() => setShowManualShip(true)}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 underline"
                            >
                                Ship manually (no courier booking)
                            </button>
                        ) : (
                            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase">Manual Shipment</p>
                                <p className="text-xs text-gray-500 -mt-2">Tracking number and URL are required so the customer gets a WhatsApp shipment notification.</p>
                                <input
                                    type="text"
                                    placeholder="Courier name (optional)"
                                    value={manualCourierName}
                                    onChange={(e) => setManualCourierName(e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                                />
                                <input
                                    type="text"
                                    required
                                    placeholder="Tracking number"
                                    value={manualTrackingNumber}
                                    onChange={(e) => setManualTrackingNumber(e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                                />
                                <input
                                    type="text"
                                    required
                                    placeholder="Tracking URL"
                                    value={manualTrackingUrl}
                                    onChange={(e) => setManualTrackingUrl(e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={statusUpdating || !manualTrackingNumber.trim() || !manualTrackingUrl.trim()}
                                        onClick={confirmManualShip}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-60"
                                    >
                                        {statusUpdating ? 'Shipping...' : 'Confirm Manual Shipment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowManualShip(false)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedOrder.shipment?.manual ? (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
                        <p className="text-gray-700 font-bold">Shipped manually{selectedOrder.shipment.courierName ? ` via ${selectedOrder.shipment.courierName}` : ''}</p>
                        {selectedOrder.shipment.awb && (
                            <p className="text-gray-500 mt-1">Tracking #: {selectedOrder.shipment.awb}</p>
                        )}
                        {selectedOrder.shipment.trackingUrl && (
                            <a href={selectedOrder.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline mt-1 inline-block">
                                Track shipment
                            </a>
                        )}
                    </div>
                ) : selectedOrder.shipment?.awb && (
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

                {selectedOrder.status === 'Delivered' && (
                    <div className="mt-3">
                        <button
                            type="button"
                            disabled={reviewRequesting || reviewRequestSent}
                            onClick={sendReviewRequest}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700 underline disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
                        >
                            {reviewRequestSent ? 'Review request sent' : reviewRequesting ? 'Sending...' : 'Request a review via WhatsApp'}
                        </button>
                    </div>
                )}
            </div>

            {selectedOrder.cancellation && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-3">Cancellation</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 space-y-1 text-sm">
                        <p className="text-gray-700"><span className="font-bold">Status:</span> {selectedOrder.cancellation.status}</p>
                        <p className="text-gray-700"><span className="font-bold">Reason:</span> {selectedOrder.cancellation.reason || '—'}</p>
                        {selectedOrder.cancellation.note && (
                            <p className="text-gray-500">Customer note: {selectedOrder.cancellation.note}</p>
                        )}
                        {selectedOrder.cancellation.requestedAt && (
                            <p className="text-gray-500">Requested: {new Date(selectedOrder.cancellation.requestedAt).toLocaleString('en-IN')}</p>
                        )}
                        {selectedOrder.cancellation.status === 'Rejected' && selectedOrder.cancellation.rejectionReason && (
                            <p className="text-gray-500">Rejection note: {selectedOrder.cancellation.rejectionReason}</p>
                        )}
                    </div>
                    {selectedOrder.cancellation.status === 'Requested' && (
                        <div className="flex gap-2 mt-3">
                            <button
                                disabled={cancelActionLoading}
                                onClick={async () => {
                                    setCancelActionLoading(true);
                                    try {
                                        const updated = await approveCancellation(selectedOrder.orderId);
                                        setSelectedOrder(updated);
                                    } catch (err: any) {
                                        alert(err?.response?.data?.message || "Couldn't approve cancellation");
                                    } finally {
                                        setCancelActionLoading(false);
                                    }
                                }}
                                className="flex-1 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                Approve Cancellation
                            </button>
                            <button
                                disabled={cancelActionLoading}
                                onClick={async () => {
                                    setCancelActionLoading(true);
                                    try {
                                        const updated = await rejectCancellation(selectedOrder.orderId);
                                        setSelectedOrder(updated);
                                    } catch (err: any) {
                                        alert(err?.response?.data?.message || "Couldn't reject cancellation");
                                    } finally {
                                        setCancelActionLoading(false);
                                    }
                                }}
                                className="flex-1 py-2 rounded-lg text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Reject Cancellation
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 text-sm">Manage and track customer orders</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search order ID, name or phone..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setSelectedOrder(null); }}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <select
                        className="flex-1 md:flex-none bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setSelectedOrder(null); }}
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
                    <select
                        className="flex-1 md:flex-none bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={paymentFilter}
                        onChange={(e) => { setPaymentFilter(e.target.value); setSelectedOrder(null); }}
                    >
                        <option value="All">All Payments</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                    </select>
                    <select
                        className="flex-1 md:flex-none bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={dateFilter}
                        onChange={(e) => { setDateFilter(e.target.value); setSelectedOrder(null); }}
                    >
                        <option value="All">All Time</option>
                        <option value="Today">Today</option>
                        <option value="Yesterday">Yesterday</option>
                        <option value="This Month">This Month</option>
                        <option value="This Year">This Year</option>
                        <option value="Custom">Custom Range</option>
                    </select>
                    {dateFilter === 'Custom' && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <input
                                type="date"
                                aria-label="From date"
                                value={dateFrom}
                                max={dateTo || undefined}
                                onChange={(e) => { setDateFrom(e.target.value); setSelectedOrder(null); }}
                                className="flex-1 md:flex-none bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-400">to</span>
                            <input
                                type="date"
                                aria-label="To date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) => { setDateTo(e.target.value); setSelectedOrder(null); }}
                                className="flex-1 md:flex-none bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
                <span>
                    <span className="font-bold text-gray-900">{matchingOrders.length.toLocaleString('en-IN')}</span>{' '}
                    {matchingOrders.length === 1 ? 'order' : 'orders'}
                </span>
                <span>
                    Revenue received: <span className="font-bold text-gray-900">₹{matchingTotal.toLocaleString('en-IN')}</span>
                </span>
                {lostOrders.length > 0 && (
                    <span>
                        Cancelled / RTO: <span className="font-medium text-red-600">{lostOrders.length} · ₹{lostTotal.toLocaleString('en-IN')}</span>
                        <span className="text-gray-400"> (not in revenue)</span>
                    </span>
                )}
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
                            {filteredOrders.map(order => {
                                const isExpanded = selectedOrder?.orderId === order.orderId;
                                return (
                                <React.Fragment key={order.orderId}>
                                <tr
                                    onClick={() => toggleOrder(order)}
                                    className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                                >
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
                                            onClick={(e) => { e.stopPropagation(); toggleOrder(order); }}
                                            aria-expanded={isExpanded}
                                            aria-label={isExpanded ? 'Hide order details' : 'Show order details'}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                                        </button>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-gray-50/70">
                                        <td colSpan={7} className="px-6 py-6 border-l-4 border-blue-500">
                                            {orderDetails}
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7}className="px-6 py-12 text-center text-gray-500">
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
