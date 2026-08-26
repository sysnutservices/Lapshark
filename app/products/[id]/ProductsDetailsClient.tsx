"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { Category } from '@/types';
import { Star, Truck, Shield, ShoppingBag, Check, ClipboardCheck, Battery, Plus, ArrowLeft, User } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Review } from '@/types';
import { api } from '@/api/api';
import { useAuth } from '@/context/AuthContext';
import { CheckoutLogin } from '@/components/LoginComponent';
import Script from 'next/script';
import SkeletonProductCard from '@/components/SkeletonProductCard';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from '@/components/ui/carousel';

// MUST stay at module scope. Declared inside the component, dynamic() produced a
// new lazy component type on every render, so a client-side transition into this
// route could never settle: Next fetched the RSC payload and the page's images
// and chunks, then hung without committing — clicking a product card silently
// did nothing, with no console error. BlogDetailsClient already declares its
// Markdown this way, which is why blog links kept working.
// ssr stays ON so the description is in the server HTML for crawlers.
const Markdown = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => {
        const m = mod as any;
        return m.default.Markdown || m.Markdown;
    })
) as React.ComponentType<any>;

export default function ProductDetailsClient({ productSlug, initialProduct }: { productSlug: string; initialProduct?: any }) {
    const router = useRouter();

    const { products, loading } = useStore();
    const { addToCart } = useCart();
    const { addToRecentlyViewed, addresses } = useUserFeatures();
    const { user } = useAuth();

    const [selectedRam, setSelectedRam] = useState<any>(null);
    const [selectedCondition, setSelectedCondition] = useState<any>(null);
    const [selectedStorage, setSelectedStorage] = useState<any>(null);
    const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
    const [activeImage, setActiveImage] = useState<string>('');
    const [showLogin, setShowLogin] = useState(false);
    // CheckoutLogin is shared with the buy-now flow, which always wants to land
    // on /checkout after login — writing a review doesn't, so this steers
    // handleLoginSuccess instead of the checkout redirect firing every time.
    const [loginIntent, setLoginIntent] = useState<'checkout' | 'review'>('checkout');

    const [productReviews, setProductReviews] = useState<Review[]>([]);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Server already fetched this product for metadata; use it until the store loads
    // so the details render in the initial HTML instead of a skeleton.
    const product = products.find(p => p.slug === productSlug) ?? initialProduct;

    const accessories = products.filter(p => p.category === Category.ACCESSORIES);
    const featuredAccessory = accessories[0];
    const moreAccessories = accessories.slice(1, 4);

    useEffect(() => {
        if (product?.configOptions) {
            setSelectedRam(product.configOptions.ram?.[0] || null);
            setSelectedStorage(product.configOptions.storage?.[0] || null);
            setSelectedWarranty(product.configOptions.warranty?.[0] || null);
        }
        if (product?.image) {
            setActiveImage(product.image);
        }
    }, [product?.id]);

    useEffect(() => {
        if (product) {
            addToRecentlyViewed(product);
            trackEvent("view_item", {
                productId: product.productId || product.id || product._id || "",
                title: product.title,
                category: product.category,
                brand: product.brand,
                price: product.price,
                finalPrice: product.finalPrice,
            });
        }
    }, [product?.id, addToRecentlyViewed]);

    useEffect(() => {
        if (!product?._id) return;
        api.get(`/products/${product._id}/reviews`)
            .then(res => setProductReviews(res.data || []))
            .catch(() => setProductReviews([]));
    }, [product?._id]);

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product?._id || !reviewComment.trim()) return;
        setSubmittingReview(true);
        try {
            await api.post(
                `/products/${product._id}/reviews`,
                { rating: reviewRating, comment: reviewComment.trim() },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const res = await api.get(`/products/${product._id}/reviews`);
            setProductReviews(res.data || []);
            setReviewComment('');
            setReviewRating(5);
            setShowReviewForm(false);
        } catch (err) {
            console.error('❌ Submit review failed', err);
            alert('Could not submit your review. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (!product && (loading || !products || products.length === 0)) {
        return <ProductDetailsSkeleton />;
    }

    if (!product) {
        return (
            <div className="text-center py-32 text-xl font-medium text-slate-500">Product not found</div>
        );
    }

    const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    const finalPrice = (product?.finalPrice || 0) + (selectedRam?.price || 0) + (selectedStorage?.price || 0) + (selectedWarranty?.price || 0);
    const originalPrice = (product?.price || 0) + (selectedRam?.price || 0) + (selectedStorage?.price || 0) + (selectedWarranty?.price || 0);

    const galleryImages = [product.image, ...(product.images || [])].filter((img, index, self) => self.indexOf(img) === index);
    const averageRating = productReviews.length > 0
        ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length
        : product.rating;

    const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
        const count = productReviews.filter(r => Math.floor(r.rating) === star).length;
        const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0;
        return { star, count, percentage };
    });

    const validateConfig = () => {
        if (product?.configOptions?.ram && !selectedRam) {
            alert('Please select RAM');
            return false;
        }
        if (product?.configOptions?.storage && !selectedStorage) {
            alert('Please select Storage');
            return false;
        }
        return true;
    };

    const buildCustomProduct = () => {
        const compositeId = `${product.productId}-${selectedRam?.value || 'default'}-${selectedStorage?.value || 'default'}-${selectedWarranty?.value || 'none'}`;
        return {
            ...product,
            originalId: product.productId,
            id: compositeId,
            title: selectedRam && selectedStorage
                ? `${product.title} (${selectedRam?.value} / ${selectedStorage?.value})`
                : product.title,
            finalPrice,
            price: originalPrice,
            configOptions: {
                ram: selectedRam,
                storage: selectedStorage,
                warranty: selectedWarranty
            },
            config: {
                ram: selectedRam?.value,
                storage: selectedStorage?.value,
                warranty: selectedWarranty?.value
            },
            specs: {
                ...product.specs,
                ram: selectedRam?.value || product.specs.ram,
                storage: selectedStorage?.value || product.specs.storage
            }
        };
    };

    const handleAddToCart = () => {
        if (!validateConfig()) return;
        addToCart(buildCustomProduct());
        router.push('/cart');
    };

    const handleBuyNow = () => {
        if (!validateConfig()) return;
        addToCart(buildCustomProduct());

        const token = localStorage.getItem("token");
        if (!token) {
            setShowLogin(true);
            return;
        }
        if (addresses.length === 0) {
            router.push("/addresses");
            return;
        }
        router.push('/checkout');
    };

    const handleLoginSuccess = () => {
        setShowLogin(false);
        if (loginIntent === 'review') {
            setShowReviewForm(true);
            return;
        }
        router.push("/checkout");
    };

    const ConfigSection = ({ title, options, selected, setSelected }: any) => {
        if (!options || options.length === 0) return null;

        return (
            <div className="mb-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">{title}</h3>
                <div className="flex flex-wrap gap-2">
                    {options.map((opt: any) => {
                        const isSelected = selected?.value === opt.value;
                        return (
                            <button
                                key={`${title}-${opt.value}`}
                                onClick={() => setSelected(opt)}
                                className={cn(
                                    "rounded-xl border px-3.5 py-2 text-left transition-all active:scale-[0.98]",
                                    isSelected
                                        ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn("font-semibold text-sm", isSelected ? "text-teal-900" : "text-slate-700")}>
                                    {opt.label}
                                </div>
                                <div className={cn("text-xs font-medium", isSelected ? "text-teal-700" : "text-slate-500")}>
                                    {opt.price === 0 ? 'Included' : `+ ₹${opt.price.toLocaleString('en-IN')}`}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        );
    };

    const ActionButtons = ({ className }: { className?: string }) => (
        <div className={cn("space-y-2.5", className)}>
            <Button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="shimmer-btn h-auto w-full rounded-2xl bg-teal-600 py-4 text-base font-bold text-white hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none md:py-5"
            >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {product.stock > 0 ? `Buy Now — ₹${finalPrice.toLocaleString('en-IN')}` : 'Out of Stock'}
            </Button>
            <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                variant="outline"
                className="h-auto w-full rounded-2xl border-slate-900 py-4 text-base font-bold text-slate-900 hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 md:py-5"
            >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
        </div>
    );

    return (
        <>
            {/* Product JSON-LD deliberately lives in the server component
                (app/products/[id]/page.tsx), NOT here. Rendering a <script> with
                dangerouslySetInnerHTML from a client component broke client-side
                navigation into this route: Next intercepted the link click
                (defaultPrevented=true) and the render then failed silently, so
                clicking a product card did nothing. Server-rendered schema gives
                crawlers the same markup without touching client navigation. */}
            {showLogin && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4">
                        <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => setShowLogin(false)} />
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 bg-white pb-28 md:pb-12">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 mb-12 md:mb-24">
                    {/* Left column - Product images */}
                    <div className="lg:col-span-7">
                        <div className="lg:sticky lg:top-24 space-y-4">
                            <div className="bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 flex items-center justify-center relative min-h-[300px] md:min-h-[500px] overflow-hidden">
                                <img
                                    src={(activeImage || product.image)}
                                    alt={product.title}
                                    className="w-full max-h-[300px] md:max-h-[500px] object-contain mix-blend-multiply transition-all duration-500 ease-in-out"
                                />
                                {product.condition && (
                                    <Badge className="absolute top-4 left-4 md:top-8 md:left-8 h-auto gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-900 shadow-sm backdrop-blur-md hover:bg-white/80 md:px-4 md:py-2 md:text-xs">
                                        <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> {product.condition}
                                    </Badge>
                                )}
                            </div>

                            {galleryImages.length > 1 && (
                                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
                                    {galleryImages.map((img, idx) => (
                                        <button
                                            key={`gallery-${idx}-${img}`}
                                            onClick={() => setActiveImage(img)}
                                            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl bg-slate-50 border-2 flex-shrink-0 overflow-hidden transition-all ${activeImage === img ? 'border-teal-600 ring-2 ring-teal-100' : 'border-transparent hover:border-slate-200'
                                                }`}
                                        >
                                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
                                <div className="bg-emerald-50/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-emerald-100 flex items-start gap-4">
                                    <div className="p-2.5 md:p-3 text-emerald-600 flex-shrink-0"><ClipboardCheck className="w-6 h-6 md:w-7 md:h-7" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm md:text-base">40+ Point Check</h4>
                                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">Certified by expert technicians.</p>
                                    </div>
                                </div>
                                <div className="bg-teal-50/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-teal-100 flex items-start gap-4">
                                    <div className="p-2.5 md:p-3 text-teal-600 flex-shrink-0"><Battery className="w-6 h-6 md:w-7 md:h-7" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm md:text-base">80%+ Battery</h4>
                                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">Guaranteed health & performance.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:block prose prose-slate max-w-none px-1 md:px-0 mt-6">
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Product Overview</h3>
                                <Markdown
                                    source={product.description || ''}
                                    style={{
                                        fontSize: '16px',
                                        backgroundColor: 'transparent',
                                        color: 'inherit',
                                        fontWeight: 'normal',
                                        lineHeight: '1.5'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right column - Product details */}
                    <div className="lg:col-span-5">
                        <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-slate-100">
                            <Badge variant="outline" className="mb-3 h-auto rounded-full border-teal-100 bg-teal-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-700 hover:bg-teal-50 md:mb-4 md:text-xs">
                                {product.category}
                            </Badge>
                            <h1 className="text-2xl font-extrabold text-slate-900 mb-3 md:mb-4 tracking-tight leading-tight">{product.title}</h1>

                            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={`rating-star-${i}`} className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                                <span className="text-xs md:text-sm font-bold text-slate-500 border-b border-slate-300 pb-0.5 cursor-pointer">{product.reviews} reviews</span>
                            </div>

                            <div className="flex items-baseline gap-3 md:gap-4 flex-wrap">
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">₹{finalPrice.toLocaleString('en-IN')}</span>
                                {product.discountPercent > 0 && (
                                    <span className="text-lg md:text-xl text-slate-400 line-through font-medium">₹{originalPrice.toLocaleString('en-IN')}</span>
                                )}
                                {product.discountPercent > 0 && (
                                    <Badge className="h-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                                        {product.discountPercent}% off
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
                            {Object.entries((product.specs || {}) as Record<string, string>).slice(0, 4).map(([key, value]) => (
                                <div key={`spec-${key}`} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">{key}</span>
                                    <span className="text-base font-semibold text-slate-900 truncate block">{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-2">
                            {product?.configOptions?.condition && (
                                <ConfigSection
                                    title="Condition"
                                    options={product.configOptions.condition}
                                    selected={selectedCondition}
                                    setSelected={setSelectedCondition}
                                />
                            )}
                            {product?.configOptions?.ram && (
                                <ConfigSection
                                    title="Memory"
                                    options={product.configOptions.ram}
                                    selected={selectedRam}
                                    setSelected={setSelectedRam}
                                />
                            )}
                            {product?.configOptions?.storage && (
                                <ConfigSection
                                    title="Storage"
                                    options={product.configOptions.storage}
                                    selected={selectedStorage}
                                    setSelected={setSelectedStorage}
                                />
                            )}
                            {product?.configOptions?.warranty && (
                                <ConfigSection
                                    title="Protection Plan"
                                    options={product.configOptions.warranty}
                                    selected={selectedWarranty}
                                    setSelected={(opt: any) => {
                                        setSelectedWarranty(opt);
                                        trackEvent("warranty_select", {
                                            productId: product.productId || product.id || product._id || "",
                                            warrantyValue: opt?.value,
                                            warrantyPrice: opt?.price,
                                        });
                                    }}
                                />
                            )}
                        </div>

                        <div className="md:hidden grid grid-cols-1 gap-3 mt-2 mb-6">
                            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-4">
                                <div className="p-2.5 text-emerald-600 flex-shrink-0"><ClipboardCheck className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">40+ Point Check</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Certified by expert technicians.</p>
                                </div>
                            </div>
                            <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-100 flex items-start gap-4">
                                <div className="p-2.5 text-teal-600 flex-shrink-0"><Battery className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">80%+ Battery</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Guaranteed health & performance.</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden prose prose-slate max-w-none mt-2 mb-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Product Overview</h3>
                            <Markdown
                                source={product.description || ''}
                                style={{
                                    fontSize: '16px',
                                    backgroundColor: 'transparent',
                                    color: 'inherit',
                                    fontWeight: 'normal',
                                    lineHeight: '1.5'
                                }}
                            />
                        </div>

                        {/* Desktop CTA (in normal flow) */}
                        <ActionButtons className="hidden md:block mt-4" />

                        <div className="hidden md:flex justify-center gap-6 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center"><Truck className="w-3 h-3 mr-1.5" /> Free Shipping</span>
                            <span className="flex items-center"><Shield className="w-3 h-3 mr-1.5" /> Returns Accepted</span>
                        </div>
                    </div>
                </div>

                {/* Accessories */}
                {featuredAccessory && (
                    <div className="mb-12 md:mb-24">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-8">Complete Your Setup</h2>
                        <div className="bg-slate-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                <div className="lg:col-span-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                    <Badge className="absolute top-0 right-0 h-auto rounded-none rounded-bl-2xl bg-slate-900 px-4 py-2 text-[10px] font-bold hover:bg-slate-900">RECOMMENDED</Badge>
                                    <div className="w-40 h-40 md:w-48 md:h-48 my-4 md:my-6">
                                        <img src={featuredAccessory?.image} alt={featuredAccessory?.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 line-clamp-1">{featuredAccessory?.title}</h3>
                                    <p className="text-teal-600 font-bold text-xl md:text-2xl mb-4 md:mb-6">₹{featuredAccessory?.finalPrice.toLocaleString('en-IN')}</p>
                                    <Button
                                        onClick={() => {
                                            if (featuredAccessory) {
                                                const accessoryWithId = { ...featuredAccessory, id: featuredAccessory.productId };
                                                addToCart(accessoryWithId);
                                            }
                                        }}
                                        variant="secondary"
                                        className="h-auto w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-900 hover:bg-slate-900 hover:text-white md:text-base"
                                    >
                                        Add to Order
                                    </Button>
                                </div>

                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {moreAccessories.map((acc, index) => (
                                        <div key={acc?.id || `accessory-${index}`} className="bg-white rounded-2xl p-4 flex gap-4 items-center border border-transparent hover:border-slate-200 transition-all">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-xl p-2 flex-shrink-0">
                                                <img src={acc.image} className="w-full h-full object-contain mix-blend-multiply" alt={acc.title} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate text-sm md:text-base">{acc.title}</h4>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="font-bold text-slate-500 text-sm md:text-base">₹{acc.finalPrice.toLocaleString('en-IN')}</span>
                                                    <button
                                                        onClick={() => {
                                                            const accessoryWithId = { ...acc, id: acc.productId };
                                                            addToCart(accessoryWithId);
                                                        }}
                                                        className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reviews Section */}
                <div className="mb-12 md:mb-24 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 p-6 md:p-12 shadow-sm">
                    <div className="flex items-center justify-between mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ratings & Reviews</h2>
                        <Button
                            onClick={() => { if (user) { setShowReviewForm(v => !v); } else { setLoginIntent('review'); setShowLogin(true); } }}
                            className="hidden h-auto rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold hover:bg-teal-700 md:flex"
                        >
                            Write a Review
                        </Button>
                    </div>

                    {showReviewForm && (
                        <form onSubmit={submitReview} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-2">Your Rating</p>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button type="button" key={`rate-${n}`} onClick={() => setReviewRating(n)}>
                                            <Star className={`w-6 h-6 ${n <= reviewRating ? 'fill-current text-amber-400' : 'text-slate-200'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share your experience with this laptop..."
                                required
                                maxLength={2000}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-teal-500 focus:outline-none"
                            />
                            <div className="flex gap-3">
                                <Button type="submit" disabled={submittingReview} className="h-auto rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold hover:bg-teal-700">
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setShowReviewForm(false)} className="h-auto rounded-xl px-5 py-2.5 text-sm font-bold">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="text-center">
                                    <span className="block text-5xl font-extrabold text-slate-900 tracking-tight">{averageRating.toFixed(1)}</span>
                                    <span className="text-xs text-slate-500 font-medium mt-1 block">out of 5</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex text-amber-400 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={`avg-star-${i}`} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">{productReviews.length} Verified Reviews</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {ratingDistribution.map((item) => (
                                    <div key={`rating-dist-${item.star}`} className="flex items-center gap-3 text-xs md:text-sm">
                                        <span className="font-bold text-slate-700 w-3">{item.star}</span>
                                        <Star className="w-3 h-3 text-slate-300" />
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 rounded-full"
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-slate-400 w-8 text-right">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-6">
                            {productReviews.length > 0 ? (
                                (showAllReviews ? productReviews : productReviews.slice(0, 3)).map((review) => (
                                    <div key={`review-${review._id}`} className="pb-6 border-b border-slate-100 last:border-0">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{review.userName}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-amber-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={`review-${review._id}-star-${i}`} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                        {review.verifiedPurchase && (
                                                            <Badge className="h-auto gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-50">
                                                                <Check className="w-2.5 h-2.5" /> Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                    <p className="text-slate-500 font-medium mb-4">No reviews yet. Be the first to share your experience!</p>
                                    <Button
                                        onClick={() => { if (user) { setShowReviewForm(true); } else { setLoginIntent('review'); setShowLogin(true); } }}
                                        className="h-auto rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold hover:bg-teal-700"
                                    >
                                        Write a Review
                                    </Button>
                                </div>
                            )}

                            {!showAllReviews && productReviews.length > 3 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAllReviews(true)}
                                    className="h-auto w-full rounded-xl py-3 text-sm font-bold text-teal-600 hover:bg-teal-50"
                                >
                                    View All Reviews
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-slate-100 pt-12 md:pt-16">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-10">Similar Models</h2>

                        <Carousel opts={{ align: "start" }}>
                            <CarouselContent>
                                {relatedProducts.map((p) => (
                                    <CarouselItem key={`related-${p.id}`} className="basis-[260px] md:basis-1/3 lg:basis-1/4">
                                        <ProductCard product={p} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex -left-4" />
                            <CarouselNext className="hidden md:flex -right-4" />
                        </Carousel>
                    </div>
                )}
            </div>

            {/* Mobile Sticky CTA */}
            <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur-md p-4 pb-6 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.08)] md:hidden">
                <ActionButtons />
            </div>
        </>
    );
}

// Skeleton component for loading state
function ProductDetailsSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 bg-white animate-pulse">
            <div className="h-10 w-24 bg-slate-200 rounded mb-6"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 mb-12 md:mb-24">
                {/* Left column skeleton */}
                <div className="lg:col-span-7">
                    <div className="bg-slate-200 rounded-[2.5rem] h-[500px] mb-4"></div>
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-20 h-20 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>

                {/* Right column skeleton */}
                <div className="lg:col-span-5">
                    <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
                    <div className="h-10 bg-slate-200 rounded mb-4"></div>
                    <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                    <div className="h-12 w-48 bg-slate-200 rounded mb-8"></div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="h-32 bg-slate-200 rounded-xl"></div>
                        <div className="h-32 bg-slate-200 rounded-xl"></div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="h-14 bg-slate-200 rounded-xl"></div>
                        <div className="h-14 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>
            </div>

            {/* Related products skeleton */}
            <div className="border-t border-slate-100 pt-12">
                <div className="h-8 w-48 bg-slate-200 rounded mb-8"></div>
                <div className="flex gap-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="min-w-[300px]">
                            <SkeletonProductCard />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
