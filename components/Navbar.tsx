"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, Heart, ChevronRight, Phone, User, LogOut, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUserFeatures } from '../context/UserFeatureContext';
import { Logo } from './Logo';
import logo from "../assets/logo.svg";
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, openWhatsApp } from '@/lib/whatsapp';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { wishlist } = useUserFeatures();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(prev => (prev !== isScrolled ? isScrolled : prev));
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    trackEvent('search', { query: q });
    closeMenu();
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  const currentPath = pathname;

  return (
    <>
      <nav
        className={`sticky top-0 z-50  w-full transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm py-2'
          : 'bg-white border-b border-slate-100 py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <Image src={logo} alt="logo" priority className="h-8 w-auto md:h-10" />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
              {[
                { name: 'Home', path: '/' },
                { name: 'All Products', path: '/products' },
                { name: 'Business', path: '/products?category=Business Laptops' },
                { name: 'Gaming', path: '/products?category=Gaming Laptops' },
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-sm font-medium transition-all duration-200 relative group ${currentPath === link.path
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-teal-600'
                    }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-300 group-hover:w-full ${currentPath === link.path ? 'w-full' : ''}`}></span>
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-3 lg:space-x-5">
              <form onSubmit={submitSearch} className="hidden lg:flex relative group">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent hover:border-slate-200 focus:border-teal-500 focus:bg-white rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 w-48 focus:w-64 transition-all duration-300"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-hover:text-teal-500 transition-colors" />
              </form>

              <Link href="/wishlist" aria-label="Wishlist" className="relative p-2.5 hover:bg-slate-100 rounded-full transition-all hover:scale-105 group hidden sm:flex">
                <Heart className="w-5 h-5 text-slate-600 group-hover:text-red-500 transition-colors" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link href="/cart" aria-label="Cart" className="relative p-2.5 hover:bg-slate-100 rounded-full transition-all hover:scale-105 group">
                <ShoppingCart className="w-5 h-5 text-slate-600 group-hover:text-teal-600 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/account" aria-label="Account" className="relative p-2.5 hover:bg-slate-100 rounded-full transition-all hover:scale-105 group hidden sm:flex">
                <User className="w-5 h-5 text-slate-600 group-hover:text-teal-600 transition-colors" />
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="p-2 hover:bg-slate-100 rounded-full md:hidden transition-colors"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer (Full Screen) */}
      <div
        className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
            <div onClick={() => { closeMenu(); router.push('/'); }} className="cursor-pointer">
              <img src={logo.src} alt="" className="h-8 w-auto" />
            </div>
            <button
              onClick={closeMenu}
              className="p-2 -mr-2 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-slate-900" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 bg-white">
            {/* Search */}
            <form onSubmit={submitSearch} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for laptops..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-base focus:outline-none transition-all shadow-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </form>

            {/* Navigation Links */}
            <div className="space-y-1">
              {[
                { name: 'Home', path: '/' },
                { name: 'All Laptops', path: '/products' },
                { name: 'Business Laptops', path: '/products?category=Business Laptops' },
                { name: 'Gaming Laptops', path: '/products?category=Gaming Laptops' },
                { name: 'Wishlist', path: '/wishlist', icon: Heart },
                { name: 'Account', path: '/account', icon: User },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={closeMenu}
                  className="flex items-center justify-between px-4 py-4 rounded-xl 
                   text-lg font-medium text-slate-800 hover:text-teal-600 
                   hover:bg-teal-50 transition-all active:scale-98 group"
                >
                  <span className="flex items-center">
                    {item.icon && <item.icon className="w-5 h-5 mr-3 text-slate-400 group-hover:text-teal-500" />}
                    {item.name}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500" />
                </Link>
              )

              )}
              {user ? (
                <button
                  key="logout"
                  onClick={() => {
                    logout();
                    closeMenu();
                    router.push("/");
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl
                   text-lg font-medium text-slate-800 hover:text-red-600
                   hover:bg-red-50 transition-all active:scale-98 group"
                >
                  <span className="flex items-center">
                    <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
                    Logout
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-500" />
                </button>
              ) : (
                <Link
                  key="login"
                  href="/account"
                  onClick={closeMenu}
                  className="flex items-center justify-between px-4 py-4 rounded-xl
                   text-lg font-medium text-slate-800 hover:text-teal-600
                   hover:bg-teal-50 transition-all active:scale-98 group"
                >
                  <span className="flex items-center">
                    <LogIn className="w-5 h-5 mr-3 text-slate-400 group-hover:text-teal-500" />
                    Login
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500" />
                </Link>
              )}
            </div>


            {/* Support Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mt-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-sm text-slate-400 mb-1 font-medium uppercase tracking-wide">Need Assistance?</p>
              <a href={`tel:${SUPPORT_PHONE}`} className="text-2xl font-bold block mb-4 tracking-tight flex items-center gap-2">
                <Phone className="w-5 h-5 text-teal-400" /> {SUPPORT_PHONE_DISPLAY}
              </a>
              <button
                onClick={() => {
                  trackEvent("whatsapp_expert_click", { location: "navbar_mobile_menu" });
                  openWhatsApp("Hi Lapshark, I need help finding the right laptop.");
                }}
                className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-teal-50 transition-colors shadow-lg"
              >
                Chat on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
