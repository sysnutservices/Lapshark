import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  buyNow: (product: Product) => void;
  buyNowCart: CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('techmart_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [buyNowCart, setBuyNow] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('techmart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any) => {
    setCart(prevCart => {
      // Determine the product ID to use for matching
      // Priority: composite ID (from ProductDetails) > productId > id
      const productIdToMatch = product.id || product.productId || product._id;

      console.log('🛒 Adding to cart:', {
        productIdToMatch,
        productTitle: product.title,
        hasConfig: !!product.config,
        config: product.config
      });

      // Find existing item with the EXACT same ID
      const existing = prevCart.find(item => item.id === productIdToMatch);

      if (existing) {
        console.log('✅ Found existing item, incrementing quantity');
        // Exact match found - increment quantity
        return prevCart.map(item =>
          item.id === productIdToMatch
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      console.log('➕ Adding new cart item');
      // No exact match - add as new item
      // Ensure the item has a proper ID
      const newItem = {
        ...product,
        id: productIdToMatch, // Use the determined ID
        quantity: 1
      };

      return [...prevCart, newItem];
    });
  };

  const buyNow = (product: Product) => {
    setBuyNow(prev => {
      const existing = prev.find(item => item.id === product.productId);

      if (existing) {
        return prev.map(item =>
          item.id === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          let newQty = item.quantity + delta;

          if (newQty > 5) {
            alert("Maximum 5 items allowed.");
            newQty = 5;
          }
          if (newQty < 1) newQty = 1;

          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      buyNow,
      buyNowCart,
      totalItems,
      totalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};