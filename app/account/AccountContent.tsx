"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Package, MapPin, LogOut, Settings, Heart, ShoppingBag, X, CreditCard, Truck, CheckCircle, Clock, XCircle, ChevronRight
} from 'lucide-react';
import { api, API_URL2 } from '@/api/api';
import { CheckoutLogin } from '@/components/LoginComponent';
import { Order, CartItem, Address } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { SEO } from '@/components/SEO';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';

// Types
type OrderStatus = 'All' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
type TabType = 'orders' | 'addresses' | 'wishlist' | 'profile';

// Constants
const ORDER_STATUSES: OrderStatus[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLES = {
    Delivered: 'bg-green-50 text-green-700',
    Shipped: 'bg-blue-50 text-blue-700',
    Processing: 'bg-yellow-50 text-yellow-700',
    Pending: 'bg-orange-50 text-orange-700',
    Cancelled: 'bg-red-50 text-red-700',
};

const STATUS_DOT_STYLES = {
    Delivered: 'bg-green-500',
    Shipped: 'bg-blue-500',
    Processing: 'bg-yellow-500',
    Pending: 'bg-orange-500',
    Cancelled: 'bg-red-500',
};

const PAYMENT_STATUS_STYLES = {
    Paid: 'bg-green-50 text-green-700 border-green-200',
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
};

const PAYMENT_METHOD_ICONS = {
    Razorpay: CreditCard,
    COD: Package,
    Card: CreditCard,
};

export const Account: React.FC = () => {
    const { user, logout } = useAuth();
    const { customerOrders, fetchCustomerOrders } = useStore();
    const router = useRouter();

    // Use ref to track if orders have been loaded
    const ordersLoadedRef = useRef(false);

    // State
    const [activeTab, setActiveTab] = useState<TabType>('orders');
    const [showLogin, setShowLogin] = useState(false);
    const [tokenChecked, setTokenChecked] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState<OrderStatus>('All');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize profile data when user changes
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    // Check authentication and load orders - FIXED: Run only once on mount
    useEffect(() => {
        // Prevent running multiple times
        if (ordersLoadedRef.current) return;

        const initializeAccount = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setShowLogin(true);
                setTokenChecked(true);
                ordersLoadedRef.current = true;
                return;
            }

            try {
                setOrdersLoading(true);
                setError(null);
                await fetchCustomerOrders();
                console.log("✅ Orders loaded successfully");
                setTokenChecked(true);
                ordersLoadedRef.current = true;
            } catch (error: any) {
                console.error("❌ Orders fetch error:", error);

                // Handle 401 - Token expired or invalid
                if (error.response?.status === 401) {
                    console.warn("🚨 Authentication failed - token invalid");
                    setShowLogin(true);
                    setTokenChecked(true);
                    ordersLoadedRef.current = true;
                } else {
                    // Other errors - show message but keep user logged in
                    setError("Failed to load orders. Please try again.");
                }
            } finally {
                setOrdersLoading(false);
            }
        };

        initializeAccount();

        // Empty dependency array - run only once on mount
    }, []); // FIXED: Removed fetchCustomerOrders from dependencies

    // Handle successful login
    const handleLoginSuccess = useCallback(async () => {
        setShowLogin(false);
        setOrdersLoading(true);
        setError(null);

        try {
            await fetchCustomerOrders();
            console.log("✅ Orders loaded after login");
            ordersLoadedRef.current = true;
        } catch (error: any) {
            console.error("❌ Failed to load orders after login:", error);
            setError("Failed to load orders. Please refresh the page.");
        } finally {
            setOrdersLoading(false);
        }
    }, [fetchCustomerOrders]);

    // Handle login modal close
    const handleCloseLogin = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.back(); // Go back if not logged in
        } else {
            setShowLogin(false);
        }
    }, [router]);

    // Handle logout
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        logout();
        ordersLoadedRef.current = false; // Reset the ref on logout
        router.push('/');
    }, [logout, router]);

    // Handle profile save
    const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Please login to update your profile");
            return;
        }

        setProfileSaving(true);
        setError(null);

        try {
            const response = await api.put('/users/profile', {
                name: profileData.name || user?.name,
                email: profileData.email || user?.email,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Update local storage with new user data
            const updatedUser = { ...user, ...response.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('❌ Profile update failed:', error);

            if (error.response?.status === 401) {
                setShowLogin(true);
            } else {
                setError(error.response?.data?.message || 'Failed to update profile');
            }
        } finally {
            setProfileSaving(false);
        }
    }, [profileData, user]);

    // Filter orders
    const filteredOrders = useMemo(() => {
        if (!customerOrders) return [];

        return selectedFilter === 'All'
            ? customerOrders
            : customerOrders.filter((order: Order) => order.status === selectedFilter);
    }, [customerOrders, selectedFilter]);

    // Navigation items
    const navigationItems = useMemo(() => [
        { id: 'orders' as TabType, label: 'My Orders', icon: Package },
        { id: 'addresses' as TabType, label: 'Saved Addresses', icon: MapPin },
        { id: 'wishlist' as TabType, label: 'Wishlist', icon: Heart },
        { id: 'profile' as TabType, label: 'Profile Settings', icon: Settings },
    ], []);

    // Handle navigation click
    const handleNavClick = useCallback((item: typeof navigationItems[0]) => {
        if (item.id === 'wishlist') {
            router.push('/wishlist');
        } else if (item.id === 'addresses') {
            router.push('/addresses');
        } else {
            setActiveTab(item.id);
        }
    }, [router]);

    // Loading state
    if (!tokenChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 md:py-12">
            {/* Login Modal */}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <SEO
                        title="Login to Continue - LAPSHARK"
                        description="Sign in to access your account"
                    />
                    <div className="w-full max-w-md mx-4">
                        <CheckoutLogin
                            onLoginSuccess={handleLoginSuccess}
                            closeLogin={handleCloseLogin}
                        />
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}

            <SEO
                title="My Account - LaptopWorld"
                description="Manage your orders, addresses, and account details."
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-700"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="lg:w-1/4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
                            {/* User Info */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <h2 className="text-lg font-bold text-gray-900 truncate">
                                        {user?.name || 'User'}
                                    </h2>
                                    <p className="text-sm text-gray-500 truncate">
                                        {user?.mobile || 'User'}
                                    </p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                {navigationItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item)}
                                        className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id
                                            ? 'bg-black text-white'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </button>
                                ))}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Sign Out
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:w-3/4">
                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header with Filters */}
                                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">My Orders</h2>

                                    {/* Filter Tabs */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                                            {ORDER_STATUSES.map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setSelectedFilter(status)}
                                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${selectedFilter === status
                                                        ? 'bg-black text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Orders List */}
                                {ordersLoading ? (
                                    <div className="p-12 text-center">
                                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-600 font-medium">Loading your orders...</p>
                                    </div>
                                ) : !filteredOrders || filteredOrders.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {selectedFilter === 'All' ? 'No orders yet' : `No ${selectedFilter.toLowerCase()} orders`}
                                        </h3>
                                        <p className="text-gray-500 mb-6">
                                            {selectedFilter === 'All'
                                                ? 'Start shopping and your orders will appear here'
                                                : `You don't have any ${selectedFilter.toLowerCase()} orders`}
                                        </p>
                                        {selectedFilter === 'All' && (
                                            <Link
                                                href="/products"
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                Start Shopping
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredOrders.map((order: Order) => (
                                            <OrderCard
                                                key={order.orderId}
                                                order={order}
                                                onClick={() => setSelectedOrder(order)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                                <form className="space-y-6 max-w-lg" onSubmit={handleSaveProfile}>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
                                            value={user?.mobile || ''}
                                            disabled
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Mobile number cannot be changed
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Email Address (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={profileSaving}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
                                    >
                                        {profileSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

// Separate OrderCard component for better performance
const OrderCard: React.FC<{ order: Order; onClick: () => void }> = React.memo(({ order, onClick }) => {
    return (
        <div
            className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all cursor-pointer"
            onClick={onClick}
        >
            {/* Status and Date */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${STATUS_STYLES[order.status as keyof typeof STATUS_STYLES] || 'bg-gray-50 text-gray-700'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT_STYLES[order.status as keyof typeof STATUS_DOT_STYLES] || 'bg-gray-500'
                        }`}></span>
                    {order.status}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                    {new Date(order.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}
                </span>
            </div>

            {/* Order Content */}
            <div className="flex items-center gap-4">
                {/* Product Images */}
                <div className="flex-shrink-0">
                    {order.items.length === 1 ? (
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-2 group-hover:shadow-md transition-shadow">
                            <img
                                src={API_URL2 + order.items[0].image}
                                alt={order.items[0].title}
                                className="w-full h-full object-contain"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="relative w-20 h-20">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-2 group-hover:shadow-md transition-shadow">
                                <img
                                    src={API_URL2 + order.items[0].image}
                                    alt={order.items[0].title}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                +{order.items.length - 1}
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                        Order #{order.orderId}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2 font-medium">
                        {order.items.length === 1
                            ? order.items[0].title
                            : `${order.items[0].title} ${order.items.length > 1 ? `& ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}` : ''}`
                        }
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                        ₹{order.total.toLocaleString('en-IN')}
                    </p>
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0">
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </div>
    );
});

OrderCard.displayName = 'OrderCard';

// Order Details Modal Component
const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    const PaymentIcon = PAYMENT_METHOD_ICONS[order.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS] || CreditCard;

    // Order status timeline
    const getOrderTimeline = () => {
        const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        const currentIndex = statuses.indexOf(order.status);
        const isCancelled = order.status === 'Cancelled';

        return statuses.map((status, index) => ({
            status,
            completed: !isCancelled && index <= currentIndex,
            active: status === order.status,
            cancelled: isCancelled && index > 0,
        }));
    };

    const timeline = getOrderTimeline();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Order Details</h2>
                        <p className="text-gray-300 text-sm font-medium uppercase">#{order.orderId}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Order Status */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="w-5 h-5 text-gray-600" />
                                <span className="text-sm font-semibold text-gray-600">Order Status</span>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${STATUS_STYLES[order.status as keyof typeof STATUS_STYLES]
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${STATUS_DOT_STYLES[order.status as keyof typeof STATUS_DOT_STYLES]
                                    }`}></span>
                                {order.status}
                            </span>
                        </div>

                        {/* Payment Status */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-5 h-5 text-gray-600" />
                                <span className="text-sm font-semibold text-gray-600">Payment</span>
                            </div>
                            <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border ${PAYMENT_STATUS_STYLES[order.paymentStatus as keyof typeof PAYMENT_STATUS_STYLES]
                                    }`}>
                                    {order.paymentStatus}
                                </span>
                                <p className="text-xs text-gray-600 font-medium mt-1 flex items-center gap-1">
                                    <PaymentIcon className="w-3 h-3" />
                                    {order.paymentMethod}
                                </p>
                            </div>
                        </div>

                        {/* Order Date */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-gray-600" />
                                <span className="text-sm font-semibold text-gray-600">Order Date</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                {new Date(order.date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                })}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {new Date(order.date).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    {order.status !== 'Cancelled' && (
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-gray-600" />
                                Order Timeline
                            </h3>
                            <div className="flex items-center justify-between relative">
                                {/* Progress Line */}
                                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                                    <div
                                        className="h-full bg-black transition-all duration-500"
                                        style={{ width: `${(timeline.filter(t => t.completed).length - 1) * 33.33}%` }}
                                    ></div>
                                </div>

                                {timeline.map((item, index) => (
                                    <div key={index} className="flex flex-col items-center relative z-10 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${item.completed
                                            ? 'bg-black text-white'
                                            : 'bg-white border-2 border-gray-300 text-gray-400'
                                            }`}>
                                            {item.completed ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <Clock className="w-5 h-5" />
                                            )}
                                        </div>
                                        <span className={`text-xs font-bold text-center ${item.completed ? 'text-gray-900' : 'text-gray-500'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cancelled Status */}
                    {order.status === 'Cancelled' && (
                        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-900">Order Cancelled</h3>
                                    <p className="text-sm text-red-700">This order has been cancelled</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-gray-600" />
                                Order Items ({order.items.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items.map((item: CartItem, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-2 flex-shrink-0">
                                            <img
                                                src={API_URL2 + item.image}
                                                alt={item.title}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">{item.title}</h4>
                                            <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <span className="text-sm text-gray-600">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></span>
                                                <span className="text-lg font-bold text-gray-900">₹{item.finalPrice.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-600" />
                                Shipping Address
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                {typeof order.shippingAddress === 'string' ? (
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {order.shippingAddress}
                                    </p>
                                ) : (
                                    <div className="space-y-1 text-sm text-gray-700">
                                        {order.shippingAddress && (
                                            <p className="font-bold text-gray-900">{order.shippingAddress.name}</p>
                                        )}
                                        {order.shippingAddress.street && (
                                            <p>{order.shippingAddress.street}</p>
                                        )}
                                        <p>
                                            {[
                                                order.shippingAddress.city,
                                                order.shippingAddress.state,
                                                order.shippingAddress.zip
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                        {order.shippingAddress.country && (
                                            <p>{order.shippingAddress.country}</p>
                                        )}
                                        {order.shippingAddress.phone && (
                                            <p className="mt-2 font-medium text-gray-900">
                                                Phone: {order.shippingAddress.phone}
                                            </p>
                                        )}
                                        {order.shippingAddress.email && (
                                            <p className="font-medium text-gray-900">
                                                Email: {order.shippingAddress.email}
                                            </p>
                                        )}
                                        {order.shippingAddress.type && (
                                            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                {order.shippingAddress.type}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Customer & Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Information</h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Name</p>
                                    <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                                </div>
                                {order.customerEmail && (
                                    <div>
                                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-medium text-gray-700">{order.customerEmail}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Order Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Subtotal</span>
                                    <span className="font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Shipping</span>
                                    <span className="font-bold text-green-600">FREE</span>
                                </div>
                                <div className="border-t-2 border-gray-300 pt-2 mt-2">
                                    <div className="flex justify-between">
                                        <span className="text-base font-bold text-gray-900">Total</span>
                                        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                            ₹{order.total.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};