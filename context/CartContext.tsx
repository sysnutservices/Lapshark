"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Product, CartItem } from "../types";
import { api } from "@/api/api";
import { migrateKey } from "@/lib/localStorage";
import { trackEvent } from "@/lib/analytics";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  // Both take a line key — cartItemKey(item) — not a bare productId.
  removeFromCart: (lineKey: string) => Promise<void>;
  updateQuantity: (lineKey: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "lapshark_cart";
migrateKey("techmart_cart", CART_KEY);

// One cart line per product+config — keep in sync with cartLineId in
// lapshark_backend's cartController.ts. Lines used to be keyed by productId
// alone, so picking 16GB/512GB on a laptop already in the cart as 8GB/256GB
// just bumped the old line's quantity and Buy Now checked out the old config.
// Unconfigured (and legacy, pre-lineId) items keep the bare productId.
type CartConfig = { ram?: string; storage?: string; warranty?: string };
export const cartLineId = (productId: string, config?: CartConfig | null) =>
  config && (config.ram || config.storage || config.warranty)
    ? `${productId}-${config.ram || "default"}-${config.storage || "default"}-${config.warranty || "none"}`
    : productId;

// The key removeFromCart/updateQuantity take.
export const cartItemKey = (item: { lineId?: string; productId?: string }) =>
  item.lineId || item.productId || "";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* =========================
     AUTH DETECTION (SSR SAFE)
  ========================= */

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    if (isLoggedIn) {
      // Sequenced, not fire-and-forget in parallel: fetchCart() used to run
      // concurrently with the merge POST, so it usually won the race and
      // rendered the pre-merge cart — the guest's items were merged
      // server-side but nothing on screen showed it until a manual refresh.
      syncGuestCart().then(fetchCart);
    } else {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {
          localStorage.removeItem(CART_KEY);
        }
      }
    }
  }, [isLoggedIn]);

  /* =========================
     PERSIST GUEST CART
  ========================= */

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoggedIn]);

  /* =========================
     API HELPERS
  ========================= */

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart", authHeader());
      setCart(res.data.items || []);
    } catch (err) {
      console.error("❌ Fetch cart failed", err);
    }
  };

  const syncGuestCart = async () => {
    const guestCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!guestCart.length) return;

    try {
      await api.post("/cart/merge", { items: guestCart }, authHeader());
      localStorage.removeItem(CART_KEY);
    } catch (err) {
      console.error("❌ Cart merge failed", err);
    }
  };

  /* =========================
     CART ACTIONS
  ========================= */

  const addToCart = async (product: Product) => {
    const productId = product._id || product.productId || product.id;
    if (!productId) return;

    // Deliberately a different priority order than the cart-identity
    // `productId` above (which prefers _id, for its own cart-dedup
    // reasons) — every other tracking call site (view_item,
    // wishlist_add, compare_started) resolves productId as
    // productId-then-id-then-_id. ProductCard's quick-add button passes
    // a product object without a real _id for config-default variants,
    // so using the cart-identity value here split the same physical
    // product into two rows on the admin Product Views page (one from
    // view_item, one from add_to_cart, never merging). Matching the same
    // priority order everywhere is what actually fixes that.
    const trackingProductId = product.productId || product.id || product._id || productId;

    trackEvent("add_to_cart", {
      productId: trackingProductId,
      title: product.title,
      quantity: 1,
      finalPrice: product.finalPrice,
      price: product.price,
    });

    // ✅ LOGGED-IN USER → BACKEND
    if (isLoggedIn) {
      try {
        await api.post(
          "/cart/add",
          {
            productId,
            quantity: 1,
            config: product.config || null,
          },
          authHeader()
        );

        await fetchCart(); // refresh from DB
      } catch (err) {
        console.error("❌ Add to cart failed", err);
      }
      return;
    }

    // ✅ GUEST USER → LOCAL STORAGE
    const lineId = cartLineId(productId, product.config);
    setCart(prev => {
      const existing = prev.find(i => cartItemKey(i) === lineId);

      if (existing) {
        return prev.map(i =>
          cartItemKey(i) === lineId
            ? { ...i, quantity: Math.min(5, i.quantity + 1) }
            : i
        );
      }

      const newItem: CartItem = {
        ...product,
        productId, // 🔑 normalized ID
        lineId,
        quantity: 1,
        selectedConfig: product.config,
      };

      return [...prev, newItem];
    });
  };


  const removeFromCart = async (lineKey: string) => {
    const removed = cart.find(i => cartItemKey(i) === lineKey);
    if (removed) {
      trackEvent("remove_from_cart", {
        productId: removed.productId || lineKey,
        title: removed.title,
        quantity: removed.quantity,
        finalPrice: removed.finalPrice,
      });
    }

    if (!isLoggedIn) {
      setCart(prev => prev.filter(i => cartItemKey(i) !== lineKey));
      return;
    }

    try {
      await api.delete(`/cart/remove/${encodeURIComponent(lineKey)}`, authHeader());
      fetchCart();
    } catch (err) {
      console.error("❌ Remove from cart failed", err);
    }
  };

  const updateQuantity = async (lineKey: string, qty: number) => {
    if (qty < 1 || qty > 5) return;

    if (!isLoggedIn) {
      setCart(prev =>
        prev.map(i =>
          cartItemKey(i) === lineKey ? { ...i, quantity: qty } : i
        )
      );
      return;
    }

    try {
      // The backend route is PUT /cart/update with productId in the body
      // (updateCartItem reads req.body.productId, not a URL param) — the
      // extra /${productId} segment here never matched anything, so
      // req.body.productId was always undefined server-side. That made
      // cart.items.find(...) fail silently and the handler no-op with a
      // 200, which fetchCart() then faithfully reflected back as "nothing
      // changed" — every quantity +/- for a logged-in customer was a
      // silent no-op.
      await api.put(
        `/cart/update`,
        { productId: lineKey, quantity: qty },
        authHeader()
      );
      fetchCart();
    } catch (err) {
      console.error("❌ Update quantity failed", err);
    }
  };

  const clearCart = async () => {
    if (!isLoggedIn) {
      setCart([]);
      localStorage.removeItem(CART_KEY);
      return;
    }

    try {
      await api.delete("/cart/clear", authHeader());
      fetchCart();
    } catch (err) {
      console.error("❌ Clear cart failed", err);
    }
  };

  /* =========================
     TOTALS
  ========================= */

  const totalItems = cart.reduce((a, i) => a + i.quantity, 0);
  const totalPrice = cart.reduce(
    (a, i) => a + i.quantity * i.finalPrice,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
