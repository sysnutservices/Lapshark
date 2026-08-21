import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, ShoppingBag, Heart, Eye, X, Truck, Shield, ShieldCheck, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import { useUserFeatures } from '../context/UserFeatureContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const CATEGORY_TAG: Record<string, string> = {
  [Category.BUSINESS]: 'Business-ready',
  [Category.GAMING]: 'Gaming-ready',
  [Category.ULTRABOOKS]: 'Ultra-portable',
  [Category.WORKSTATIONS]: 'Pro workstation',
  [Category.STUDENT]: 'Student-friendly',
  [Category.ACCESSORIES]: 'Accessory',
};

// ✅ HELPER FUNCTION: Normalize config values for consistent cart IDs
const normalizeConfigValue = (value: string | undefined | null): string => {
  if (!value) return 'none';
  return value.replace(/\s+/g, '').toLowerCase();
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, addToCompare, removeFromCompare, isInCompare } = useUserFeatures();
  const router = useRouter();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const id = product.productId;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ CHECK IF PRODUCT HAS CONFIG OPTIONS
    const hasConfigOptions = product.configOptions && (
      product.configOptions.ram?.length > 0 ||
      product.configOptions.storage?.length > 0
    );

    if (hasConfigOptions) {
      // ✅ PRODUCT HAS CONFIGS - Get default values (first option)
      const defaultRam = product.configOptions?.ram?.[0];
      const defaultStorage = product.configOptions?.storage?.[0];
      const defaultWarranty = product.configOptions?.warranty?.[0];

      // Calculate prices with default configs
      const finalPrice = (product.finalPrice || 0) + (defaultRam?.price || 0) + (defaultStorage?.price || 0) + (defaultWarranty?.price || 0);
      const originalPrice = (product.price || 0) + (defaultRam?.price || 0) + (defaultStorage?.price || 0) + (defaultWarranty?.price || 0);

      // ✅ CREATE NORMALIZED COMPOSITE ID (same logic as ProductDetails)
      const compositeId = `${product.productId}-${normalizeConfigValue(defaultRam?.value)}-${normalizeConfigValue(defaultStorage?.value)}-${normalizeConfigValue(defaultWarranty?.value)}`;

      console.log('📦 ProductCard adding CONFIGURED product:', {
        productId: product.productId,
        compositeId,
        defaultConfig: {
          ram: defaultRam?.value,
          storage: defaultStorage?.value,
          warranty: defaultWarranty?.value
        }
      });

      const cartProduct = {
        ...product,
        originalId: product.productId,
        id: compositeId, // ✅ Use composite ID for configured products

        title: defaultRam && defaultStorage
          ? `${product.title} (${defaultRam.value} / ${defaultStorage.value})`
          : product.title,

        finalPrice,
        price: originalPrice,

        // Store selected config
        configOptions: {
          ram: defaultRam,
          storage: defaultStorage,
          warranty: defaultWarranty
        },

        // Clean config for backend
        config: {
          ram: defaultRam?.value,
          storage: defaultStorage?.value,
          warranty: defaultWarranty?.value
        },

        specs: {
          ...product.specs,
          ram: defaultRam?.value || product.specs.ram,
          storage: defaultStorage?.value || product.specs.storage
        }
      };

      addToCart(cartProduct);
    } else {
      // ✅ SIMPLE PRODUCT WITHOUT CONFIGS
      console.log('📦 ProductCard adding SIMPLE product:', {
        productId: product.productId,
        title: product.title
      });

      const cartProduct = {
        ...product,
        id: product.productId // ✅ Simple products use productId directly
      };

      addToCart(cartProduct);
    }

    router.push('/cart');
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      addToWishlist(product);
    }
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare(id)) {
      removeFromCompare(id);
    } else {
      addToCompare(product);
    }
  };

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const getConditionStyles = (condition?: string) => {
    switch (condition) {
      case 'Like New': return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/20';
      case 'Excellent': return 'text-teal-700 bg-teal-50 ring-1 ring-teal-600/20';
      case 'Good': return 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/20';
      default: return 'text-slate-700 bg-slate-50 ring-1 ring-slate-600/20';
    }
  };

  const categoryTag = CATEGORY_TAG[product.category] ?? product.category;
  const specPills = [product.specs?.processor, product.specs?.ram, product.specs?.storage, product.specs?.os].filter(Boolean);
  const gallery = product.images && product.images.length > 1 ? product.images : null;

  return (
    <>
      <div className="group relative bg-white rounded-2xl md:rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-slate-100 hover:border-slate-200 transition-all duration-500 ease-out flex flex-col h-full overflow-hidden">

        {/* Compare Pill */}
        <button
          onClick={toggleCompare}
          aria-label={isInCompare(product.productId) ? "Remove from compare" : "Add to compare"}
          className={cn(
            // Icon-only on mobile: the label made this pill cover too much of a
            // small card. Full label returns at md, where there's room.
            "absolute top-2 left-2 md:top-4 md:left-4 z-20 flex items-center gap-1.5 rounded-full p-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-bold transition-colors",
            isInCompare(product.productId) ? "bg-teal-800 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
          )}
        >
          <ArrowLeftRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          <span className="hidden md:inline">Compare</span>
        </button>

        {/* Wishlist Seal + Quick View */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex flex-col items-center gap-2">
          <button
            onClick={toggleWishlist}
            className={cn(
              "flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all hover:scale-110",
              isInWishlist(product.productId) ? "bg-red-500 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
            )}
            title="Wishlist"
            aria-label={isInWishlist(product.productId) ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isInWishlist(product.productId) ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={openQuickView}
            className="hidden md:flex w-9 h-9 items-center justify-center bg-white text-slate-500 hover:text-teal-600 rounded-full border border-slate-100 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            title="Quick View"
            aria-label="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Image Container */}
        {/* pt clears the compare/wishlist buttons floating above so the photo
            never sits under them (object-contain centres inside the padding box) */}
        <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50/50 p-4 pt-12 md:p-8 md:pt-16 flex items-center justify-center">
          {/* next/image, not a raw <img>: these were served as full-size
              unoptimized JPEGs straight from ImageKit and eagerly fetched, so a
              dozen product cards competed with the hero for bandwidth and
              pushed LCP out. Now AVIF/WebP, responsive, and lazy below the fold. */}
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-contain mix-blend-multiply transform md:group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        </Link>

        {/* Gallery Dots */}
        {gallery && (
          <div className="flex items-center justify-center gap-1.5 pb-3 md:pb-4 bg-slate-50/50">
            {gallery.map((_, i) => (
              <span key={i} className={i === 0 ? "h-1.5 w-4 rounded-full bg-slate-900" : "h-1.5 w-1.5 rounded-full bg-slate-300"} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-3 md:p-5 flex flex-col flex-grow relative">
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.brand}</span>

          <Link href={`/products/${product.slug}`} className="block mb-1.5 md:mb-2 group-hover:text-teal-600 transition-colors">
            <h3 className="text-sm md:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
              {product.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mb-2 md:mb-3">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 md:w-3.5 md:h-3.5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 font-medium ml-1">({product.reviews})</span>
          </div>

          {specPills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 md:mb-3">
              {specPills.map((spec, i) => (
                <Badge key={i} variant="secondary" className="rounded-full px-2 py-1 text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-100">
                  {spec}
                </Badge>
              ))}
            </div>
          )}

          <div className="mb-2 md:mb-4 flex flex-wrap gap-1.5">
            {product.condition ? (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${getConditionStyles(product.condition)}`}>
                {product.condition}
              </span>
            ) : product.isNew ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-teal-700 bg-teal-50 ring-1 ring-teal-600/20">
                Brand New
              </span>
            ) : null}
            {categoryTag && (
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] md:text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">
                {categoryTag}
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-baseline flex-wrap gap-x-2 gap-y-1">
            <span className="text-base md:text-xl font-bold text-slate-900">₹{product.finalPrice.toLocaleString('en-IN')}</span>
            {product.discountPercent > 0 && (
              <span className="text-[10px] md:text-xs text-slate-400 line-through font-medium">₹{product.price.toLocaleString('en-IN')}</span>
            )}
            {product.discountPercent > 0 && (
              <Badge className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] md:text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                {product.discountPercent}% off
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500 font-medium mt-2 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            1-Year Warranty
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full h-auto rounded-lg md:rounded-xl bg-teal-600 py-2.5 md:py-3 text-xs md:text-sm font-bold text-white hover:bg-teal-700"
          >
            <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" /> Add to Cart
          </Button>
        </div>
      </div>

      {/* Modern Quick View Modal */}
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsQuickViewOpen(false)} />

          <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-[slide-up_0.3s_ease-out] overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
            <button
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white hover:bg-slate-100 rounded-full z-10 transition-colors shadow-sm border border-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-slate-50 p-8 md:p-12 flex items-center justify-center">
              <img src={product.image} alt={product.title} className="w-full h-auto object-contain max-h-[200px] md:max-h-[300px] mix-blend-multiply" />
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wide">{product.category}</span>
                {product.condition && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wide">{product.condition}</span>
                )}
              </div>

              <h2 className="text-xl md:text-3xl font-bold text-slate-900 mb-2 md:mb-3 leading-tight">{product.title}</h2>

              <div className="flex items-center gap-4 mb-4 md:mb-6">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-500">{product.reviews} verified reviews</span>
              </div>

              <p className="text-slate-600 text-sm mb-6 md:mb-8 leading-relaxed line-clamp-3 md:line-clamp-none">{product.description}</p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
                {Object.entries(product.specs).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">{key}</span>
                    <span className="text-sm font-semibold text-slate-900 truncate block">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t border-slate-100 pt-6">
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">₹{product.finalPrice.toLocaleString('en-IN')}</span>
                  {product.discountPercent > 0 && (
                    <span className="text-base md:text-lg text-slate-400 line-through font-medium mb-1.5">₹{product.price.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    className="col-span-1 bg-teal-600 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all hover:bg-teal-700 flex items-center justify-center gap-2 active:scale-95 text-sm md:text-base"
                  >
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" /> Add to Cart
                  </button>
                  <Link
                    href={`/products/${product.slug}`}
                    className="col-span-1 border border-slate-200 text-slate-900 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex justify-center gap-6 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center"><Truck className="w-3 h-3 mr-1.5" /> Free Ship</span>
                  <span className="flex items-center"><Shield className="w-3 h-3 mr-1.5" /> Warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};