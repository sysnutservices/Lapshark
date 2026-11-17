"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiError } from "@/lib/partnerApi";
import { dealerApi, DealerOrder, ORDER_STATUS_LABEL, orderTone, PAYMENT_LABEL, rs } from "@/lib/dealerApi";
import { Banner, Card, Empty, fmtDate, Pill, Spinner } from "@/components/partner/ui";

export default function DealerOrdersPage() {
    const [orders, setOrders] = useState<DealerOrder[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        dealerApi.orders().then((r) => setOrders(r.orders)).catch((e) => setError(apiError(e).message));
    }, []);

    if (error) return <Banner tone="red">{error}</Banner>;
    if (!orders) return <Spinner />;
    if (orders.length === 0) return <Empty title="No orders yet" action={<Link href="/dealer" className="text-sm font-medium text-[#0f766e]">Buy laptops</Link>} />;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-medium text-slate-900">My orders</h1>
            <Card className="p-0 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                        <tr className="border-b border-slate-200">
                            <th className="px-4 py-3 font-medium">Order</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Laptops</th>
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                            <th className="px-4 py-3 font-medium text-right">Due</th>
                            <th className="px-4 py-3 font-medium">Payment</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="px-4 py-3"><Link href={`/dealer/orders/${o.id}`} className="font-mono text-[#0f766e]">{o.orderNumber}</Link></td>
                                <td className="px-4 py-3 text-slate-600">{fmtDate(o.createdAt)}</td>
                                <td className="px-4 py-3 text-slate-700 tabular-nums">{o.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{rs(o.totalPaise)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{o.status === "cancelled" ? "—" : rs(o.duePaise)}</td>
                                <td className="px-4 py-3 text-slate-600">{PAYMENT_LABEL[o.paymentMethod]}</td>
                                <td className="px-4 py-3"><Pill tone={orderTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Pill></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
