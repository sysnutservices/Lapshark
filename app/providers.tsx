"use client";

import React from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { UserFeatureProvider } from '../context/UserFeatureContext';
import { StoreProvider } from '../context/StoreContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <UserFeatureProvider>
              {children}
            </UserFeatureProvider>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </LazyMotion>
  );
}
