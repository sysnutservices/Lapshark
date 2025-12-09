"use client";

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Save, Image as ImageIcon, Layout, Type, ToggleLeft, RefreshCcw } from 'lucide-react';
import { SiteConfig } from '@/types';
import ImageGalleryPopup from '@/components/ImageGallery';

export default function SiteEditor() {
    const { siteConfig, updateSiteConfig } = useStore();
    const [config, setConfig] = useState<SiteConfig>(siteConfig!);
    const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'banners' | 'contact'>('hero');

    // Gallery state
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<{ type: 'hero' | 'banner', index?: number } | null>(null);

    const handleSave = () => {
        updateSiteConfig(config);
        alert('Site configuration updated successfully!');
    };

    const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setConfig(prev => ({
            ...prev,
            hero: { ...prev.hero, [e.target.name]: e.target.value }
        }));
    };

    const toggleSection = (key: keyof typeof config.sections) => {
        setConfig(prev => ({
            ...prev,
            sections: { ...prev.sections, [key]: !prev.sections[key] }
        }));
    };

    const updateBanner = (index: number, field: string, value: string) => {
        const newBanners = [...config.banners];
        newBanners[index] = { ...newBanners[index], [field]: value };
        setConfig(prev => ({ ...prev, banners: newBanners }));
    };

    // Gallery handlers
    const openGalleryForHero = () => {
        setGalleryTarget({ type: 'hero' });
        setIsGalleryOpen(true);
    };

    const openGalleryForBanner = (index: number) => {
        setGalleryTarget({ type: 'banner', index });
        setIsGalleryOpen(true);
    };

    const handleImageSelect = (imageUrl: string) => {
        if (galleryTarget?.type === 'hero') {
            setConfig(prev => ({
                ...prev,
                hero: { ...prev.hero, image: imageUrl }
            }));
        } else if (galleryTarget?.type === 'banner' && galleryTarget.index !== undefined) {
            updateBanner(galleryTarget.index, 'image', imageUrl);
        }
        setIsGalleryOpen(false);
        setGalleryTarget(null);
    };

    return (
        <>
            <div className="space-y-6 max-w-5xl mx-auto pb-20">
                <div className="flex justify-between items-center sticky top-0 bg-gray-50 py-4 z-10 border-b border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Website Editor</h1>
                        <p className="text-gray-500 text-sm">Customize your storefront layout and content</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg flex items-center hover:bg-blue-600 transition-colors shadow-lg"
                    >
                        <Save className="w-5 h-5 mr-2" /> Publish Changes
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Tabs */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                        {[
                            { id: 'hero', label: 'Hero Section', icon: Type },
                            { id: 'banners', label: 'Banners', icon: ImageIcon },
                            { id: 'sections', label: 'Section Visibility', icon: Layout },
                            { id: 'contact', label: 'Contact Info', icon: ToggleLeft },
                        ].map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4 mr-3" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="col-span-12 md:col-span-9 space-y-6">

                        {/* Hero Editor */}
                        {activeTab === 'hero' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                                <h2 className="text-lg font-bold text-gray-900 border-b pb-4">Hero Configuration</h2>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Main Headline</label>
                                    <textarea
                                        name="title"
                                        value={config.hero.title}
                                        onChange={handleHeroChange}
                                        rows={2}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Subtitle</label>
                                    <textarea
                                        name="subtitle"
                                        value={config.hero.subtitle}
                                        onChange={handleHeroChange}
                                        rows={3}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Badge Text</label>
                                        <input
                                            name="badgeText"
                                            value={config.hero.badgeText}
                                            onChange={handleHeroChange}
                                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Hero Image</label>
                                        <button
                                            onClick={openGalleryForHero}
                                            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                            Select Image
                                        </button>
                                    </div>
                                </div>

                                {config.hero.image && (
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Current Hero Image</p>
                                            <button
                                                onClick={openGalleryForHero}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                            >
                                                <RefreshCcw className="w-3 h-3" />
                                                Change
                                            </button>
                                        </div>
                                        <div className="relative rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
                                            <img
                                                src={config.hero.image}
                                                alt="Hero Preview"
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Banners Editor */}
                        {activeTab === 'banners' && (
                            <div className="space-y-6">
                                {config.banners.map((banner, index) => (
                                    <div key={banner.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-900">Banner {index + 1}</h3>
                                            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                                                {banner.id}
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-2">Title</label>
                                                    <input
                                                        value={banner.title}
                                                        onChange={(e) => updateBanner(index, 'title', e.target.value)}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-2">Description</label>
                                                    <input
                                                        value={banner.desc}
                                                        onChange={(e) => updateBanner(index, 'desc', e.target.value)}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2">Banner Image</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => openGalleryForBanner(index)}
                                                        className="flex-1 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                        {banner.image ? 'Change Image' : 'Select Image'}
                                                    </button>
                                                    {banner.image && (
                                                        <div className="w-16 h-16 rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
                                                            <img
                                                                src={banner.image}
                                                                className="w-full h-full object-cover"
                                                                alt={`Banner ${index + 1}`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {banner.image && (
                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Preview</p>
                                                    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
                                                        <img
                                                            src={banner.image}
                                                            className="w-full h-32 object-cover"
                                                            alt={`Banner ${index + 1} preview`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sections Editor */}
                        {activeTab === 'sections' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Homepage Sections</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(config.sections).map(([key, isVisible]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Section</span>
                                            <button
                                                onClick={() => toggleSection(key as any)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isVisible ? 'bg-blue-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Editor */}
                        {activeTab === 'contact' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 border-b pb-4">Contact Information</h2>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                    <input
                                        value={config.contact.phone}
                                        onChange={(e) => setConfig(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))}
                                        className="w-full p-2.5 border rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        value={config.contact.email}
                                        onChange={(e) => setConfig(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                                        className="w-full p-2.5 border rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                                    <textarea
                                        value={config.contact.address}
                                        onChange={(e) => setConfig(prev => ({ ...prev, contact: { ...prev.contact, address: e.target.value } }))}
                                        className="w-full p-2.5 border rounded-xl"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Gallery Modal */}
            <ImageGalleryPopup
                isOpen={isGalleryOpen}
                onClose={() => {
                    setIsGalleryOpen(false);
                    setGalleryTarget(null);
                }}
                onSelect={handleImageSelect}
                currentImage={
                    galleryTarget?.type === 'hero'
                        ? config.hero.image
                        : galleryTarget?.type === 'banner' && galleryTarget.index !== undefined
                            ? config.banners[galleryTarget.index].image
                            : undefined
                }
            />
        </>
    );
}