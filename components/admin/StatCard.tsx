import React from 'react';
import { LucideIcon } from 'lucide-react';

// Extracted for the AI usage page rather than adding a third near-duplicate
// of the StatCard already copy-pasted between analytics/page.tsx and
// dashboard/page.tsx — those two are left untouched (no unrelated refactor).
interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    bgColor: string;
    color: string;
}

export default function StatCard({ title, value, icon: Icon, bgColor, color }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`p-4 rounded-full ${bgColor} bg-opacity-10 mr-4`}>
                <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
}
