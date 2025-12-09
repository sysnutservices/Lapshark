"use client";

import React, { useContext, useState, useEffect, ReactNode, createContext } from 'react';
import { Address, Product } from '../types';
import { API_URL } from '@/api/api';

interface UserFeatureContextType {
  wishlist: Product[];
  compareList: Product[];
  recentlyViewed: Product[];
  addresses: Address[];
  selectedAddressId: string | null;
  userLocation: UserLocation | null;

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

interface UserLocation {
  latitude: number;
  longitude: number;
  error?: string;
}

const UserFeatureContext = createContext<UserFeatureContextType | undefined>(undefined);

export const UserFeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  // ------------------------------
  // WISHLIST
  // ------------------------------
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('techmart_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('techmart_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product: Product) => {
    setWishlist(prev =>
      prev.some(p => p.productId === product.productId) ? prev : [...prev, product]
    );
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(p => p.productId !== productId));
  };

  const isInWishlist = (productId: string) =>
    wishlist.some(p => p.productId === productId);

  // ------------------------------
  // COMPARE
  // ------------------------------
  const [compareList, setCompareList] = useState<Product[]>(() => {
    const saved = localStorage.getItem('techmart_compare');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('techmart_compare', JSON.stringify(compareList));
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
    const saved = localStorage.getItem('techmart_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('techmart_recently_viewed', JSON.stringify(recentlyViewed));
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
  // USER LOCATION
  // ------------------------------
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location permission denied or unavailable", error);
          setUserLocation({ latitude: 0, longitude: 0, error: error.message });
        }
      );
    }
  }, []);

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
      userLocation,

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