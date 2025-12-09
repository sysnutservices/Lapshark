"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { Product, Category } from '@/types';
import { Edit, Trash2, Plus, X, AlertCircle, Check, Search, Upload, Image as ImageIcon, Cpu, HardDrive, Monitor, Zap, Settings } from 'lucide-react';
import { API_URL, API_URL2 } from '@/api/api';

interface IConfigOption {
    label: string;
    value: string;
    price: number;
}

interface IConfigOptions {
    ram: IConfigOption[];
    storage: IConfigOption[];
    warranty: IConfigOption[];
}

const DEFAULT_CONFIG_OPTIONS: IConfigOptions = {
    ram: [
        { label: "8GB Unified", value: "8GB", price: 0 },
        { label: "16GB Unified", value: "16GB", price: 4000 },
        { label: "32GB Unified", value: "32GB", price: 8000 },
    ],
    storage: [
        { label: "256GB SSD", value: "256GB", price: 0 },
        { label: "512GB SSD", value: "512GB", price: 3000 },
        { label: "1TB SSD", value: "1TB", price: 6000 },
    ],
    warranty: [
        { label: "1 Year Warranty", value: "1 Year", price: 0 },
        { label: "2 Year Coverage", value: "2 Year", price: 2499 },
        { label: "3 Year Premium", value: "3 Year", price: 4499 },
    ],
};

export default function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    // File states
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [mainImagePreview, setMainImagePreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Specs states
    const [specs, setSpecs] = useState({
        processor: '',
        ram: '',
        storage: '',
        display: '',
        graphics: ''
    });

    // Config Options state
    const [configOptions, setConfigOptions] = useState<IConfigOptions>(DEFAULT_CONFIG_OPTIONS);

    const mainImageRef = useRef<HTMLInputElement>(null);
    const galleryImagesRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isModalOpen) {
            setErrors({});
            setMainImageFile(null);
            setGalleryFiles([]);
            setMainImagePreview('');
            setGalleryPreviews([]);
            setExistingGalleryImages([]);
            setSpecs({ processor: '', ram: '', storage: '', display: '', graphics: '' });
            setConfigOptions(DEFAULT_CONFIG_OPTIONS);
        } else if (editingProduct._id) {  // ✅ Changed from editingProduct.id
            if (editingProduct.image) {
                setMainImagePreview(`${API_URL2}${editingProduct.image}`);
            }
            if (editingProduct.images && editingProduct.images.length > 0) {
                const existingImages = editingProduct.images.map(img => `${API_URL2}${img}`);
                setExistingGalleryImages(editingProduct.images);
                setGalleryPreviews(existingImages);
            }
            if (editingProduct.specs) {
                setSpecs({
                    processor: editingProduct.specs.processor || '',
                    ram: editingProduct.specs.ram || '',
                    storage: editingProduct.specs.storage || '',
                    display: editingProduct.specs.display || '',
                    graphics: editingProduct.specs.graphics || ''
                });
            }
            if (editingProduct.configOptions) {
                setConfigOptions(editingProduct.configOptions);
            } else {
                setConfigOptions(DEFAULT_CONFIG_OPTIONS);
            }
        }
    }, [isModalOpen, editingProduct]);

    const validateField = (name: string, value: any) => {
        let error = '';
        switch (name) {
            case 'title':
                if (!value || value.length < 3) error = 'Title must be at least 3 characters';
                break;
            case 'brand':
                if (!value) error = 'Brand is required';
                break;
            case 'price':
                if (!value || Number(value) <= 0) error = 'Price must be greater than 0';
                break;
            case 'stock':
                if (value === undefined || Number(value) < 0) error = 'Stock cannot be negative';
                break;
            case 'description':
                if (!value || value.length < 10) error = 'Description must be at least 10 characters';
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!editingProduct.title || editingProduct.title.length < 3) newErrors.title = 'Title is required';
        if (!editingProduct.brand) newErrors.brand = 'Brand is required';
        if ((editingProduct.price || 0) <= 0) newErrors.price = 'Price invalid';
        if ((editingProduct.stock || 0) < 0) newErrors.stock = 'Stock invalid';
        if (!mainImageFile && !editingProduct.image) newErrors.image = 'Main image is required';
        if (!editingProduct.description) newErrors.description = 'Description is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingProduct(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'discountPercent' || name === 'stock' || name === 'rating' || name === 'reviews'
                ? Number(value)
                : value
        }));
        validateField(name, value);
    };

    const handleSpecChange = (field: string, value: string) => {
        setSpecs(prev => ({ ...prev, [field]: value }));
    };

    const addConfigOption = (type: keyof IConfigOptions) => {
        setConfigOptions(prev => ({
            ...prev,
            [type]: [...prev[type], { label: '', value: '', price: 0 }]
        }));
    };

    const removeConfigOption = (type: keyof IConfigOptions, index: number) => {
        setConfigOptions(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const updateConfigOption = (type: keyof IConfigOptions, index: number, field: keyof IConfigOption, value: string | number) => {
        setConfigOptions(prev => ({
            ...prev,
            [type]: prev[type].map((option, i) =>
                i === index ? { ...option, [field]: value } : option
            )
        }));
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMainImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setMainImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setGalleryFiles(prev => [...prev, ...files]);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setGalleryPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file as File);
            });
        }
    };

    const removeGalleryPreview = (index: number) => {
        const totalExisting = existingGalleryImages.length;

        if (index < totalExisting) {
            setExistingGalleryImages(prev => prev.filter((_, i) => i !== index));
            setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        } else {
            const newFileIndex = index - totalExisting;
            setGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
            setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleDelete = async (mongoId: string) => {  // ✅ Renamed parameter for clarity
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const response = await fetch(`${API_URL}/products/${mongoId}`, {  // ✅ Use MongoDB _id
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to delete product');
                }

                deleteProduct(mongoId);  // ✅ Pass MongoDB _id
                alert('Product deleted successfully!');
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product. Please try again.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);

        try {
            const formData = new FormData();

            // Add all text fields
            formData.append('title', editingProduct.title || '');
            formData.append('brand', editingProduct.brand || '');
            formData.append('category', editingProduct.category || Category.BUSINESS);
            formData.append('description', editingProduct.description || '');
            formData.append('price', String(editingProduct.price || 0));
            formData.append('discountPercent', String(editingProduct.discountPercent || 0));
            formData.append('stock', String(editingProduct.stock || 0));
            formData.append('condition', editingProduct.condition || 'Excellent');
            formData.append('rating', String(editingProduct.rating || 5));
            formData.append('reviews', String(editingProduct.reviews || 0));
            formData.append('slug', editingProduct.slug || '');

            const finalPrice = Math.round((editingProduct.price || 0) * (1 - (editingProduct.discountPercent || 0) / 100));
            formData.append('finalPrice', String(finalPrice));

            formData.append('specs', JSON.stringify(specs));
            formData.append('configOptions', JSON.stringify(configOptions));

            // ✅ Use existing productId when updating, generate new one when creating
            if (editingProduct.productId) {
                formData.append('productId', editingProduct.productId);
            } else {
                formData.append('productId', Math.random().toString(36).substr(2, 9));
            }

            formData.append('isNewItem', String(editingProduct.isNewItem || false));
            formData.append('isTrending', String(editingProduct.isTrending || false));
            formData.append('isBestDeal', String(editingProduct.isBestDeal || false));

            if (mainImageFile) {
                formData.append('image', mainImageFile);
            }

            if (existingGalleryImages.length > 0) {
                formData.append('existingImages', JSON.stringify(existingGalleryImages));
            }

            galleryFiles.forEach(file => {
                formData.append('images', file);
            });

            // ✅ FIXED: Use MongoDB _id for updates
            const url = editingProduct._id
                ? `${API_URL}/products/${editingProduct._id}`  // ✅ Use MongoDB _id
                : `${API_URL}/products`;

            const method = editingProduct._id ? 'PUT' : 'POST';

            console.log('🔧 Saving product:', {
                _id: editingProduct._id,
                productId: editingProduct.productId,
                method,
                url
            });

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save product');
            }

            const savedProduct = await response.json();

            // Update local state
            if (editingProduct._id) {
                updateProduct(savedProduct);
            } else {
                addProduct(savedProduct);
            }

            setIsModalOpen(false);
            alert(`Product ${editingProduct._id ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving product:', error);
            alert(`Failed to save product: ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateSlug = () => {
        if (!editingProduct?.title) return;

        let title = editingProduct.title.toLowerCase();
        title = title.replace(/\b(\d+gb|\d+tb|ssd|hdd)\b/g, "");
        title = title.replace(/\b(\d+gb ram|\d+gb)\b/g, "");
        title = title.replace(/\(\d{4}\)/g, "");
        title = title.replace(/\[\d{4}\]/g, "");
        title = title.replace(/\s+/g, " ").trim();
        let slug = title.replace(/[^a-z0-9]+/g, "-");

        if (editingProduct.brand) {
            const brandSlug = editingProduct.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            slug = `${brandSlug}-${slug}`;
        }

        slug = slug.replace(/^-+|-+$/g, "");
        setEditingProduct(prev => ({ ...prev, slug }));
    };

    const openModal = (product?: Product) => {
        setErrors({});
        setMainImageFile(null);
        setGalleryFiles([]);
        setMainImagePreview('');
        setGalleryPreviews([]);
        setExistingGalleryImages([]);
        setSpecs({ processor: '', ram: '', storage: '', display: '', graphics: '' });
        setConfigOptions(DEFAULT_CONFIG_OPTIONS);

        if (product) {
            console.log('📝 Editing product:', {
                _id: product._id,
                productId: product.productId,
                title: product.title
            });
            setEditingProduct({ ...product });
        } else {
            setEditingProduct({
                title: '',
                brand: '',
                category: Category.BUSINESS,
                condition: 'Excellent',
                stock: 0,
                price: 0,
                discountPercent: 0,
                rating: 5,
                reviews: 0,
                image: '',
                description: '',
                specs: { processor: '', ram: '', storage: '', display: '', graphics: '', os: '' },
                images: [],
                isNewItem: false,
                isTrending: false,
                isBestDeal: false,
                configOptions: DEFAULT_CONFIG_OPTIONS
            });
        }

        setIsModalOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
                    <p className="text-gray-500 text-sm">Manage inventory, prices, and specifications</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add Product
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Condition</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(product => (
                                <tr key={product._id || product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded bg-gray-100 mr-3 overflow-hidden border border-gray-200">
                                                <img
                                                    src={`${API_URL2}${product.image}`}
                                                    className="w-full h-full object-cover"
                                                    alt={product.title}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{product.title}</div>
                                                <div className="text-gray-500 text-xs">{product.brand} • {product.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                                            {product.condition || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">₹{product.finalPrice.toLocaleString('en-IN')}</div>
                                        {product.discountPercent > 0 && (
                                            <div className="text-xs text-red-500 line-through">₹{product.price.toLocaleString('en-IN')}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openModal(product)}
                                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id?.toString() || product.id?.toString() || '')}
                                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? `No products found matching "${searchTerm}"` : 'No products available'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* I'll skip the modal JSX since it's very long and unchanged except for the title check */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-white overflow-hidden">
                    <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
                        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingProduct._id ? 'Edit Product' : 'Add New Product'}  {/* ✅ Changed check */}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Fill in the details below. All fields marked * are required.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                type="button"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="h-[calc(100vh-80px)] overflow-y-auto bg-gray-50">
                        <div className="max-w-5xl mx-auto px-6 py-8">
                            <form onSubmit={handleSave} className="space-y-6">

                                {/* Section 1: Basic Information */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">1</span>
                                        </div>
                                        Basic Information
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
                                        <input
                                            name="title"
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                            value={editingProduct.title || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. MacBook Pro 14 M3"
                                        />
                                        {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.title}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Slug *</label>
                                        <input
                                            name="slug"
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.slug ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                            value={editingProduct.slug || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. macbook-pro-14-m3"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGenerateSlug}
                                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Generate Slug
                                        </button>
                                        {errors.slug && <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.slug}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                                            <input
                                                name="brand"
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
                                                value={editingProduct.brand || ''}
                                                onChange={handleChange}
                                                placeholder="e.g. Apple"
                                            />
                                            {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                            <select
                                                name="category"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={editingProduct.category || Category.BUSINESS}
                                                onChange={handleChange}
                                            >
                                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Refurbished Condition</label>
                                        <select
                                            name="condition"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={editingProduct.condition || 'Excellent'}
                                            onChange={handleChange}
                                        >
                                            <option value="Like New">Like New (Grade A+)</option>
                                            <option value="Excellent">Excellent (Grade A)</option>
                                            <option value="Good">Good (Grade B)</option>
                                            <option value="New">New</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Section 2: Pricing & Inventory */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">2</span>
                                        </div>
                                        Pricing & Inventory
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹) *</label>
                                            <input
                                                name="price"
                                                type="number"
                                                className={`w-full p-3 border rounded-lg outline-none ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                                value={editingProduct.price || ''}
                                                onChange={handleChange}
                                                placeholder="0"
                                            />
                                            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                                            <input
                                                name="discountPercent"
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={editingProduct.discountPercent || ''}
                                                onChange={handleChange}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Qty *</label>
                                            <input
                                                name="stock"
                                                type="number"
                                                min="0"
                                                className={`w-full p-3 border rounded-lg outline-none ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                                                value={editingProduct.stock || ''}
                                                onChange={handleChange}
                                                placeholder="0"
                                            />
                                            {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                                        <span className="text-sm font-medium text-gray-700">Calculated Final Price:</span>
                                        <span className="font-bold text-2xl text-blue-600">
                                            ₹{Math.round((editingProduct.price || 0) * (1 - (editingProduct.discountPercent || 0) / 100)).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>

                                {/* Section 3: Technical Specifications */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">3</span>
                                        </div>
                                        Technical Specifications
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Cpu className="w-4 h-4 inline mr-1" /> Processor
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={specs.processor}
                                                onChange={(e) => handleSpecChange('processor', e.target.value)}
                                                placeholder="e.g. Apple M3 Pro"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <HardDrive className="w-4 h-4 inline mr-1" /> RAM
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={specs.ram}
                                                onChange={(e) => handleSpecChange('ram', e.target.value)}
                                                placeholder="e.g. 16GB Unified Memory"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <HardDrive className="w-4 h-4 inline mr-1" /> Storage
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={specs.storage}
                                                onChange={(e) => handleSpecChange('storage', e.target.value)}
                                                placeholder="e.g. 512GB SSD"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Monitor className="w-4 h-4 inline mr-1" /> Display
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={specs.display}
                                                onChange={(e) => handleSpecChange('display', e.target.value)}
                                                placeholder="e.g. 14-inch Liquid Retina XDR"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Zap className="w-4 h-4 inline mr-1" /> Graphics
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={specs.graphics}
                                                onChange={(e) => handleSpecChange('graphics', e.target.value)}
                                                placeholder="e.g. 14-core GPU"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Customization Options */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">4</span>
                                        </div>
                                        Customization Options
                                    </h3>

                                    {/* RAM Options */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-semibold text-gray-700">RAM Options</label>
                                            <button
                                                type="button"
                                                onClick={() => addConfigOption('ram')}
                                                className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Option
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {configOptions.ram.map((option, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. 8GB Unified)"
                                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.label}
                                                        onChange={(e) => updateConfigOption('ram', index, 'label', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value (e.g. 8GB)"
                                                        className="w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('ram', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('ram', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('ram', index)}
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Storage Options */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-semibold text-gray-700">Storage Options</label>
                                            <button
                                                type="button"
                                                onClick={() => addConfigOption('storage')}
                                                className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Option
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {configOptions.storage.map((option, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. 256GB SSD)"
                                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.label}
                                                        onChange={(e) => updateConfigOption('storage', index, 'label', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value (e.g. 256GB)"
                                                        className="w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('storage', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('storage', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('storage', index)}
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Warranty Options */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-semibold text-gray-700">Warranty Options</label>
                                            <button
                                                type="button"
                                                onClick={() => addConfigOption('warranty')}
                                                className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Option
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {configOptions.warranty.map((option, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. 1 Year Warranty)"
                                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.label}
                                                        onChange={(e) => updateConfigOption('warranty', index, 'label', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value (e.g. 1 Year)"
                                                        className="w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('warranty', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('warranty', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('warranty', index)}
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                        <Settings className="w-4 h-4 inline mr-1" />
                                        These customization options will be available to customers when configuring their product.
                                    </p>
                                </div>

                                {/* Section 5: Media & Details */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">5</span>
                                        </div>
                                        Media & Details
                                    </h3>

                                    {/* Main Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Main Image *</label>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    ref={mainImageRef}
                                                    accept="image/*"
                                                    onChange={handleMainImageChange}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => mainImageRef.current?.click()}
                                                    className={`w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                        } cursor-pointer`}
                                                >
                                                    <Upload className="w-6 h-6 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {mainImageFile ? mainImageFile.name : (editingProduct.image ? 'Click to change image' : 'Click to upload main image')}
                                                    </span>
                                                </button>
                                            </div>
                                            {mainImagePreview && (
                                                <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0 relative group">
                                                    <img src={mainImagePreview} className="w-full h-full object-cover" alt="Main preview" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMainImageFile(null);
                                                            setMainImagePreview('');
                                                            setEditingProduct(prev => ({ ...prev, image: '' }));
                                                        }}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <X className="w-6 h-6 text-white" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {errors.image && <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.image}</p>}
                                    </div>

                                    {/* Gallery Images Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Optional)</label>
                                        <input
                                            type="file"
                                            ref={galleryImagesRef}
                                            accept="image/*"
                                            multiple
                                            onChange={handleGalleryImagesChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => galleryImagesRef.current?.click()}
                                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                            <ImageIcon className="w-6 h-6 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                Click to add gallery images ({galleryFiles.length} new files selected)
                                            </span>
                                        </button>

                                        {/* Gallery Preview */}
                                        {galleryPreviews.length > 0 && (
                                            <div className="grid grid-cols-6 gap-3 mt-4">
                                                {galleryPreviews.map((preview, idx) => (
                                                    <div key={idx} className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden relative group">
                                                        <img src={preview} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                                                        <div className="absolute top-1 right-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeGalleryPreview(idx)}
                                                                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">Upload multiple images for product gallery (max 10 images, 5MB each)</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                        <textarea
                                            name="description"
                                            className={`w-full p-3 border rounded-lg outline-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                            rows={5}
                                            value={editingProduct.description || ''}
                                            onChange={handleChange}
                                            placeholder="Enter detailed product description..."
                                        />
                                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                                    </div>
                                </div>

                                {/* Section 6: Product Flags */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">6</span>
                                        </div>
                                        Product Flags
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="isNewItem"
                                                name="isNewItem"
                                                checked={editingProduct.isNewItem || false}
                                                onChange={(e) => setEditingProduct(prev => ({ ...prev, isNewItem: e.target.checked }))}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <label htmlFor="isNewItem" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                                New Item
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="isTrending"
                                                name="isTrending"
                                                checked={editingProduct.isTrending || false}
                                                onChange={(e) => setEditingProduct(prev => ({ ...prev, isTrending: e.target.checked }))}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <label htmlFor="isTrending" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                                Trending
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="isBestDeal"
                                                name="isBestDeal"
                                                checked={editingProduct.isBestDeal || false}
                                                onChange={(e) => setEditingProduct(prev => ({ ...prev, isBestDeal: e.target.checked }))}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <label htmlFor="isBestDeal" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                                Best Deal
                                            </label>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        These flags help categorize products for display on the homepage and special sections.
                                    </p>
                                </div>

                                {/* Sticky Footer with Action Buttons */}
                                <div className="sticky bottom-0 bg-white border-t shadow-lg rounded-lg p-4 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5 mr-2" /> {editingProduct._id || editingProduct.id ? 'Update Product' : 'Create Product'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}