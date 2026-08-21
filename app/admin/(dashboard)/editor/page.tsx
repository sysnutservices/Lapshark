"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Save, Image as ImageIcon, Layout, Type, ToggleLeft, RefreshCcw, BookOpen, Plus, Trash2, Calendar, X, Monitor, Tablet, Smartphone } from 'lucide-react';
import { SiteConfig, BlogPost } from '@/types';
import ImageGalleryPopup from '@/components/ImageGallery';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(
    () => import('@uiw/react-md-editor'),
    { ssr: false }
);

type DeviceType = 'desktop' | 'mobile' | 'tablet';

export default function SiteEditor() {
    const { siteConfig, updateSiteConfig, blogs, addBlog, updateBlog, deleteBlog } = useStore();
    const [config, setConfig] = useState<SiteConfig>(siteConfig!);
    const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'banners' | 'contact' | 'blog'>('hero');
    const [selectedBlogIndex, setSelectedBlogIndex] = useState<number | null>(null);
    const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newBlogData, setNewBlogData] = useState({
        title: '',
        excerpt: '',
        content: '',
        image: ''
    });

    useEffect(() => {
        if (siteConfig) {
            setConfig(siteConfig);
        }
    }, [siteConfig]);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<{
        type: 'hero' | 'banner' | 'blog' | 'heroDevice' | 'newBlog',
        index?: number,
        device?: DeviceType
    } | null>(null);

    const handleSave = () => {
        const { blogs: _, ...configWithoutBlogs } = config;
        updateSiteConfig(configWithoutBlogs as SiteConfig);
        alert('Site configuration updated successfully!');
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

    const handleBlogSelect = (index: number) => {
        setIsCreatingNew(false);
        setSelectedBlogIndex(index);
        setSelectedBlog({ ...blogs[index] });
        setImagePreview(blogs[index].image);
    };

    const handleBlogFieldChange = (field: keyof BlogPost, value: string) => {
        if (selectedBlog) {
            setSelectedBlog({ ...selectedBlog, [field]: value });
            if (field === 'image') {
                setImagePreview(value);
            }
        }
    };

    const handleNewBlogFieldChange = (field: string, value: string) => {
        setNewBlogData(prev => ({ ...prev, [field]: value }));
        if (field === 'image') {
            setImagePreview(value);
        }
    };

    const handleShowNewBlogForm = () => {
        setIsCreatingNew(true);
        setSelectedBlogIndex(null);
        setSelectedBlog(null);
        setNewBlogData({
            title: '',
            excerpt: '',
            content: '# Your blog content here\n\nStart writing your blog post...',
            image: ''
        });
        setImagePreview('');
    };

    const handleCancelNewBlog = () => {
        setIsCreatingNew(false);
        setNewBlogData({
            title: '',
            excerpt: '',
            content: '',
            image: ''
        });
        setImagePreview('');
    };

    const handlePublishNewBlog = async () => {
        if (!newBlogData.title || !newBlogData.excerpt) {
            alert('Please fill in title and excerpt');
            return;
        }

        try {
            await addBlog(newBlogData);
            alert('Blog post created successfully!');
            setIsCreatingNew(false);
            setNewBlogData({
                title: '',
                excerpt: '',
                content: '',
                image: ''
            });
            setImagePreview('');
        } catch (error) {
            console.error('Error creating blog:', error);
            alert('Failed to create blog post');
        }
    };

    const handleSaveBlog = async () => {
        if (!selectedBlog) return;

        try {
            const payload = {
                title: selectedBlog.title,
                excerpt: selectedBlog.excerpt,
                content: selectedBlog.content || '',
                image: selectedBlog.image,
            };

            await updateBlog(selectedBlog._id, payload);
            alert('Blog post updated successfully!');
        } catch (error) {
            console.error('Error updating blog:', error);
            alert('Failed to update blog post');
        }
    };

    const handleDeleteBlog = async (id: string) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            try {
                await deleteBlog(id);
                alert('Blog post deleted successfully!');
                setSelectedBlogIndex(null);
                setSelectedBlog(null);
            } catch (error) {
                console.error('Error deleting blog:', error);
                alert('Failed to delete blog post');
            }
        }
    };

    const openGalleryForHero = () => {
        setGalleryTarget({ type: 'hero' });
        setIsGalleryOpen(true);
    };

    const openGalleryForHeroDevice = (device: DeviceType) => {
        setGalleryTarget({ type: 'heroDevice', device });
        setIsGalleryOpen(true);
    };

    const openGalleryForBanner = (index: number) => {
        setGalleryTarget({ type: 'banner', index });
        setIsGalleryOpen(true);
    };

    const openGalleryForBlog = (index: number) => {
        setGalleryTarget({ type: 'blog', index });
        setIsGalleryOpen(true);
    };

    const openGalleryForNewBlog = () => {
        setGalleryTarget({ type: 'newBlog' });
        setIsGalleryOpen(true);
    };

    const handleImageSelect = (imageUrl: string) => {
        if (galleryTarget?.type === 'hero') {
            setConfig(prev => ({
                ...prev,
                hero: { ...prev.hero, image: imageUrl }
            }));
        } else if (galleryTarget?.type === 'heroDevice' && galleryTarget.device) {
            const deviceField = galleryTarget.device === 'desktop'
                ? 'imageDesktop'
                : galleryTarget.device === 'mobile'
                    ? 'imageMobile'
                    : 'imageTablet';

            setConfig(prev => ({
                ...prev,
                hero: { ...prev.hero, [deviceField]: imageUrl }
            }));
        } else if (galleryTarget?.type === 'banner' && galleryTarget.index !== undefined) {
            updateBanner(galleryTarget.index, 'image', imageUrl);
        } else if (galleryTarget?.type === 'blog' && galleryTarget.index !== undefined && selectedBlog) {
            setSelectedBlog({ ...selectedBlog, image: imageUrl });
            setImagePreview(imageUrl);
        } else if (galleryTarget?.type === 'newBlog') {
            setNewBlogData(prev => ({ ...prev, image: imageUrl }));
            setImagePreview(imageUrl);
        }
        setIsGalleryOpen(false);
        setGalleryTarget(null);
    };

    const getDeviceIcon = (device: DeviceType) => {
        switch (device) {
            case 'desktop': return Monitor;
            case 'tablet': return Tablet;
            case 'mobile': return Smartphone;
        }
    };

    const getDeviceImage = (device: DeviceType) => {
        if (!config?.hero) return '';
        switch (device) {
            case 'desktop': return config.hero.imageDesktop || '';
            case 'tablet': return config.hero.imageTablet || '';
            case 'mobile': return config.hero.imageMobile || '';
        }
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
                    <div className="col-span-12 md:col-span-3 space-y-2">
                        {[
                            { id: 'hero', label: 'Hero Section', icon: Type },
                            { id: 'banners', label: 'Banners', icon: ImageIcon },
                            { id: 'blog', label: 'Blog Posts', icon: BookOpen },
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

                    <div className="col-span-12 md:col-span-9 space-y-6">

                        {activeTab === 'hero' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                                    <div className="border-b pb-4">
                                        <h2 className="text-lg font-bold text-gray-900">Responsive Hero Images</h2>
                                        <p className="text-sm text-gray-500 mt-1">Set different images for each device type</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map((device) => {
                                            const Icon = getDeviceIcon(device);
                                            const deviceImage = getDeviceImage(device);

                                            return (
                                                <div key={device} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-4 h-4 text-gray-600" />
                                                        <label className="text-sm font-bold text-gray-700 capitalize">
                                                            {device}
                                                        </label>
                                                    </div>

                                                    <button
                                                        onClick={() => openGalleryForHeroDevice(device)}
                                                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                        Select
                                                    </button>

                                                    {deviceImage && (
                                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-xs font-bold text-gray-500 uppercase">Preview</p>
                                                                <button
                                                                    onClick={() => openGalleryForHeroDevice(device)}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                                >
                                                                    <RefreshCcw className="w-3 h-3" />
                                                                    Change
                                                                </button>
                                                            </div>
                                                            <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
                                                                <img
                                                                    src={deviceImage}
                                                                    alt={`${device} preview`}
                                                                    className="w-full h-32 object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700">Default Hero Image</label>
                                                <p className="text-xs text-gray-500 mt-1">Fallback image if device-specific images are not set</p>
                                            </div>
                                            <button
                                                onClick={openGalleryForHero}
                                                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium text-sm"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                Select Default
                                            </button>
                                        </div>

                                        {config?.hero?.image && (
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Preview</p>
                                                    <button
                                                        onClick={openGalleryForHero}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                    >
                                                        <RefreshCcw className="w-3 h-3" />
                                                        Change
                                                    </button>
                                                </div>
                                                <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
                                                    <img
                                                        src={config.hero.image}
                                                        alt="Default Hero Preview"
                                                        className="w-full h-40 object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

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

                        {activeTab === 'blog' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Blog Posts</h2>
                                            <p className="text-sm text-gray-500">Manage your blog content with markdown editor</p>
                                        </div>
                                        <button
                                            onClick={handleShowNewBlogForm}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <Plus className="w-4 h-4" /> New Post
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {blogs.map((blog, index) => (
                                            <div
                                                key={blog.slug}
                                                onClick={() => handleBlogSelect(index)}
                                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedBlogIndex === index
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {blog.image && (
                                                        <img
                                                            src={blog.image}
                                                            alt={blog.title}
                                                            className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 mb-1 truncate">{blog.title}</h3>
                                                        <p className="text-sm text-gray-500 line-clamp-2">{blog.excerpt}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {blog.date}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedBlogIndex === index
                                                                ? 'bg-blue-200 text-blue-700'
                                                                : 'bg-gray-200 text-gray-600'
                                                                }`}>
                                                                {selectedBlogIndex === index ? 'Editing' : 'Click to edit'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {blogs.length === 0 && (
                                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500 font-medium">No blog posts yet</p>
                                                <p className="text-sm text-gray-400 mb-4">Create your first blog post to get started</p>
                                                <button
                                                    onClick={handleShowNewBlogForm}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    <Plus className="w-4 h-4" /> Create First Post
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* NEW BLOG FORM */}
                                {isCreatingNew && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Create New Blog Post</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handlePublishNewBlog}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    <Plus className="w-4 h-4" /> Publish Post
                                                </button>
                                                <button
                                                    onClick={handleCancelNewBlog}
                                                    className="text-gray-600 hover:text-gray-700 flex items-center gap-2 text-sm font-medium px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    <X className="w-4 h-4" /> Cancel
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Post Title *</label>
                                                <input
                                                    value={newBlogData.title}
                                                    onChange={(e) => handleNewBlogFieldChange('title', e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Enter post title..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Excerpt / Summary *</label>
                                                <textarea
                                                    value={newBlogData.excerpt}
                                                    onChange={(e) => handleNewBlogFieldChange('excerpt', e.target.value)}
                                                    rows={2}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Brief summary of the post..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Featured Image</label>
                                                <button
                                                    onClick={openGalleryForNewBlog}
                                                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                    Select from Gallery
                                                </button>
                                                {imagePreview && (
                                                    <div className="mt-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Preview</p>
                                                        <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
                                                            <img
                                                                src={imagePreview}
                                                                className="w-full h-40 object-cover"
                                                                alt="Preview"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Blog Content (Markdown)</label>
                                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                                    <MDEditor
                                                        value={newBlogData.content}
                                                        onChange={(value) => handleNewBlogFieldChange('content', value || '')}
                                                        height={500}
                                                        preview="edit"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Use markdown syntax to format your content. Supports headings, lists, links, images, and more.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* EDIT BLOG FORM */}
                                {selectedBlog && !isCreatingNew && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Edit Blog Post</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleSaveBlog}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors text-sm font-medium"
                                                >
                                                    <Save className="w-4 h-4" /> Save Changes
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBlog(selectedBlog._id)}
                                                    className="text-red-600 hover:text-red-700 flex items-center gap-2 text-sm font-medium px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Post Title</label>
                                                <input
                                                    value={selectedBlog.title}
                                                    onChange={(e) => handleBlogFieldChange('title', e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Enter post title..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Excerpt / Summary</label>
                                                <textarea
                                                    value={selectedBlog.excerpt}
                                                    onChange={(e) => handleBlogFieldChange('excerpt', e.target.value)}
                                                    rows={2}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Brief summary of the post..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Featured Image</label>
                                                <button
                                                    onClick={() => openGalleryForBlog(selectedBlogIndex!)}
                                                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 font-medium"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                    Select from Gallery
                                                </button>
                                                {imagePreview && (
                                                    <div className="mt-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Preview</p>
                                                        <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
                                                            <img
                                                                src={imagePreview}
                                                                className="w-full h-40 object-cover"
                                                                alt="Preview"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Blog Content (Markdown)</label>
                                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                                    <MDEditor
                                                        value={selectedBlog.content || ''}
                                                        onChange={(value) => handleBlogFieldChange('content', value || '')}
                                                        height={500}
                                                        preview="edit"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Use markdown syntax to format your content. Supports headings, lists, links, images, and more.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
                        : galleryTarget?.type === 'heroDevice' && galleryTarget.device
                            ? getDeviceImage(galleryTarget.device)
                            : galleryTarget?.type === 'banner' && galleryTarget.index !== undefined
                                ? config.banners[galleryTarget.index].image
                                : galleryTarget?.type === 'blog' && selectedBlog
                                    ? selectedBlog.image
                                    : galleryTarget?.type === 'newBlog'
                                        ? newBlogData.image
                                        : undefined
                }
            />
        </>
    );
}