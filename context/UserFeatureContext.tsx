"use client";

import React, { useContext, useState, useEffect, ReactNode, createContext } from 'react';
import { Address, Product } from '../types';
import { api, API_URL } from '@/api/api';
import { migrateKey } from '@/lib/localStorage';

const COMPARE_KEY = 'lapshark_compare';
const RECENTLY_VIEWED_KEY = 'lapshark_recently_viewed';
migrateKey('techmart_compare', COMPARE_KEY);
migrateKey('techmart_recently_viewed', RECENTLY_VIEWED_KEY);

interface UserFeatureContextType {
  wishlist: Product[];
  compareList: Product[];
  recentlyViewed: Product[];
  addresses: Address[];
  selectedAddressId: string | null;

  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Address) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => Promise<void>;
  getSelectedAddress: () => Address | undefined;

  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;

  addToRecentlyViewed: (product: Product) => void;
}

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
const UserFeatureContext = createContext<UserFeatureContextType | undefined>(undefined);

export const UserFeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  // ------------------------------
  // WISHLIST
  // ------------------------------
  const isLoggedIn = () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  };


  const [wishlist, setWishlist] = useState<Product[]>([]);
  const fetchWishlist = async () => {
    try {
      const res = await api.get("/wishlist", authHeader());

      if (res.data?.items) {
        const normalized = res.data.items.map((item: any) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          finalPrice: item.finalPrice,
          price: item.price,
          specs: item.specs
        }));

        setWishlist(normalized);
      }
    } catch (err) {
      console.error("Fetch wishlist failed", err);
    }
  };


  useEffect(() => {
    if (isLoggedIn()) {
      fetchWishlist();
    }
  }, []);

  const addToWishlist = async (product: Product) => {
    const productId = product._id || product.productId || product.id;
    if (!productId) return;

    if (isLoggedIn()) {
      try {
        await api.post("/wishlist/add", { productId }, authHeader());
        fetchWishlist();
      } catch (err) {
        console.error("Add to wishlist failed", err);
      }
      return;
    }

    // Guest user
    setWishlist(prev =>
      prev.some(p => p.productId === productId) ? prev : [...prev, product]
    );
  };


  const removeFromWishlist = async (productId: string) => {
    if (isLoggedIn()) {
      try {
        await api.delete(`/wishlist/${productId}`, authHeader());
        fetchWishlist();
      } catch (err) {
        console.error("Remove wishlist failed", err);
      }
      return;
    }

    // Guest user
    setWishlist(prev => prev.filter(p => p.productId !== productId));
  };


  const isInWishlist = (productId: string) =>
    wishlist.some(p => p.productId === productId);


  const [compareList, setCompareList] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(COMPARE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (product: Product) => {
    setCompareList(prev => {
      if (prev.some(p => p.productId === product.productId)) return prev;
      if (prev.length >= 3) {
        alert("You can compare only up to 3 products.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.productId !== productId));
  };

  const isInCompare = (productId: string) =>
    compareList.some(p => p.productId === productId);

  const clearCompare = () => setCompareList([]);

  // ------------------------------
  // RECENTLY VIEWED
  // ------------------------------
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);
  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      // 🚫 Prevent updating if product is already first in list
      if (prev[0]?.productId === product.productId) return prev;

      const filtered = prev.filter(p => p.productId !== product.productId);
      return [product, ...filtered].slice(0, 4);
    });
  };


  // ------------------------------
  // ADDRESS BOOK (Backend Synced)
  // ------------------------------
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);


  const fetchAddresses = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/users/address`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAddresses(data.addresses || []);
        setSelectedAddressId(data.defaultAddressId || null);
      }
    } catch (error) {
      console.error("Error loading address list:", error);
    }
  };

  // ADD ADDRESS → POST /users/address
  const addAddress = async (address: Address) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(address)
      });

      const data = await res.json();

      if (data.success) {
        const user = data.user;
        setAddresses(user.addressBook || []);
        setSelectedAddressId(user.defaultAddressId || null);
      }
    } catch (error) {
      console.error("Add address failed:", error);
    }
  };

  // DELETE ADDRESS → DELETE /users/address/:id
  const removeAddress = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/address/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        const user = data.user;
        setAddresses(user.addressBook || []);
        setSelectedAddressId(user.defaultAddressId || null);
      }
    } catch (error) {
      console.error("Delete address failed:", error);
    }
  };

  // SET DEFAULT ADDRESS → POST /users/address/set-default
  const selectAddress = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/address/${id}/set-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await res.json();

      if (data.success) {
        const user = data.user;
        setSelectedAddressId(user.defaultAddressId);

      }
    } catch (error) {
      console.error("Select address failed:", error);
    }
  };

  const getSelectedAddress = () => {
    return addresses.find(a => a.id === selectedAddressId);
  };

  // ------------------------------
  // PROVIDER
  // ------------------------------
  return (
    <UserFeatureContext.Provider value={{
      wishlist,
      compareList,
      recentlyViewed,
      addresses,
      selectedAddressId,

      addToWishlist,
      removeFromWishlist,
      isInWishlist,

      addAddress,
      removeAddress,
      selectAddress,
      getSelectedAddress,
      fetchAddresses,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,

      addToRecentlyViewed
    }}>
      {children}
    </UserFeatureContext.Provider>
  );
};

export const useUserFeatures = () => {
  const ctx = useContext(UserFeatureContext);
  if (!ctx) throw new Error('useUserFeatures must be used within provider');
  return ctx;
};