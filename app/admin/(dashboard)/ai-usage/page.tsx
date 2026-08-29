"use client";

import React, { useEffect, useState } from 'react';
import { ImageIcon, Sparkles, DollarSign, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { api } from '@/api/api';
import StatCard from '@/components/admin/StatCard';

// Read-only usage/cost dashboard — env-var config (budget/limits/kill
// switch), no settings-editing UI here by design. Every dollar figure is
// labeled "Estimated" because GPT Image cost is computed from configured
// pricing env vars, never a hard-coded number (see imageCostControl.ts).
interface UsageSummary {
    month: string;
    imagesProcessed: number;
    openaiOperations: number;
    estimatedCostUsd: number;
    estimatedCostIsApproximate: boolean;
    averageCostPerImage: number;
    monthlyBudgetUsd: number | null;
    remainingBudgetUsd: number | null;
    budgetUsagePercent: number | null;
    aiEnabled: boolean;
    dailyCount: number;
    dailyLimit: number | null;
    hourlyCount: number;
    hourlyLimit: number | null;
}

interface ProductUsageRow {
    productId: string;
    productTitle: string;
    imagesProcessed: number;
    operations: number;
    estimatedCostUsd: number;
}

function fmtUsd(n: number) {
    return `$${n.toFixed(2)}`;
}

export default function AiImageUsagePage() {
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [products, setProducts] = useState<ProductUsageRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        setLoading(true);
        Promise.all([
            api.get('/admin/ai-usage/summary', { headers }),
            api.get('/admin/ai-usage/by-product', { headers }),
        ])
            .then(([summaryRes, productsRes]) => {
                setSummary(summaryRes.data.summary);
                setProducts(productsRes.data.products);
            })
            .catch(() => { setSummary(null); setProducts([]); })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Image Usage</h1>
                <p className="text-gray-500 text-sm">OpenAI GPT Image 2 processing cost and volume, this month</p>
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-400">Loading...</div>
            ) : !summary ? (
                <div className="text-center py-16 text-gray-400">Couldn't load usage data.</div>
            ) : (
                <>
                    {!summary.aiEnabled && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm font-medium">
                            AI image processing is currently disabled (OPENAI_IMAGE_PROCESSING_ENABLED=false). Existing approved images are unaffected.
                        </div>
                    )}
                    {summary.budgetUsagePercent !== null && summary.budgetUsagePercent >= 80 && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4 text-sm font-medium">
                            Estimated monthly image-processing usage is at {summary.budgetUsagePercent.toFixed(0)}% of your budget.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard title="Images Processed" value={summary.imagesProcessed.toLocaleString()} icon={ImageIcon} bgColor="bg-blue-500" color="text-blue-500" />
                        <StatCard title="OpenAI Operations" value={summary.openaiOperations.toLocaleString()} icon={Sparkles} bgColor="bg-purple-500" color="text-purple-500" />
                        <StatCard
                            title={summary.estimatedCostIsApproximate ? "Estimated OpenAI Cost" : "OpenAI Cost"}
                            value={fmtUsd(summary.estimatedCostUsd)}
                            icon={DollarSign}
                            bgColor="bg-green-500"
                            color="text-green-500"
                        />
                        <StatCard title="Average Cost / Image" value={fmtUsd(summary.averageCostPerImage)} icon={TrendingDown} bgColor="bg-cyan-500" color="text-cyan-500" />
                        <StatCard
                            title="Remaining Monthly Budget"
                            value={summary.remainingBudgetUsd !== null ? fmtUsd(summary.remainingBudgetUsd) : "No budget set"}
                            icon={Wallet}
                            bgColor="bg-amber-500"
                            color="text-amber-500"
                        />
                        <StatCard
                            title="Budget Usage"
                            value={summary.budgetUsagePercent !== null ? `${summary.budgetUsagePercent.toFixed(0)}%` : "—"}
                            icon={PieChart}
                            bgColor="bg-rose-500"
                            color="text-rose-500"
                        />
                    </div>

                    <div className="text-xs text-gray-400">
                        Daily: {summary.dailyCount}{summary.dailyLimit !== null ? ` / ${summary.dailyLimit}` : ''} &nbsp;·&nbsp;
                        Hourly: {summary.hourlyCount}{summary.hourlyLimit !== null ? ` / ${summary.hourlyLimit}` : ''}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Cost by Product</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-900 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Images Processed</th>
                                        <th className="px-6 py-4">OpenAI Operations</th>
                                        <th className="px-6 py-4">Estimated Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.productId} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">{p.productTitle}</td>
                                            <td className="px-6 py-4">{p.imagesProcessed}</td>
                                            <td className="px-6 py-4">{p.operations}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{fmtUsd(p.estimatedCostUsd)}</td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No AI image processing yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
