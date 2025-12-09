import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingBag, Heart, Eye, X, Check, Truck, Shield, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useUserFeatures } from '../context/UserFeatureContext';
import { API_URL2 } from '@/api/api';

interface ProductCardProps {
  product: Product;
}

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

  const toggleCompare = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      case 'Excellent': return 'text-blue-700 bg-blue-50 ring-1 ring-blue-600/20';
      case 'Good': return 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/20';
      default: return 'text-gray-700 bg-gray-50 ring-1 ring-gray-600/20';
    }
  };

  return (
    <>
      <div className="group relative bg-white rounded-2xl md:rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100 hover:border-gray-200 transition-all duration-500 ease-out flex flex-col h-full overflow-hidden">

        {/* Floating Actions (Desktop Hover / Mobile Visible) */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex flex-col gap-2 md:translate-x-12 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 transition-all duration-300 delay-75">
          <button
            onClick={toggleWishlist}
            className={`p-2 md:p-2.5 rounded-full shadow-lg border border-gray-100 transition-all hover:scale-110 ${isInWishlist(product.productId) ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white text-gray-400 hover:text-red-500'}`}
            title="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isInWishlist(product.productId) ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={openQuickView}
            className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-blue-600 rounded-full shadow-lg border border-gray-100 transition-all hover:scale-110"
            title="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Compare Checkbox */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
          <label className="flex items-center space-x-1.5 md:space-x-2 bg-white/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-gray-200/50 cursor-pointer shadow-sm hover:shadow-md transition-all">
            <input
              type="checkbox"
              checked={isInCompare(product.productId)}
              onChange={toggleCompare}
              className="rounded-full border-gray-300 text-black focus:ring-blue-500 w-3 h-3 md:w-3.5 md:h-3.5 accent-gray-900 cursor-pointer"
            />
            <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wide">Compare</span>
          </label>
        </div>

        {/* Image Container */}
        <Link href={`/products/${product.productId}`} className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50/50 p-4 md:p-8 flex items-center justify-center">
          <img
            src={API_URL2 + product.image || product.image}
            alt={product.title}
            className="w-full h-full object-contain mix-blend-multiply transform md:group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />

          {/* Discount Badge */}
          {product.discountPercent > 0 && (
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md">
              -{product.discountPercent}% OFF
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-3 md:p-5 flex flex-col flex-grow relative">
          <div className="mb-1.5 md:mb-2 flex items-center justify-between">
            <span className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate max-w-[60%]">{product.category}</span>
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-400 fill-current" />
              <span className="text-[10px] md:text-xs font-bold text-gray-700">{product.rating}</span>
            </div>
          </div>

          <Link href={`/products/${product.productId}`} className="block mb-1 md:mb-2 group-hover:text-blue-600 transition-colors">
            <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5em] md:min-h-[3.5em]">
              {product.title}
            </h3>
          </Link>

          {/* Condition Pill */}
          <div className="mb-2 md:mb-4">
            {product.condition ? (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wide ${getConditionStyles(product.condition)}`}>
                {product.condition}
              </span>
            ) : product.isNew ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-blue-50 ring-1 ring-blue-600/20">
                Brand New
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-3 md:pt-4 border-t border-dashed border-gray-100 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs text-gray-400 line-through font-medium">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="text-base md:text-xl font-bold text-gray-900 -mt-0.5 md:-mt-1">₹{product.finalPrice.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-gray-900 text-white p-2 md:p-3 rounded-lg md:rounded-xl  transition-all duration-300 shadow-lg shadow-gray-200 group-hover:scale-105 active:scale-95 flex-shrink-0"
              title="Add to Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Quick View Modal */}
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsQuickViewOpen(false)} />

          <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-[slide-up_0.3s_ease-out] overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
            <button
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full z-10 transition-colors shadow-sm border border-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-gray-50 p-8 md:p-12 flex items-center justify-center">
              <img src={API_URL2 + product.image || product.image} alt={product.title} className="w-full h-auto object-contain max-h-[200px] md:max-h-[300px] mix-blend-multiply" />
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">{product.category}</span>
                {product.condition && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wide">{product.condition}</span>
                )}
              </div>

              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3 leading-tight">{product.title}</h2>

              <div className="flex items-center gap-4 mb-4 md:mb-6">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-500">{product.reviews} verified reviews</span>
              </div>

              <p className="text-gray-600 text-sm mb-6 md:mb-8 leading-relaxed line-clamp-3 md:line-clamp-none">{product.description}</p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
                {Object.entries(product.specs).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">{key}</span>
                    <span className="text-sm font-semibold text-gray-900 truncate block">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t border-gray-100 pt-6">
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">₹{product.finalPrice.toLocaleString('en-IN')}</span>
                  {product.discountPercent > 0 && (
                    <span className="text-base md:text-lg text-gray-400 line-through font-medium mb-1.5">₹{product.price.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    className="col-span-1 bg-gray-900 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 text-sm md:text-base"
                  >
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" /> Add to Cart
                  </button>
                  <Link
                    href={`/products/${product.productId}`}
                    className="col-span-1 border border-gray-200 text-gray-900 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex justify-center gap-6 mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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