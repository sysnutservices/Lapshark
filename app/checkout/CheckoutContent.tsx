"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Lock, Truck, CheckCircle, ChevronDown, ChevronUp, ShoppingBag, MapPin, Mail, Phone, User, ShieldCheck, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { API_URL } from '@/api/api';
import confetti from "canvas-confetti"
import { CheckoutLogin } from '@/components/LoginComponent';
import { trackEvent, generateEventId, trackPurchaseConversion } from '@/lib/analytics';

// Declare Razorpay on window object to avoid TS errors
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutContent() {
    const { cart, totalPrice, clearCart } = useCart();
    const finalCart = cart;
    const { getSelectedAddress, fetchAddresses } = useUserFeatures();
    const { placeOrder, validateCoupon } = useStore();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [couponCode, setCouponCode] = useState("");
    const selectedAddress = getSelectedAddress();
    const [showLogin, setShowLogin] = useState(false);
    const [locationReady, setLocationReady] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [serviceability, setServiceability] = useState<{ checked: boolean; serviceable: boolean; message?: string }>({ checked: false, serviceable: true });
    const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
    // Mirrors orderController's COD_ADVANCE_AMOUNT — the server is what
    // actually decides the charged amount, this is only for the pre-payment
    // label/summary so keep the two in sync if it ever changes.
    const COD_ADVANCE_AMOUNT = 500;

    // Pincode check against Ekart — pure checkout UX guardrail (fails open on
    // any error/pincode format the backend rejects), not the actual gate on
    // whether an order can ship. Re-runs whenever the selected address changes.
    useEffect(() => {
        const zip = selectedAddress?.zip;
        if (!zip) {
            setServiceability({ checked: false, serviceable: true });
            return;
        }
        let cancelled = false;
        fetch(`${API_URL}/shipping/serviceability/${zip}`)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setServiceability({ checked: true, serviceable: data.serviceable !== false, message: data.message });
            })
            .catch(() => {
                if (!cancelled) setServiceability({ checked: true, serviceable: true });
            });
        return () => { cancelled = true; };
    }, [selectedAddress?.zip]);

    useEffect(() => {
        // Fetch addresses
        fetchAddresses();

        // Get user location
        const getLocation = () => {
            if (!navigator.geolocation) {
                console.log("Geolocation not supported");
                setLocationReady(true); // Still allow checkout
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const location = { latitude, longitude };
                    setUserLocation(location);
                    localStorage.setItem("userLocation", JSON.stringify(location));
                    setLocationReady(true);
                },
                (err) => {
                    console.warn("Geolocation Error:", err.message);
                    setLocationReady(true); // Still allow checkout even without location
                }
            );
        };

        getLocation();
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        phone: ''
    });

    // Shipping logic matching Cart page
    const shippingThreshold = 10000;
    const shippingCost = totalPrice > shippingThreshold ? 0 : 500;

    // Derived, not its own state: the cart hydrates from localStorage/API
    // asynchronously, so `totalPrice` is 0 on CheckoutContent's very first
    // render. A `useState(totalPrice + shippingCost)` initializer captures
    // that stale 0 permanently — nothing re-syncs it once the cart finishes
    // loading, so the whole checkout (order total, Pay button, Razorpay
    // amount) silently locked to a ₹500 shipping-only charge for every
    // order. Deriving it fresh every render is what actually fixes that,
    // not a useEffect chasing totalPrice around.
    const finalTotal = totalPrice + shippingCost - discount;

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Checkout is unavailable</h2>
                <p className="text-slate-500 mb-8">Your cart is currently empty.</p>
                <Link href="/" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl">
                    Return to Shop
                </Link>
            </div>
        );
    }

    // What Razorpay actually charges right now: the full total for online
    // payment, or just the advance for COD (full total if the order's too
    // small to leave anything meaningful for COD — mirrors the server guard).
    const isCODEligible = finalTotal > COD_ADVANCE_AMOUNT;
    const payNowAmount = paymentMethod === 'COD' && isCODEligible ? COD_ADVANCE_AMOUNT : finalTotal;
    const codBalance = paymentMethod === 'COD' && isCODEligible ? finalTotal - COD_ADVANCE_AMOUNT : 0;

    // Helper to load Razorpay Script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const MySwal = withReactContent(Swal);

    const handleValidateCoupon = async () => {
        try {
            const result = await validateCoupon(couponCode, totalPrice);

            if (result?.valid) {
                setDiscount(result.discountAmount);
                trackEvent("coupon_applied", { couponCode, discountAmount: result.discountAmount });

                const duration = 5 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
                const randomInRange = (min: number, max: number) =>
                    Math.random() * (max - min) + min;

                const interval = window.setInterval(() => {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }
                    const particleCount = 50 * (timeLeft / duration);
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    });
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    });
                }, 250);
            } else {
                setDiscount(0);
                MySwal.fire({
                    title: "Invalid Coupon!",
                    icon: "error",
                    draggable: true,
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        } catch (error) {
            console.error("Coupon validation failed:", error);
            setDiscount(0);
        }
    };

    const createOrderOnServer = async (metaEventId: string) => {
        // Get location from state or localStorage
        let location = userLocation;
        if (!location) {
            const stored = localStorage.getItem("userLocation");
            if (stored) {
                try {
                    location = JSON.parse(stored);
                } catch (e) {
                    console.error("Failed to parse location:", e);
                }
            }
        }

        // Generate Google Maps link if location is available
        let mapLink = "";
        if (location && selectedAddress) {
            mapLink = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${encodeURIComponent(
                `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip}`
            )}`;
        }

        const res = await fetch(`${API_URL}/orders/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                customerName: selectedAddress?.name || "Guest",
                customerEmail: selectedAddress?.email || "",
                shippingAddress: {
                    street: selectedAddress?.street || "",
                    city: selectedAddress?.city || "",
                    state: selectedAddress?.state || "",
                    zip: selectedAddress?.zip || "",
                    country: selectedAddress?.country || "India",
                    phone: selectedAddress?.phone || "",
                    type: selectedAddress?.type || "Home",
                },
                mapLink: mapLink, // Include map link
                coupon: couponCode || null,
                discount: discount || 0,
                total: finalTotal,
                paymentMethod,
                // Reused server-side by markOrderPaid's Meta CAPI Purchase
                // call, and here again once payment succeeds — the shared id
                // is what lets Meta dedupe the browser Pixel hit and the
                // server CAPI hit into one conversion instead of two.
                metaEventId,
                items: finalCart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    config: {
                        ram: item.config?.ram,
                        storage: item.config?.storage,
                        warranty: item.config?.warranty,
                    }
                }))

            })
        });

        return res.json();
    };



    const handleRazorpayPayment = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setShowLogin(true);
            return;
        }

        if (!selectedAddress) {
            MySwal.fire({
                title: "No Address Selected",
                text: "Please select a delivery address to continue",
                icon: "warning",
                confirmButtonText: "Select Address"
            }).then(() => {
                router.push('/addresses');
            });
            return;
        }

        trackEvent("begin_checkout", { finalTotal, paymentMethod, itemCount: finalCart.length });
        const metaEventId = generateEventId();

        setIsProcessing(true);

        try {
            const orderData = await createOrderOnServer(metaEventId);

            // createOrderOnServer just returns res.json() unchecked — a
            // rejected coupon, out-of-stock item, etc. comes back as
            // {message: "..."} with no key/razorpayOrderId, which used to
            // fall straight through into `new window.Razorpay({key:
            // undefined, ...})` and open a broken payment modal with no
            // explanation.
            if (!orderData?.success || !orderData?.razorpayOrderId) {
                MySwal.fire({
                    title: "Couldn't place order",
                    text: orderData?.message || "Something went wrong. Please try again.",
                    icon: "error"
                });
                setIsProcessing(false);
                return;
            }

            const res = await loadRazorpayScript();
            if (!res) {
                alert("Razorpay failed to load");
                setIsProcessing(false);
                return;
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                order_id: orderData.razorpayOrderId,
                handler: async function (response: any) {
                    // Money has already left the customer's account at this
                    // point — Razorpay's own modal confirmed the charge.
                    // This call is only asking our backend to record that,
                    // so its result has to gate cart-clear/redirect: the
                    // previous code ignored it entirely, meaning a failed
                    // verify (network blip, server error, ...) still showed
                    // "Order Success" and wiped the cart even though the
                    // order was left sitting unpaid in the database with no
                    // way for the customer to know or retry.
                    try {
                        const verifyRes = await fetch(`${API_URL}/orders/verify`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${localStorage.getItem("token")}`
                            },
                            body: JSON.stringify(response)
                        });
                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok || !verifyData?.success) {
                            throw new Error(verifyData?.message || "Payment verification failed");
                        }

                        trackPurchaseConversion({
                            eventId: metaEventId,
                            orderId: orderData.razorpayOrderId,
                            total: finalTotal,
                            items: finalCart.map(item => ({
                                productId: item.productId,
                                title: item.title,
                                quantity: item.quantity,
                                finalPrice: item.finalPrice,
                                price: item.price,
                            })),
                        });

                        setIsProcessing(false);
                        clearCart();
                        router.push(`/order-success/${orderData.razorpayOrderId}`);
                    } catch (verifyError) {
                        console.error("Payment verification error:", verifyError);
                        setIsProcessing(false);
                        MySwal.fire({
                            title: "Payment received, confirmation pending",
                            text: `Your payment went through but we couldn't confirm it automatically. Please contact support with this reference: ${response.razorpay_payment_id}`,
                            icon: "warning"
                        });
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    }
                },
                theme: {
                    color: '#0F172A'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

            rzp.on("payment.failed", function (response: any) {
                trackEvent("checkout_payment_failed", { reason: response?.error?.description });
                alert(response.error.description);
                setIsProcessing(false);
            });
        } catch (error) {
            console.error("Payment error:", error);
            MySwal.fire({
                title: "Error",
                text: "Something went wrong. Please try again.",
                icon: "error"
            });
            setIsProcessing(false);
        }
    };

    const handleLoginSuccess = async () => {
        setShowLogin(false);
        await fetchAddresses();
    };

    return (
        <>
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4">
                        <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => setShowLogin(false)} />
                    </div>
                </div>
            )}

            <div className="bg-slate-50 min-h-screen py-6 md:py-12 pb-40 md:pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="flex flex-col md:flex-row md:items-baseline md:space-x-2">
                                <h1 className="text-xl md:text-3xl font-bold text-slate-900">Checkout</h1>
                                <span className="text-slate-500 font-medium text-sm md:text-base">({finalCart.length} Items)</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

                        {/* Mobile Order Summary Toggle */}
                        <div className="lg:hidden mb-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <button className="w-full flex items-center justify-between p-5 transition-colors">
                                <div className="flex items-center text-slate-700 font-bold">
                                    <ShoppingBag className="w-5 h-5 mr-3 text-teal-600" />
                                    <span>Order Summary</span>
                                </div>
                                <span className="font-extrabold text-lg text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                            </button>

                            <div className="transition-all duration-300 ease-in-out max-h-[1000px] opacity-100">
                                <div className="p-5 border-t border-slate-100 bg-white">
                                    <div className="space-y-4 mb-6">
                                        {finalCart.map((item) => (
                                            <div key={item.productId} className="flex gap-4 items-center">
                                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 relative">
                                                    <span className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg z-10">{item.quantity}</span>
                                                    <img src={item.image} alt={item.title} className="h-full w-full object-contain p-1 mix-blend-multiply" />
                                                </div>
                                                <div className="flex flex-1 flex-col justify-center">
                                                    <div className="flex justify-between text-sm font-medium text-slate-900">
                                                        <h3 className="line-clamp-1 mr-4">{item.title}</h3>
                                                        <p className="whitespace-nowrap font-bold">₹{(item.finalPrice * item.quantity).toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{item.specs.processor} • {item.specs.ram}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Discount Code"
                                            className="bg-white w-full flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                                        />
                                        <button onClick={handleValidateCoupon} className="bg-teal-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm">
                                            Apply
                                        </button>
                                    </div>
                                    <div className="pt-4 space-y-2 text-sm">
                                        <div className="flex font-bold justify-between text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Shipping</span>
                                            <span className={shippingCost === 0 ? 'text-green-600 font-bold' : ''}>
                                                {shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString('en-IN')}`}
                                            </span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-slate-500">
                                                <span>Coupon Discount</span>
                                                <span className="font-bold text-green-600"> - ₹{discount.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center border-t border-dashed border-slate-300 justify-between mt-2 py-3">
                                            <span className="text-xl font-bold text-slate-900">Total</span>
                                            <div className="text-right">
                                                <span className="block text-2xl font-extrabold text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                                                <span className="text-xs text-slate-500 font-medium">Including Taxes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Left Column: Forms */}
                        <div className="lg:col-span-7 space-y-4">

                            {/* Shipping Address Display */}
                            <section className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
                                <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h2 className="text-slate-700 font-bold flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-teal-600" />
                                        Shipping Address
                                    </h2>
                                    <Link href="/addresses" className="text-sm text-teal-600 font-bold hover:underline flex items-center gap-1">
                                        <Edit2 className="w-3 h-3" /> Change
                                    </Link>
                                </div>
                                <div className="p-6 md:p-8">
                                    {selectedAddress ? (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-900 text-base">{selectedAddress.name}</span>
                                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">{selectedAddress.type}</span>
                                            </div>
                                            <p className="text-slate-600 text-sm mt-1">{selectedAddress.street}</p>
                                            <p className="text-slate-600 text-sm">{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zip}</p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 font-medium">
                                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedAddress.phone}</span>
                                            </div>
                                            {serviceability.checked && !serviceability.serviceable && (
                                                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                                    We currently can&apos;t deliver to this pincode ({selectedAddress.zip}).{serviceability.message ? ` ${serviceability.message}` : ''} Please{' '}
                                                    <Link href="/addresses" className="font-bold underline">choose another address</Link>.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-red-500 font-medium mb-2">No address selected.</p>
                                            <Link href="/addresses" className="text-teal-600 underline font-bold">Select an address</Link>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Payment Method */}
                            <section className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden">
                                <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-slate-700 font-bold flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-teal-600" />
                                        Payment Method
                                    </h2>
                                </div>
                                <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('Razorpay')}
                                        className={`text-left p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Razorpay' ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <span className="font-bold text-slate-900 text-sm block">Pay Online</span>
                                        <span className="text-xs text-slate-500">Card, UPI, Netbanking — full amount now</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('COD')}
                                        className={`text-left p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'COD' ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <span className="font-bold text-slate-900 text-sm block">Cash on Delivery</span>
                                        <span className="text-xs text-slate-500">
                                            {isCODEligible ? `₹${COD_ADVANCE_AMOUNT} advance now, rest on delivery` : 'Full amount now (order too small for COD)'}
                                        </span>
                                    </button>
                                </div>
                                {paymentMethod === 'COD' && isCODEligible && (
                                    <div className="mx-6 md:mx-8 mb-6 -mt-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
                                        Pay <span className="font-bold">₹{COD_ADVANCE_AMOUNT}</span> now to confirm this order. The remaining <span className="font-bold">₹{codBalance.toLocaleString('en-IN')}</span> is collected by the courier on delivery.
                                    </div>
                                )}
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
                                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center mb-2 text-teal-600"><Truck className="w-5 h-5" /></div>
                                    <span className="text-xs font-bold text-slate-900 uppercase">Fast Delivery</span>
                                    <span className="text-[10px] text-slate-500 mt-1">Within 3-5 Days</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2 text-green-600"><CheckCircle className="w-5 h-5" /></div>
                                    <span className="text-xs font-bold text-slate-900 uppercase">Money Back</span>
                                    <span className="text-[10px] text-slate-500 mt-1">7 Days Guarantee</span>
                                </div>
                            </div>

                            <div className="md:hidden max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-center gap-4 mb-4 md:hidden">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="MC" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-5" alt="Visa" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/UPI_logo.svg" className="h-5" alt="UPI" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/640px-RuPay.svg.png" className="h-5" alt="RuPay" />
                                </div>
                                <button
                                    onClick={handleRazorpayPayment}
                                    disabled={isProcessing || !selectedAddress || (serviceability.checked && !serviceability.serviceable)}
                                    className="w-full flex items-center justify-center rounded-2xl border border-transparent bg-teal-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-teal-200 hover:bg-teal-700 cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        paymentMethod === 'COD' && isCODEligible ? `Pay ₹${payNowAmount.toLocaleString('en-IN')} Advance` : `Pay ₹${payNowAmount.toLocaleString('en-IN')}`
                                    )}
                                </button>
                            </div>

                            <div className="mt-2 flex items-center justify-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <Lock className="w-3 h-3" />
                                <span className="text-xs">SSL Secure Encryption</span>
                            </div>
                        </div>

                        {/* Right Column: Order Summary (Desktop Sticky) */}
                        <div className="hidden lg:block lg:col-span-5">
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden sticky top-24">
                                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                                    <h2 className="text-xl font-extrabold text-slate-900">Order Summary</h2>
                                </div>

                                <div className="p-8 max-h-[calc(100vh-400px)] overflow-y-auto space-y-6 custom-scrollbar">
                                    {finalCart.map((item) => (
                                        <div key={item.id} className="flex gap-5">
                                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 relative group">
                                                <span className="absolute top-0 right-0 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm z-10">{item.quantity}</span>
                                                <img src={item.image} alt={item.title} className="h-full w-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                            <div className="flex flex-1 flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 pr-4 leading-relaxed">{item.title}</h3>
                                                    <p className="text-sm font-bold text-slate-900 whitespace-nowrap">₹{(item.finalPrice * item.quantity).toLocaleString('en-IN')}</p>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 font-medium">{item.specs.processor} • {item.specs.ram}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-200 p-8 bg-slate-50/30 space-y-6">
                                    {/* Coupon Input */}
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Discount Code"
                                            className="bg-white flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                                        />
                                        <button onClick={handleValidateCoupon} className="bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm">
                                            Apply
                                        </button>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span className="font-medium">Subtotal</span>
                                            <span className="font-bold text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span className="font-medium">Shipping</span>
                                            <span className={shippingCost === 0 ? 'text-green-600 font-bold flex items-center' : 'font-bold text-slate-900'}>
                                                {shippingCost === 0 ? (
                                                    <><CheckCircle className="w-3 h-3 mr-1.5" /> Free</>
                                                ) : (
                                                    `₹${shippingCost.toLocaleString('en-IN')}`
                                                )}
                                            </span>
                                        </div>

                                        {discount > 0 && (
                                            <div className="flex items-center justify-between text-sm text-slate-600">
                                                <span className="font-medium">Coupon Discount</span>
                                                <span className="font-bold text-green-600"> - ₹{discount.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-dashed border-slate-300 pt-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-lg font-bold text-slate-900">Total</span>
                                            <div className="text-right">
                                                <span className="block text-2xl font-extrabold text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                                                <span className="text-xs text-slate-500 font-medium">Including Taxes</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleRazorpayPayment}
                                            disabled={isProcessing || !selectedAddress || (serviceability.checked && !serviceability.serviceable)}
                                            className="w-full flex items-center justify-center rounded-2xl border border-transparent bg-teal-600 px-6 py-4 text-lg font-bold text-white shadow-xl shadow-teal-200 hover:bg-teal-700 cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                                        >
                                            {isProcessing ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                paymentMethod === 'COD' && isCODEligible ? `Pay ₹${payNowAmount.toLocaleString('en-IN')} Advance` : `Pay ₹${payNowAmount.toLocaleString('en-IN')}`
                                            )}
                                        </button>

                                        <div className="hidden md:flex items-center justify-center gap-6 mt-6">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="MC" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6" alt="Visa" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/UPI_logo.svg" className="h-6" alt="UPI" />
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/640px-RuPay.svg.png" className="h-6" alt="RuPay" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
