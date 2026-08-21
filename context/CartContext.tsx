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

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "lapshark_cart";
migrateKey("techmart_cart", CART_KEY);

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
      syncGuestCart();
      fetchCart();
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
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);

      if (existing) {
        return prev.map(i =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      const newItem: CartItem = {
        ...product,
        productId, // 🔑 normalized ID
        quantity: 1,
        selectedConfig: product.config,
      };

      return [...prev, newItem];
    });
  };


  const removeFromCart = async (productId: string) => {
    if (!isLoggedIn) {
      setCart(prev => prev.filter(i => i.productId !== productId));
      return;
    }

    try {
      await api.delete(`/cart/remove/${productId}`, authHeader());
      fetchCart();
    } catch (err) {
      console.error("❌ Remove from cart failed", err);
    }
  };

  const updateQuantity = async (productId: string, qty: number) => {
    if (qty < 1 || qty > 5) return;

    if (!isLoggedIn) {
      setCart(prev =>
        prev.map(i =>
          i.productId === productId ? { ...i, quantity: qty } : i
        )
      );
      return;
    }

    try {
      await api.put(
        `/cart/update/${productId}`,
        { quantity: qty },
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
