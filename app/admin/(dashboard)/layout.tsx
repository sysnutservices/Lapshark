"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Monitor, Settings, Ticket, LogOut, Globe, Menu, X, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WHATSAPP_URL } from '@/api/api';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, isAdmin } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        if (user && !isAdmin) {
            router.push('/');
        }
    }, [user, isAdmin, router]);

    // Declared BEFORE the early return below. It used to sit after it, so the
    // first render (auth not resolved yet) ran 7 hooks and the next render ran
    // 8 — React threw "change in the order of Hooks", the error boundary caught
    // it, and the whole admin panel showed "Application error: a client-side
    // exception". Every hook must run on every render.
    const openWhatsApp = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) return alert("Please login first!");

        window.open(`${WHATSAPP_URL}/auth/redirect?token=${token}`, "_blank");
    }, []);

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    const token = localStorage.getItem('token');
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Package, label: 'Products', path: '/admin/products' },
        { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
        { icon: Users, label: 'Customers', path: '/admin/users' },
        { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
        { icon: MessageCircle, label: 'Whatsapp', path: 'whatsapp-auth' },
        { icon: Monitor, label: 'Site Editor', path: '/admin/editor' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    const handleLogout = () => {
        logout();
        router.push('/');
    };
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col flex-shrink-0">
                <div className="p-6 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-500" />
                    <h1 className="text-xl font-bold tracking-tight">Admin<span className="text-blue-500">Panel</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {menuItems.map((item) => {
                        const isActive = pathname.startsWith(item.path ?? "");

                        // 🚨 if the item is Whatsapp → use button instead of Link
                        if (item.path === "whatsapp-auth") {
                            return (
                                <button
                                    key={item.label}
                                    onClick={openWhatsApp}
                                    className={`flex w-full items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                        : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5 mr-3 text-gray-500" />
                                    {item.label}
                                </button>
                            );
                        }

                        // 🟢 default internal navigation
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                    : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : "text-gray-500"}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold shadow-lg text-white">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-400">Super Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-3" /> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="w-6 h-6 text-blue-500" />
                        <h1 className="text-xl font-bold tracking-tight">Admin<span className="text-blue-500">Panel</span></h1>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-3" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:hidden z-10">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-slate-900">Admin Panel</span>
                    <div className="w-6"></div> {/* Spacer for centering */}
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
