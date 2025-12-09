"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { Category } from '@/types';
import { Star, Truck, Shield, ShoppingBag, Check, ClipboardCheck, Battery, Plus, ArrowRight, ArrowLeft, ThumbsUp, User } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { API_URL2 } from '@/api/api';
import { REVIEWS } from '@/env';
import { CheckoutLogin } from '@/components/LoginComponent';
import Script from 'next/script';
import SkeletonProductCard from '@/components/SkeletonProductCard';

export default function ProductDetailsClient({ productId }: { productId: string }) {
    const router = useRouter();

    const { products, loading } = useStore(); // Add loading state from context
    const { addToCart } = useCart();
    const { addToRecentlyViewed, addresses } = useUserFeatures();

    const relatedScrollRef = useRef<HTMLDivElement>(null);

    const [selectedRam, setSelectedRam] = useState<any>(null);
    const [selectedStorage, setSelectedStorage] = useState<any>(null);
    const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
    const [activeImage, setActiveImage] = useState<string>('');
    const [showLogin, setShowLogin] = useState(false);

    const product = products.find(
        p =>
            p.productId === productId ||
            (p as any)._id === productId ||
            (p as any).id === productId
    );

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
        }
    }, [product?.id, addToRecentlyViewed]);

    // Show loading skeleton while data is being fetched
    if (loading || !products || products.length === 0) {
        return <ProductDetailsSkeleton />;
    }

    if (!product) {
        return (
            <div className="text-center py-32 text-xl font-medium text-gray-500">Product not found</div>
        );
    }

    const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    const finalPrice = (product?.finalPrice || 0) + (selectedRam?.price || 0) + (selectedStorage?.price || 0) + (selectedWarranty?.price || 0);
    const originalPrice = (product?.price || 0) + (selectedRam?.price || 0) + (selectedStorage?.price || 0) + (selectedWarranty?.price || 0);

    const galleryImages = [product.image, ...(product.images || [])].filter((img, index, self) => self.indexOf(img) === index);
    const productReviews = REVIEWS.filter(r => r.productId === product.id);
    const averageRating = productReviews.length > 0
        ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length
        : product.rating;

    const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
        const count = productReviews.filter(r => Math.floor(r.rating) === star).length;
        const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0;
        return { star, count, percentage };
    });

    const handleAddToCart = () => {
        if (product?.configOptions?.ram && !selectedRam) {
            alert('Please select RAM');
            return;
        }

        if (product?.configOptions?.storage && !selectedStorage) {
            alert('Please select Storage');
            return;
        }

        const compositeId = `${product.productId}-${selectedRam?.value || 'default'}-${selectedStorage?.value || 'default'}-${selectedWarranty?.value || 'none'}`;

        const customProduct = {
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

        addToCart(customProduct);
        router.push('/cart');
    };

    const handleBuyNow = () => {
        if (product?.configOptions?.ram && !selectedRam) {
            alert('Please select RAM');
            return;
        }

        if (product?.configOptions?.storage && !selectedStorage) {
            alert('Please select Storage');
            return;
        }

        const compositeId = `${product.productId}-${selectedRam?.value || 'default'}-${selectedStorage?.value || 'default'}-${selectedWarranty?.value || 'none'}`;

        const customProduct = {
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
            }
        };

        addToCart(customProduct);

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
        router.push("/checkout");
    };

    const ConfigSection = ({ title, options, selected, setSelected, layout = 'stack' }: any) => {
        if (!options || options.length === 0) return null;

        const isGrid = layout === 'grid';
        return (
            <div className="mb-6 md:mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
                <div className={`grid gap-3 ${isGrid ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                    {options.map((opt: any) => {
                        const isSelected = selected?.value === opt.value;
                        return (
                            <button
                                key={`${title}-${opt.value}`}
                                onClick={() => setSelected(opt)}
                                className={`relative p-3 md:p-4 rounded-xl border text-left transition-all duration-200 group active:scale-[0.98] ${isSelected
                                    ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    } ${isGrid ? 'flex flex-col justify-center items-center text-center h-full gap-1' : 'flex justify-between items-center'}`}
                            >
                                <span className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {opt.label}
                                </span>
                                <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                    {opt.price === 0 ? 'Included' : `+ ₹${opt.price.toLocaleString('en-IN')}`}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        );
    };

    const scroll = (direction: 'left' | 'right') => {
        if (relatedScrollRef.current) {
            const scrollAmount = 300;
            direction === 'left'
                ? relatedScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
                : relatedScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <>
            <Script
                id="product-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        name: product.title,
                        image: [product.image, ...(product.images || [])],
                        description: product.description,
                        sku: product.productId,
                        brand: {
                            "@type": "Brand",
                            name: product.brand || "Lapshark",
                        },
                        offers: {
                            "@type": "Offer",
                            url: `https://lapshark.com/products/${product.id}`,
                            priceCurrency: "INR",
                            price: product.finalPrice,
                            availability:
                                product.stock > 0
                                    ? "https://schema.org/InStock"
                                    : "https://schema.org/OutOfStock",
                            itemCondition: "https://schema.org/RefurbishedCondition",
                        },
                    }),
                }}
            />
            {showLogin && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4">
                        <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => setShowLogin(false)} />
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 bg-white">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 mb-12 md:mb-24">
                    {/* Left column - Product images */}
                    <div className="lg:col-span-7">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-gray-50 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 flex items-center justify-center relative min-h-[300px] md:min-h-[500px] overflow-hidden">
                                <img
                                    src={API_URL2 + (activeImage || product.image)}
                                    alt={product.title}
                                    className="w-full max-h-[300px] md:max-h-[500px] object-contain mix-blend-multiply transition-all duration-500 ease-in-out"
                                />
                                {product.condition && (
                                    <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-white/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/50 shadow-sm z-10">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> {product.condition}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {galleryImages.length > 1 && (
                                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
                                    {galleryImages.map((img, idx) => (
                                        <button
                                            key={`gallery-${idx}-${img}`}
                                            onClick={() => setActiveImage(img)}
                                            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-50 border-2 flex-shrink-0 overflow-hidden transition-all ${activeImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-200'
                                                }`}
                                        >
                                            <img src={API_URL2 + img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6">
                                <div className="bg-emerald-50/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-emerald-100 flex items-start gap-4">
                                    <div className="p-2.5 md:p-3 text-emerald-600 flex-shrink-0"><ClipboardCheck className="w-6 h-6 md:w-7 md:h-7" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm md:text-base">40+ Point Check</h4>
                                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">Certified by expert technicians.</p>
                                    </div>
                                </div>
                                <div className="bg-blue-50/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-blue-100 flex items-start gap-4">
                                    <div className="p-2.5 md:p-3 text-blue-600 flex-shrink-0"><Battery className="w-6 h-6 md:w-7 md:h-7" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm md:text-base">80%+ Battery</h4>
                                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">Guaranteed health & performance.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none px-1 md:px-0 mt-6">
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Product Overview</h3>
                                <p className="text-gray-600 leading-relaxed text-base md:text-lg">{product.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right column - Product details */}
                    <div className="lg:col-span-5">
                        <div className="flex flex-col h-full relative">
                            <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-100">
                                <span className="text-blue-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-2 md:mb-3 block">{product.category}</span>
                                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3 md:mb-4 tracking-tight leading-tight">{product.title}</h1>

                                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={`rating-star-${i}`} className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs md:text-sm font-bold text-gray-500 border-b border-gray-300 pb-0.5 cursor-pointer">{product.reviews} reviews</span>
                                </div>

                                <div className="flex items-baseline gap-3 md:gap-4">
                                    <span className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">₹{finalPrice.toLocaleString('en-IN')}</span>
                                    {product.discountPercent > 0 && (
                                        <span className="text-lg md:text-xl text-gray-400 line-through font-medium">₹{originalPrice.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
                                {Object.entries(product.specs || {}).slice(0, 4).map(([key, value]) => (
                                    <div key={`spec-${key}`} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">{key}</span>
                                        <span className="text-base font-semibold text-gray-900 truncate block">{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 space-y-2">
                                {product?.configOptions?.ram && (
                                    <ConfigSection
                                        title="Memory"
                                        options={product.configOptions.ram}
                                        selected={selectedRam}
                                        setSelected={setSelectedRam}
                                        layout="grid"
                                    />
                                )}
                                {product?.configOptions?.storage && (
                                    <ConfigSection
                                        title="Storage"
                                        options={product.configOptions.storage}
                                        selected={selectedStorage}
                                        setSelected={setSelectedStorage}
                                        layout="grid"
                                    />
                                )}
                                {product?.configOptions?.warranty && (
                                    <ConfigSection
                                        title="Protection Plan"
                                        options={product.configOptions.warranty}
                                        selected={selectedWarranty}
                                        setSelected={setSelectedWarranty}
                                    />
                                )}
                            </div>

                            <div className="bg-white mt-2 backdrop-blur-md pt-4 md:pt-6 w-full pb-6 sticky bottom-0 z-50 ">
                                <button
                                    onClick={handleBuyNow}
                                    disabled={product.stock <= 0}
                                    className={`w-full py-4 md:py-5 rounded-xl mb-2 md:rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-slate-200 hover: active:scale-[0.98] ${product.stock > 0
                                        ? 'border-2 border-gray-900 text-black'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="font-bold text-base md:text-lg">
                                        {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0}
                                    className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-slate-200 hover:shadow-slate-300 active:scale-[0.98] ${product.stock > 0
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="font-bold text-base md:text-lg">
                                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </span>
                                </button>

                                <div className="flex justify-center gap-4 md:gap-6 mt-4 md:mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span className="flex items-center"><Truck className="w-3 h-3 mr-1.5" /> Free Shipping</span>
                                    <span className="flex items-center"><Shield className="w-3 h-3 mr-1.5" /> Returns Accepted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accessories */}
                {featuredAccessory && (
                    <div className="mb-12 md:mb-24">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-8">Complete Your Setup</h2>
                        <div className="bg-gray-50 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                                <div className="lg:col-span-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl">RECOMMENDED</div>
                                    <div className="w-40 h-40 md:w-48 md:h-48 my-4 md:my-6">
                                        <img src={featuredAccessory?.image} alt={featuredAccessory?.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl mb-1 md:mb-2 line-clamp-1">{featuredAccessory?.title}</h3>
                                    <p className="text-blue-600 font-bold text-xl md:text-2xl mb-4 md:mb-6">₹{featuredAccessory?.finalPrice.toLocaleString('en-IN')}</p>
                                    <button
                                        onClick={() => {
                                            if (featuredAccessory) {
                                                const accessoryWithId = { ...featuredAccessory, id: featuredAccessory.productId };
                                                addToCart(accessoryWithId);
                                            }
                                        }}
                                        className="w-full bg-slate-100 hover:bg-black hover:text-white text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm md:text-base"
                                    >
                                        Add to Order
                                    </button>
                                </div>

                                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {moreAccessories.map((acc, index) => (
                                        <div key={acc?.id || `accessory-${index}`} className="bg-white rounded-2xl p-4 flex gap-4 items-center border border-transparent hover:border-gray-200 transition-all">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl p-2 flex-shrink-0">
                                                <img src={acc.image} className="w-full h-full object-contain mix-blend-multiply" alt={acc.title} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate text-sm md:text-base">{acc.title}</h4>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="font-bold text-gray-500 text-sm md:text-base">₹{acc.finalPrice.toLocaleString('en-IN')}</span>
                                                    <button
                                                        onClick={() => {
                                                            const accessoryWithId = { ...acc, id: acc.productId };
                                                            addToCart(accessoryWithId);
                                                        }}
                                                        className="p-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
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
                <div className="mb-12 md:mb-24 bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 p-6 md:p-12 shadow-sm">
                    <div className="flex items-center justify-between mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ratings & Reviews</h2>
                        <button className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                            Write a Review
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="text-center">
                                    <span className="block text-5xl font-extrabold text-slate-900 tracking-tight">{averageRating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500 font-medium mt-1 block">out of 5</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex text-amber-400 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={`avg-star-${i}`} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">{productReviews.length} Verified Reviews</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {ratingDistribution.map((item) => (
                                    <div key={`rating-dist-${item.star}`} className="flex items-center gap-3 text-xs md:text-sm">
                                        <span className="font-bold text-slate-700 w-3">{item.star}</span>
                                        <Star className="w-3 h-3 text-gray-300" />
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 rounded-full"
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-gray-400 w-8 text-right">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-6">
                            {productReviews.length > 0 ? (
                                productReviews.map((review) => (
                                    <div key={`review-${review.id}`} className="pb-6 border-b border-gray-100 last:border-0">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{review.userName}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-amber-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={`review-${review.id}-star-${i}`} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                        {review.verified && (
                                                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                                                                <Check className="w-2.5 h-2.5" /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">{review.date}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                        <div className="mt-3 flex items-center gap-4">
                                            <button className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                                <ThumbsUp className="w-3.5 h-3.5" /> Helpful
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                    <p className="text-gray-500 font-medium mb-4">No reviews yet. Be the first to share your experience!</p>
                                    <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                                        Write a Review
                                    </button>
                                </div>
                            )}

                            {productReviews.length > 3 && (
                                <button className="w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                    View All Reviews
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-gray-100 pt-12 md:pt-16">
                        <div className="flex justify-between items-end mb-6 md:mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Similar Models</h2>
                            <div className="flex gap-2">
                                <button onClick={() => scroll('left')} className="p-2 md:p-3 rounded-full border border-gray-200 hover:bg-gray-100"><ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /></button>
                                <button onClick={() => scroll('right')} className="p-2 md:p-3 rounded-full border border-gray-200 hover:bg-gray-100"><ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></button>
                            </div>
                        </div>

                        <div ref={relatedScrollRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-8 scrollbar-hide snap-x -mx-4 px-4 md:mx-0 md:px-0">
                            {relatedProducts.map((p) => (
                                <div key={`related-${p.id}`} className="min-w-[260px] md:min-w-[300px] snap-center">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// Skeleton component for loading state
function ProductDetailsSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 bg-white animate-pulse">
            <div className="h-10 w-24 bg-gray-200 rounded mb-6"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 mb-12 md:mb-24">
                {/* Left column skeleton */}
                <div className="lg:col-span-7">
                    <div className="bg-gray-200 rounded-[2.5rem] h-[500px] mb-4"></div>
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-20 h-20 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>

                {/* Right column skeleton */}
                <div className="lg:col-span-5">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                    <div className="h-10 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                    <div className="h-12 w-48 bg-gray-200 rounded mb-8"></div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                        <div className="h-32 bg-gray-200 rounded-xl"></div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="h-14 bg-gray-200 rounded-xl"></div>
                        <div className="h-14 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>

            {/* Related products skeleton */}
            <div className="border-t border-gray-100 pt-12">
                <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
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