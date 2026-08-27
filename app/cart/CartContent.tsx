"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Trash2,
    ArrowLeft,
    CheckCircle,
    Truck,
    Minus,
    Plus,
    ShoppingBag,
    Wallet,
} from "lucide-react";
import { useUserFeatures } from "@/context/UserFeatureContext";
import { CheckoutLogin } from "@/components/LoginComponent";
import { STORE_POLICIES } from "@/lib/policies";

export default function CartContent() {
    const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } =
        useCart();
    const router = useRouter();
    const [showLogin, setShowLogin] = useState(false);
    const { addresses } = useUserFeatures();
    // Mock shipping logic: Free shipping over ₹10,000
    const shippingThreshold = 10000;
    const shippingCost = totalPrice > shippingThreshold ? 0 : 500;
    const finalTotal = totalPrice + shippingCost;
    const handleLoginSuccess = async () => {
        setShowLogin(false);
    };
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setShowLogin(true);
        }
    }, []);

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Trash2 className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Your cart is empty
                </h2>
                <p className="text-slate-500 mb-8">
                    Looks like you haven't added any laptops yet.
                </p>
                <Link
                    href="/products"
                    className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-lg"
                >
                    Start Shopping
                </Link>
                {showLogin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        {/* Centered Login Card */}
                        <div className="w-full max-w-md mx-4">
                            <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => { setShowLogin(false); router.back() }} />
                        </div>
                    </div>
                )}
            </div>
        );
    }
    const handleCheckout = () => {
        const token = localStorage.getItem("token");

        // 1️⃣ User not logged in → show login
        if (!token) {
            setShowLogin(true);
            return;
        }

        // 2️⃣ User logged in but no address → go to address page
        if (addresses.length === 0) {
            router.push("/addresses");
            return;
        }

        // 3️⃣ Everything OK → proceed to checkout
        router.push("/checkout");
    };


    return (
        <>

            <div className="bg-slate-50 min-h-screen py-6 md:py-12 pb-40 md:pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="flex flex-col md:flex-row md:items-baseline md:space-x-2">
                                <h1 className="text-xl md:text-3xl font-bold text-slate-900">
                                    Shopping Cart
                                </h1>
                                <span className="text-slate-500 font-medium text-sm md:text-base">
                                    ({cart.length} Items)
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={clearCart}
                            className="text-red-500 hover:text-red-700 font-medium text-sm underline decoration-red-200 hover:decoration-red-500 transition-all"
                        >
                            Clear Cart
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left: Cart Items */}
                        <div className="flex-1">
                            {/* Mobile View (Card Grid Style) */}
                            <div className="md:hidden space-y-4">
                                {cart.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 flex-shrink-0 bg-slate-50 rounded-xl p-2 border border-slate-100">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                                <div className="pr-6">
                                                    <Link
                                                        href={`/products/${item.originalId || item.productId
                                                            }`}
                                                        className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug mb-1"
                                                    >
                                                        {item.title}
                                                    </Link>
                                                    <p className="text-xs text-slate-500 line-clamp-1">
                                                        {item.specs.processor} • {item.specs.ram}
                                                    </p>
                                                </div>

                                                <div className="flex items-end justify-between mt-3">
                                                    <span className="font-bold text-base text-slate-900">
                                                        ₹{item.finalPrice.toLocaleString("en-IN")}
                                                    </span>

                                                    <div className="flex items-center border border-slate-200 rounded-lg shadow-sm h-7">
                                                        <button
                                                            onClick={() => updateQuantity(item.id?.toString() || '', -1)}
                                                            className="w-6 h-full flex items-center justify-center text-slate-600 rounded-l-lg"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-6 text-center font-bold text-slate-900 text-sm bg-white h-full flex items-center justify-center border-slate-200">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id?.toString() || '', 1)}
                                                            className="w-6 h-full flex items-center justify-center text-slate-600 rounded-r-lg"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.productId?.toString() || '')}
                                            className="absolute top-3 right-3 p-2 text-red-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View (Table Style) */}
                            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="col-span-6">Product Details</div>
                                    <div className="col-span-2 text-center">Price</div>
                                    <div className="col-span-2 text-center">Quantity</div>
                                    <div className="col-span-2 text-center">Total</div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {cart.map((item) => (
                                        <div key={item.productId} className="p-4 md:p-6">
                                            <div className="grid grid-cols-12 gap-6 items-center">
                                                <div className="col-span-6 w-full flex items-center gap-6">
                                                    <div className="w-24 h-24 flex-shrink-0 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                        <img
                                                            src={item.image}
                                                            alt={item.title}
                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 uppercase tracking-wider">
                                                                {item.brand}
                                                            </span>
                                                            {item.isNew && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 uppercase tracking-wider">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Link
                                                            href={`/products/${item.originalId || item.productId
                                                                }`}
                                                            className="font-bold text-slate-900 hover:text-teal-600 transition-colors line-clamp-1 mb-1 block"
                                                        >
                                                            {item.title}
                                                        </Link>
                                                        <p className="text-xs text-slate-500 mb-2 line-clamp-1">
                                                            {item.specs.processor} • {item.specs.ram}
                                                        </p>
                                                        <button
                                                            onClick={() => removeFromCart(item.productId?.toString() || '')}
                                                            className="text-red-500 text-xs font-medium hover:underline flex items-center"
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <span className="font-medium text-slate-900">
                                                        ₹{item.finalPrice.toLocaleString("en-IN")}
                                                    </span>
                                                </div>

                                                <div className="col-span-2 flex justify-center">
                                                    <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm">
                                                        <button
                                                            onClick={() => updateQuantity(item.id?.toString() || '', -1)}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-l-lg transition-colors"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="w-10 text-center font-semibold text-slate-900 text-sm">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id?.toString() || '', 1)}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-r-lg transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center md:text-right font-bold text-slate-900">
                                                    ₹
                                                    {(item.finalPrice * item.quantity).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="mt-6 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                                    <div className="p-2 bg-green-50 rounded-full text-green-600">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">
                                            Free Shipping
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            On all orders over ₹
                                            {shippingThreshold.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                                    <div className="p-2 bg-teal-50 rounded-full text-teal-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">
                                            Secure Payment
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            256-bit SSL Encrypted
                                        </p>
                                    </div>
                                </div>
                                {/* Cart is one of the three places (product page, cart,
                                    checkout) the advance amount must be disclosed before
                                    final checkout — was previously only shown at checkout. */}
                                {STORE_POLICIES.codAvailable && (
                                    <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                                        <div className="p-2 bg-amber-50 rounded-full text-amber-600">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">
                                                Cash on Delivery
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                {finalTotal > STORE_POLICIES.codAdvanceAmount
                                                    ? `₹${STORE_POLICIES.codAdvanceAmount} advance to confirm, rest on delivery`
                                                    : "Pay in full on delivery"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="md:hidden">
                                    <Link
                                        href="/products"
                                        className="w-full bg-teal-600 text-base text-white font-bold p-4 rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <ShoppingBag className="w-5 h-5" /> Add More to Cart
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary (Desktop Sticky / Mobile Hidden) */}
                        <div className="hidden lg:block w-full lg:w-96 flex-shrink-0">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                                <h2 className="text-lg font-bold text-slate-900 mb-6">
                                    Order Summary
                                </h2>

                                <div className="space-y-3 border-t border-slate-100 pt-6 mb-6">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping Estimate</span>
                                        <span
                                            className={
                                                shippingCost === 0 ? "text-green-600 font-medium" : ""
                                            }
                                        >
                                            {shippingCost === 0
                                                ? "Free"
                                                : `₹${shippingCost.toLocaleString("en-IN")}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Tax Estimate</span>
                                        <span className="text-slate-400 italic">
                                            Calculated at next step
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-slate-100 pt-6 mb-6">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-2xl font-bold text-slate-900">
                                        ₹{finalTotal.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-400 mb-4 text-center">
                                    Shipping & taxes calculated at checkout
                                </p>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 flex items-center justify-center group"
                                >
                                    Checkout
                                    <span className="ml-2 group-hover:translate-x-1 transition-transform">
                                        →
                                    </span>
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-0 right-0 px-6 hidden md:flex justify-center">
                                <Link
                                    href="/products"
                                    className="w-56 bg-teal-600 text-white font-bold p-4 rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <ShoppingBag className="w-5 h-5" /> Shop More
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.1)] md:hidden z-30 flex items-center justify-between gap-4 pb-6">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-medium">
                            Total Price
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                            ₹{finalTotal.toLocaleString("en-IN")}
                        </span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="flex-1 bg-teal-600 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all active:scale-95"
                    >
                        Checkout
                    </button>
                </div>

            </div>
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    {/* Centered Login Card */}
                    <div className="w-full max-w-md mx-4">
                        <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => setShowLogin(false)} />
                    </div>
                </div>
            )}
        </>
    );
}
