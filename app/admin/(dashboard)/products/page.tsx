"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { Product, Category } from '@/types';
import { Edit, Trash2, Plus, X, AlertCircle, Check, Search, Upload, Image as ImageIcon, Cpu, HardDrive, Monitor, Zap, Settings, Loader2, RefreshCw, Sparkles, Camera } from 'lucide-react';
import { API_URL } from '@/api/api';
import { STORE_POLICIES } from '@/lib/policies';
import { ensureUploadableImage } from '@/lib/convertHeic';
import router from 'next/router';
import dynamic from 'next/dynamic';
import ProductImageWorkflow from '@/components/admin/ProductImageWorkflow';
const MDEditor = dynamic(
    () => import('@uiw/react-md-editor'),
    { ssr: false }
);

// Status of the automatic background-removal + studio-compositing step that
// runs the instant an image is picked in the Media & Details section, before
// the product itself is saved.
type ImgStatus = 'idle' | 'processing' | 'done' | 'error';

interface IConfigOption {
    label: string;
    value: string;
    price: number;
}

interface IConfigOptions {
    ram: IConfigOption[];
    storage: IConfigOption[];
    warranty: IConfigOption[];
    condition: IConfigOption[];
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
    // Derived from STORE_POLICIES.extendedWarrantyOptions (lib/policies.ts) —
    // was a second hardcoded copy of the same three prices/labels, drifting
    // silently if one got edited and not the other.
    warranty: STORE_POLICIES.extendedWarrantyOptions.map((o) => ({
        label: o.label,
        value: o.label.replace(" Warranty", ""),
        price: o.price,
    })),
    condition: [
        { label: "Good", value: "Good", price: 0 },
        { label: "Excellent", value: "Excellent", price: 2499 },
    ],
};

// Mirrors QUALITY_STATUS_VALUES / the CHECKS list in
// components/ecommerce/ProductQualityReport.tsx — one place so admin input
// and customer-facing display can't drift apart on field names or labels.
const QUALITY_STATUS_CHECKS: { key: string; label: string }[] = [
    { key: 'displayStatus', label: 'Display' },
    { key: 'keyboardStatus', label: 'Keyboard' },
    { key: 'trackpadStatus', label: 'Trackpad' },
    { key: 'webcamStatus', label: 'Webcam' },
    { key: 'speakerStatus', label: 'Speakers' },
    { key: 'microphoneStatus', label: 'Microphone' },
    { key: 'wifiStatus', label: 'Wi-Fi' },
    { key: 'bluetoothStatus', label: 'Bluetooth' },
    { key: 'portsStatus', label: 'Ports' },
];

// Mirrors backend USE_CASES (lapshark_backend/src/models/Product.ts) — the
// controlled vocabulary lib/product-recommendation.ts filters on.
const USE_CASE_OPTIONS = [
    { value: 'student', label: 'Student' },
    { value: 'office', label: 'Office & Business' },
    { value: 'programming', label: 'Programming' },
    { value: 'design', label: 'Design & Editing' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'everyday', label: 'Everyday Use' },
];

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

    // Auto background-removal state. mainImageProcessedUrl / galleryFileProcessedUrl
    // hold the already-hosted ImageKit URL once background removal + compositing
    // succeeds for a given picked file, so handleSave can send it as
    // imageUrl/imageUrls instead of re-uploading the raw file.
    const [mainImageStatus, setMainImageStatus] = useState<ImgStatus>('idle');
    const [mainImageError, setMainImageError] = useState('');
    const [mainImageProcessedUrl, setMainImageProcessedUrl] = useState('');
    const [mainImageReprocessing, setMainImageReprocessing] = useState(false);
    const [galleryFileStatus, setGalleryFileStatus] = useState<ImgStatus[]>([]); // parallel to galleryFiles
    const [galleryFileError, setGalleryFileError] = useState<(string | null)[]>([]);
    const [galleryFileProcessedUrl, setGalleryFileProcessedUrl] = useState<(string | null)[]>([]);
    const [existingImageStatus, setExistingImageStatus] = useState<Record<number, ImgStatus>>({}); // keyed by index into existingGalleryImages

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
    const mainCameraRef = useRef<HTMLInputElement>(null);
    const galleryImagesRef = useRef<HTMLInputElement>(null);
    const galleryCameraRef = useRef<HTMLInputElement>(null);

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
            setMainImageStatus('idle');
            setMainImageError('');
            setMainImageProcessedUrl('');
            setMainImageReprocessing(false);
            setGalleryFileStatus([]);
            setGalleryFileError([]);
            setGalleryFileProcessedUrl([]);
            setExistingImageStatus({});
        } else if (editingProduct._id) {  // ✅ Changed from editingProduct.id
            if (editingProduct.image) {
                setMainImagePreview(`${editingProduct.image}`);
            }
            if (editingProduct.images && editingProduct.images.length > 0) {
                const existingImages = editingProduct.images.map(img => `${img}`);
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
                || name === 'weightKg' || name === 'lengthCm' || name === 'widthCm' || name === 'heightCm'
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

    // Uploads a picked file to the backend, which runs background removal +
    // white-studio compositing and hosts the result on ImageKit. Returns
    // that hosted URL — handleSave sends it as imageUrl/imageUrls instead of
    // re-uploading the raw file.
    const processImageFile = async (file: File): Promise<{ url: string; width: number; height: number }> => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(`${API_URL}/products/process-image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: fd,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Processing failed');
        }
        return res.json();
    };

    // Same processing, for an image that's already hosted (an existing
    // product photo) — used by the "Reprocess" affordance.
    const processImageUrl = async (url: string): Promise<{ url: string; width: number; height: number }> => {
        const res = await fetch(`${API_URL}/products/process-image`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: url }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Processing failed');
        }
        return res.json();
    };

    const processMainImage = async (file: File) => {
        setMainImageStatus('processing');
        setMainImageError('');
        try {
            const result = await processImageFile(file);
            setMainImageProcessedUrl(result.url);
            setMainImagePreview(result.url);
            setMainImageStatus('done');
        } catch (err) {
            setMainImageStatus('error');
            setMainImageError(err instanceof Error ? err.message : 'Processing failed');
        }
    };

    const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        e.target.value = ''; // allow re-picking the same file/photo again (camera retakes reuse names)
        if (!rawFile) return;
        // iPhone photos default to HEIC, which neither the browser preview
        // nor the backend (multer's file filter, then Sharp) can handle —
        // convert to JPEG here so both work.
        const file = await ensureUploadableImage(rawFile);
        setMainImageFile(file);
        setMainImageProcessedUrl('');
        const reader = new FileReader();
        reader.onloadend = () => {
            setMainImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setErrors(prev => ({ ...prev, image: '' }));
        processMainImage(file);
    };

    const reprocessMainImage = async () => {
        if (!editingProduct.image) return;
        setMainImageReprocessing(true);
        try {
            const result = await processImageUrl(editingProduct.image);
            setEditingProduct(prev => ({ ...prev, image: result.url }));
            setMainImagePreview(result.url);
        } catch (err) {
            alert(`Reprocess failed: ${err instanceof Error ? err.message : 'unknown error'}`);
        } finally {
            setMainImageReprocessing(false);
        }
    };

    const processGalleryFile = async (file: File, idx: number) => {
        setGalleryFileStatus(prev => { const n = [...prev]; n[idx] = 'processing'; return n; });
        setGalleryFileError(prev => { const n = [...prev]; n[idx] = null; return n; });
        try {
            const result = await processImageFile(file);
            setGalleryFileProcessedUrl(prev => { const n = [...prev]; n[idx] = result.url; return n; });
            setGalleryFileStatus(prev => { const n = [...prev]; n[idx] = 'done'; return n; });
            setGalleryPreviews(prev => {
                const n = [...prev];
                n[existingGalleryImages.length + idx] = result.url; // swap raw preview -> processed URL
                return n;
            });
        } catch (err) {
            setGalleryFileStatus(prev => { const n = [...prev]; n[idx] = 'error'; return n; });
            setGalleryFileError(prev => { const n = [...prev]; n[idx] = err instanceof Error ? err.message : 'Processing failed'; return n; });
        }
    };

    const handleGalleryImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFiles = Array.from(e.target.files || []);
        e.target.value = ''; // allow re-picking the same file/photo again (camera retakes reuse names)
        if (rawFiles.length === 0) return;
        // Same HEIC->JPEG conversion as the main image — iPhone gallery
        // photos hit the same backend/browser incompatibility.
        const files = await Promise.all(rawFiles.map(ensureUploadableImage));
        const startIdx = galleryFiles.length;
        setGalleryFiles(prev => [...prev, ...files]);
        setGalleryFileStatus(prev => [...prev, ...files.map(() => 'idle' as ImgStatus)]);
        setGalleryFileError(prev => [...prev, ...files.map(() => null)]);
        setGalleryFileProcessedUrl(prev => [...prev, ...files.map(() => null)]);

        files.forEach((file, i) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGalleryPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
            processGalleryFile(file, startIdx + i);
        });
    };

    const reprocessExistingGalleryImage = async (idx: number) => {
        setExistingImageStatus(prev => ({ ...prev, [idx]: 'processing' }));
        try {
            const result = await processImageUrl(existingGalleryImages[idx]);
            setExistingGalleryImages(prev => { const n = [...prev]; n[idx] = result.url; return n; });
            setGalleryPreviews(prev => { const n = [...prev]; n[idx] = result.url; return n; });
            setExistingImageStatus(prev => ({ ...prev, [idx]: 'done' }));
        } catch (err) {
            setExistingImageStatus(prev => ({ ...prev, [idx]: 'error' }));
            alert(`Reprocess failed: ${err instanceof Error ? err.message : 'unknown error'}`);
        }
    };

    const removeGalleryPreview = (index: number) => {
        const totalExisting = existingGalleryImages.length;

        if (index < totalExisting) {
            setExistingGalleryImages(prev => prev.filter((_, i) => i !== index));
            setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
            setExistingImageStatus(prev => {
                const n: Record<number, ImgStatus> = {};
                Object.entries(prev).forEach(([k, v]) => {
                    const i = Number(k);
                    if (i < index) n[i] = v; else if (i > index) n[i - 1] = v;
                });
                return n;
            });
        } else {
            const newFileIndex = index - totalExisting;
            setGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
            setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
            setGalleryFileStatus(prev => prev.filter((_, i) => i !== newFileIndex));
            setGalleryFileError(prev => prev.filter((_, i) => i !== newFileIndex));
            setGalleryFileProcessedUrl(prev => prev.filter((_, i) => i !== newFileIndex));
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
            if (editingProduct.weightKg !== undefined) formData.append('weightKg', String(editingProduct.weightKg));
            if (editingProduct.lengthCm !== undefined) formData.append('lengthCm', String(editingProduct.lengthCm));
            if (editingProduct.widthCm !== undefined) formData.append('widthCm', String(editingProduct.widthCm));
            if (editingProduct.heightCm !== undefined) formData.append('heightCm', String(editingProduct.heightCm));
            formData.append('condition', editingProduct.condition || 'Excellent');
            formData.append('rating', String(editingProduct.rating || 0));
            formData.append('reviews', String(editingProduct.reviews || 0));
            formData.append('slug', editingProduct.slug || '');

            const finalPrice = Math.round((editingProduct.price || 0) * (1 - (editingProduct.discountPercent || 0) / 100));
            formData.append('finalPrice', String(finalPrice));

            formData.append('specs', JSON.stringify(specs));
            formData.append('configOptions', JSON.stringify(configOptions));
            formData.append('useCases', JSON.stringify((editingProduct as any).useCases || []));
            formData.append('tags', JSON.stringify((editingProduct as any).tags || []));
            if ((editingProduct as any).performanceTier) formData.append('performanceTier', (editingProduct as any).performanceTier);
            const qualityReport = (editingProduct as any).qualityReport;
            // Omit entirely rather than send "{}" when nothing's been entered —
            // updateProduct only touches the field when req.body.qualityReport
            // is present at all, so an empty object would overwrite existing
            // per-listing data with nothing on every unrelated edit.
            if (qualityReport && Object.values(qualityReport).some((v) => v !== undefined && v !== '')) {
                formData.append('qualityReport', JSON.stringify(qualityReport));
            }

            // ✅ Use existing productId when updating, generate new one when creating
            if (editingProduct.productId) {
                formData.append('productId', editingProduct.productId);
            } else {
                formData.append('productId', Math.random().toString(36).substr(2, 9));
            }

            formData.append('isNewItem', String(editingProduct.isNewItem || false));
            formData.append('isTrending', String(editingProduct.isTrending || false));
            formData.append('isBestDeal', String(editingProduct.isBestDeal || false));

            // Prefer the already-processed (background-removed, studio-composited)
            // hosted URL over the raw file — the raw file is only sent as a
            // fallback if processing failed or never finished before Save.
            if (mainImageProcessedUrl) {
                formData.append('imageUrl', mainImageProcessedUrl);
            } else if (mainImageFile) {
                formData.append('image', mainImageFile);
            }

            if (existingGalleryImages.length > 0) {
                formData.append('existingImages', JSON.stringify(existingGalleryImages));
            }

            const processedNewGalleryUrls = galleryFiles
                .map((_, i) => galleryFileProcessedUrl[i])
                .filter((u): u is string => !!u);
            if (processedNewGalleryUrls.length > 0) {
                formData.append('imageUrls', JSON.stringify(processedNewGalleryUrls));
            }
            galleryFiles.forEach((file, i) => {
                if (!galleryFileProcessedUrl[i]) {
                    formData.append('images', file); // fallback for files that never finished processing
                }
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

            // Product writes are admin-only. No Content-Type here on purpose:
            // FormData must set its own multipart boundary.
            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
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
        setMainImageStatus('idle');
        setMainImageError('');
        setMainImageProcessedUrl('');
        setMainImageReprocessing(false);
        setGalleryFileStatus([]);
        setGalleryFileError([]);
        setGalleryFileProcessedUrl([]);
        setExistingImageStatus({});

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
                // Was 5 — a brand-new product with 0 reviews shipped with a
                // fake 5.0 rating (the exact "5.0 with 0 reviews" bug).
                // Real ratings only ever come from recalculateProductRating
                // once genuine reviews exist.
                rating: 0,
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

    // Blocks Save while any image is mid-flight through the background-removal
    // endpoint, so a save can't race a still-processing image.
    const anyImageProcessing = mainImageStatus === 'processing'
        || mainImageReprocessing
        || galleryFileStatus.includes('processing')
        || Object.values(existingImageStatus).includes('processing');

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
                    <p className="text-gray-500 text-sm">Manage inventory, prices, and specifications</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add Product
                    </button>
                </div>
            </div>

            {/* Products List — cards on mobile, table from md up */}
            <div className="md:hidden space-y-3">
                {filteredProducts.map(product => (
                    <div key={product._id || product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3">
                        <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                            <img src={product.image} className="w-full h-full object-cover" alt={product.title} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{product.title}</div>
                            <div className="text-gray-500 text-xs">{product.brand} • {product.category}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                                <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                    {product.condition || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div>
                                    <span className="font-bold text-blue-600">₹{product.finalPrice.toLocaleString('en-IN')}</span>
                                    {product.discountPercent > 0 && (
                                        <span className="text-xs text-red-500 line-through ml-2">₹{product.price.toLocaleString('en-IN')}</span>
                                    )}
                                    <span className="text-xs text-gray-500 ml-2">Stock: {product.stock}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openModal(product)}
                                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product._id?.toString() || product.id?.toString() || '')}
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-8 text-center text-gray-500">
                        {searchTerm ? `No products found matching "${searchTerm}"` : 'No products available'}
                    </div>
                )}
            </div>

            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                                                    src={product.image}
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
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                                    {editingProduct._id ? 'Edit Product' : 'Add New Product'}  {/* ✅ Changed check */}
                                </h2>
                                <p className="hidden sm:block text-sm text-gray-500 mt-1">
                                    Fill in the details below. All fields marked * are required.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                type="button"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] overflow-y-auto bg-gray-50">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                            <form onSubmit={handleSave} className="space-y-6">

                                {/* Section 1: Basic Information */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Best For (used by "Find Your Perfect Laptop" &amp; Shop by Need)</label>
                                        <div className="flex flex-wrap gap-3">
                                            {USE_CASE_OPTIONS.map(opt => (
                                                <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={(editingProduct.useCases || []).includes(opt.value)}
                                                        onChange={(e) => {
                                                            const current: string[] = editingProduct.useCases || [];
                                                            const next = e.target.checked
                                                                ? [...current, opt.value]
                                                                : current.filter(v => v !== opt.value);
                                                            setEditingProduct({ ...editingProduct, useCases: next } as any);
                                                        }}
                                                    />
                                                    {opt.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Performance Tier</label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={(editingProduct as any).performanceTier || ''}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, performanceTier: e.target.value || undefined } as any)}
                                            >
                                                <option value="">Not set</option>
                                                <option value="basic">Basic</option>
                                                <option value="balanced">Balanced</option>
                                                <option value="high-performance">High Performance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated, e.g. best-value, portable)</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={((editingProduct as any).tags || []).join(', ')}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } as any)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Pricing & Inventory */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
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
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (₹)</label>
                                            <input
                                                name="sellingPrice"
                                                type="number"
                                                min="0"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={editingProduct.price ? Math.round((editingProduct.price || 0) * (1 - (editingProduct.discountPercent || 0) / 100)) || '' : ''}
                                                onChange={(e) => {
                                                    const basePrice = editingProduct.price || 0;
                                                    const sellingPrice = Number(e.target.value);
                                                    const discountPercent = basePrice > 0
                                                        ? Math.min(100, Math.max(0, ((basePrice - sellingPrice) / basePrice) * 100))
                                                        : 0;
                                                    setEditingProduct(prev => ({ ...prev, discountPercent }));
                                                }}
                                                placeholder={String(editingProduct.price || 0)}
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

                                    {/* Shipping package dims — used to book the Ekart shipment (rate +
                                        serviceability); defaults to a typical boxed-laptop parcel so this
                                        is optional, override only when a product's real package differs. */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                                            <input
                                                name="weightKg"
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={editingProduct.weightKg ?? ''}
                                                onChange={handleChange}
                                                placeholder="2.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Length (cm)</label>
                                            <input
                                                name="lengthCm"
                                                type="number"
                                                min="0"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={editingProduct.lengthCm ?? ''}
                                                onChange={handleChange}
                                                placeholder="35"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Width (cm)</label>
                                            <input
                                                name="widthCm"
                                                type="number"
                                                min="0"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={editingProduct.widthCm ?? ''}
                                                onChange={handleChange}
                                                placeholder="25"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                                            <input
                                                name="heightCm"
                                                type="number"
                                                min="0"
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                                                value={editingProduct.heightCm ?? ''}
                                                onChange={handleChange}
                                                placeholder="8"
                                            />
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
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
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
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">4</span>
                                        </div>
                                        Customization Options
                                    </h3>

                                    {/* RAM Options */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-semibold text-gray-700">Condition Options</label>
                                            <button
                                                type="button"
                                                onClick={() => addConfigOption('condition')}
                                                className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Option
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {configOptions?.condition?.map((option, index) => (
                                                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-100 rounded-lg p-2 sm:border-0 sm:p-0">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. Good)"
                                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.label}
                                                        onChange={(e) => updateConfigOption('condition', index, 'label', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value (e.g. Good)"
                                                        className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('condition', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-full sm:w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('condition', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('condition', index)}
                                                        className="text-red-500 hover:text-red-700 p-2 self-end sm:self-auto"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
                                                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-100 rounded-lg p-2 sm:border-0 sm:p-0">
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
                                                        className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('ram', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-full sm:w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('ram', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('ram', index)}
                                                        className="text-red-500 hover:text-red-700 p-2 self-end sm:self-auto"
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
                                                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-100 rounded-lg p-2 sm:border-0 sm:p-0">
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
                                                        className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('storage', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-full sm:w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('storage', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('storage', index)}
                                                        className="text-red-500 hover:text-red-700 p-2 self-end sm:self-auto"
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
                                                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-100 rounded-lg p-2 sm:border-0 sm:p-0">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. 6 Months Warranty)"
                                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.label}
                                                        onChange={(e) => updateConfigOption('warranty', index, 'label', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value (e.g. 6 Months)"
                                                        className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.value}
                                                        onChange={(e) => updateConfigOption('warranty', index, 'value', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price ₹"
                                                        className="w-full sm:w-28 p-2 border border-gray-300 rounded-lg text-sm"
                                                        value={option.price}
                                                        onChange={(e) => updateConfigOption('warranty', index, 'price', Number(e.target.value))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeConfigOption('warranty', index)}
                                                        className="text-red-500 hover:text-red-700 p-2 self-end sm:self-auto"
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
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">5</span>
                                        </div>
                                        Media & Details
                                    </h3>

                                    {/* Main Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Main Image *</label>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <input
                                                    type="file"
                                                    ref={mainCameraRef}
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={handleMainImageChange}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => mainCameraRef.current?.click()}
                                                    className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                        } cursor-pointer`}
                                                >
                                                    <Camera className="w-6 h-6 text-gray-500" />
                                                    <span className="text-xs text-gray-600 text-center">Take Photo</span>
                                                </button>
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
                                                    className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                        } cursor-pointer`}
                                                >
                                                    <Upload className="w-6 h-6 text-gray-500" />
                                                    <span className="text-xs text-gray-600 text-center">Upload File</span>
                                                </button>
                                            </div>
                                            {mainImagePreview && (
                                                <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0 relative group mx-auto sm:mx-0">
                                                    <img src={mainImagePreview} className="w-full h-full object-cover" alt="Main preview" />
                                                    {(mainImageStatus === 'processing' || mainImageReprocessing) && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setMainImageFile(null);
                                                            setMainImagePreview('');
                                                            setMainImageProcessedUrl('');
                                                            setMainImageStatus('idle');
                                                            setEditingProduct(prev => ({ ...prev, image: '' }));
                                                        }}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <X className="w-6 h-6 text-white" />
                                                    </button>
                                                    {mainImageStatus !== 'processing' && !mainImageReprocessing && editingProduct.image && !mainImageFile && (
                                                        <button
                                                            type="button"
                                                            onClick={reprocessMainImage}
                                                            title="Remove background / re-apply studio background"
                                                            className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full transition-colors"
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {mainImageFile && <p className="text-xs text-gray-500 mt-1 truncate">{mainImageFile.name}</p>}
                                        {mainImageStatus === 'processing' && (
                                            <p className="text-xs text-blue-600 mt-1 flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Removing background & applying studio background...</p>
                                        )}
                                        {mainImageStatus === 'error' && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" /> {mainImageError} — saved as-is if you continue.
                                                <button type="button" onClick={() => mainImageFile && processMainImage(mainImageFile)} className="ml-2 underline flex items-center">
                                                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                                                </button>
                                            </p>
                                        )}
                                        {errors.image && <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.image}</p>}
                                        <p className="text-xs text-gray-500 mt-1">Background is removed and a white studio background applied automatically.</p>
                                    </div>

                                    {/* Ecommerce Image Workflow (local segmentation + Sharp) — only
                                        available once the product exists, since approve/publish/reorder
                                        are inherently product-scoped. New products keep using the
                                        simpler flow above until saved once. */}
                                    {editingProduct._id && (
                                        <div className="border-t border-gray-100 pt-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-sm font-medium text-gray-700">Ecommerce Images</label>
                                            </div>
                                            <ProductImageWorkflow productId={editingProduct._id} />
                                        </div>
                                    )}

                                    {/* Gallery Images Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Optional)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="file"
                                                ref={galleryCameraRef}
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleGalleryImagesChange}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => galleryCameraRef.current?.click()}
                                                className="p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                                            >
                                                <Camera className="w-6 h-6 text-gray-500" />
                                                <span className="text-xs text-gray-600 text-center">Take Photo</span>
                                            </button>
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
                                                className="p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                                            >
                                                <ImageIcon className="w-6 h-6 text-gray-500" />
                                                <span className="text-xs text-gray-600 text-center">Upload Files</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">{galleryFiles.length} new file{galleryFiles.length === 1 ? '' : 's'} selected</p>

                                        {/* Gallery Preview */}
                                        {galleryPreviews.length > 0 && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                                                {galleryPreviews.map((preview, idx) => {
                                                    const isExisting = idx < existingGalleryImages.length;
                                                    const status: ImgStatus = isExisting
                                                        ? (existingImageStatus[idx] || 'idle')
                                                        : (galleryFileStatus[idx - existingGalleryImages.length] || 'idle');
                                                    const error = isExisting ? null : galleryFileError[idx - existingGalleryImages.length];
                                                    return (
                                                        <div key={idx} className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden relative group">
                                                            <img src={preview} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                                                            {status === 'processing' && (
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                                </div>
                                                            )}
                                                            {status === 'error' && (
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center" title={error || 'Processing failed'}>
                                                                    <AlertCircle className="w-5 h-5 text-amber-300" />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-1 right-1 flex gap-1">
                                                                {status === 'error' && !isExisting && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => processGalleryFile(galleryFiles[idx - existingGalleryImages.length], idx - existingGalleryImages.length)}
                                                                        title="Retry processing"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full transition-colors"
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {isExisting && status !== 'processing' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => reprocessExistingGalleryImage(idx)}
                                                                        title="Remove background / re-apply studio background"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full transition-colors"
                                                                    >
                                                                        <Sparkles className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeGalleryPreview(idx)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">Upload multiple images for product gallery (max 10 images, 5MB each)</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                        <MDEditor
                                            value={editingProduct.description || ''}
                                            onChange={(value) =>
                                                setEditingProduct(prev => ({
                                                    ...prev,
                                                    description: value || '',
                                                }))
                                            }
                                            height={500}
                                            preview="edit"
                                        />

                                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                                    </div>
                                </div>

                                {/* Section 6: Product Flags */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
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

                                {/* Section 7: Lapshark Quality Report */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <span className="text-blue-600 font-bold">7</span>
                                        </div>
                                        Lapshark Quality Report
                                    </h3>
                                    <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        Optional, per-listing. Leave a field blank/"Not checked" until it's actually
                                        inspected — the customer-facing report only shows fields you've entered here,
                                        never a fabricated pass. Only enter real per-unit numbers if this listing's
                                        stock represents a single physical unit.
                                    </p>

                                    {(() => {
                                        const qr: any = (editingProduct as any).qualityReport || {};
                                        const setQr = (patch: any) =>
                                            setEditingProduct({ ...editingProduct, qualityReport: { ...qr, ...patch } } as any);
                                        return (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Battery Health (%)</label>
                                                        <input
                                                            type="number" min={0} max={100}
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={qr.batteryHealthPercent ?? ''}
                                                            onChange={(e) => setQr({ batteryHealthPercent: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">SSD/Storage Health (%)</label>
                                                        <input
                                                            type="number" min={0} max={100}
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={qr.storageHealthPercent ?? ''}
                                                            onChange={(e) => setQr({ storageHealthPercent: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {QUALITY_STATUS_CHECKS.map(({ key, label }) => (
                                                        <div key={key}>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                                                            <select
                                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                                value={qr[key] || ''}
                                                                onChange={(e) => setQr({ [key]: e.target.value || undefined })}
                                                            >
                                                                <option value="">Not checked</option>
                                                                <option value="passed">Passed</option>
                                                                <option value="minor-wear">Minor Wear</option>
                                                                <option value="failed">Failed</option>
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            id="serialVerified"
                                                            checked={!!qr.serialVerified}
                                                            onChange={(e) => setQr({ serialVerified: e.target.checked })}
                                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <label htmlFor="serialVerified" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                                            Serial Number Verified
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            id="technicianChecked"
                                                            checked={!!qr.technicianChecked}
                                                            onChange={(e) => setQr({ technicianChecked: e.target.checked })}
                                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <label htmlFor="technicianChecked" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                                            Technician Inspected
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Physical Condition Notes (internal + shown if entered)</label>
                                                    <textarea
                                                        rows={2}
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={qr.physicalConditionNotes || ''}
                                                        onChange={(e) => setQr({ physicalConditionNotes: e.target.value || undefined })}
                                                    />
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Sticky Footer with Action Buttons */}
                                <div className="sticky bottom-0 bg-white border-t shadow-lg rounded-lg p-4 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
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
                                        disabled={isSaving || anyImageProcessing}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : anyImageProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Processing images...
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