'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { API_URL } from '@/api/api';

interface ImageGalleryPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (imageUrl: string) => void;
    currentImage?: string;
}

export interface GalleryImage {
    fileId: string;
    name: string;
    url: string;
    thumbnail?: string;
    size: number;
    width?: number;
    height?: number;
    createdAt: string;
}

export default function ImageGalleryPopup({
    isOpen,
    onClose,
    onSelect,
    currentImage
}: ImageGalleryPopupProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(currentImage || null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchImages();
        }
    }, [isOpen]);

    const fetchImages = async () => {
        try {
            const response = await fetch(`${API_URL}/gallery/images`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await response.json();

            if (data.success && data.images) {
                setImages(data.images);
            }
        } catch (error) {
            console.error('Failed to fetch images:', error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
    };

    const handleFiles = async (files: File[]) => {
        setIsUploading(true);
        const totalFiles = files.length;
        let completed = 0;

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    await uploadToBackend(file);
                    completed++;
                    setUploadProgress(Math.round((completed / totalFiles) * 100));
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert(`Failed to upload ${file.name}`);
                }
            }
        }

        setIsUploading(false);
        setUploadProgress(0);
        fetchImages();
    };

    const uploadToBackend = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`${API_URL}/gallery/upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success || !data.url) {
            throw new Error(data.error || "Upload failed");
        }

        return data.url;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleImageSelect = (image: string) => {
        setSelectedImage(image);
    };

    const handleDeleteImage = async (fileId: string, url: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const res = await fetch(`${API_URL}/gallery/delete-image`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ fileId, url })
            });

            if (!res.ok) {
                throw new Error('Delete failed');
            }

            setImages(prev => prev.filter(img => img.fileId !== fileId));

            if (selectedImage === url) {
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('Failed to delete image:', error);
            alert('Failed to delete image');
        }
    };

    const handleConfirm = () => {
        if (selectedImage) {
            onSelect(selectedImage);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes imageAppear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .gallery-modal-overlay {
          animation: modalFadeIn 0.2s ease-out;
        }

        .gallery-modal-content {
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gallery-image-item {
          animation: imageAppear 0.3s ease-out backwards;
        }
      `}</style>

            <div
                className="gallery-modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="gallery-modal-content bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-teal-100/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                    Select Image
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Choose from gallery or upload new images
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto p-8">
                        {/* Upload Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className={`
                                relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
                                transition-all duration-300 mb-8
                                ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}
                                ${isDragging
                                    ? 'border-teal-500 bg-teal-50 scale-[1.02]'
                                    : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/50'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isUploading}
                            />

                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-300 ${isDragging ? 'bg-teal-100 scale-110' : 'bg-white border-2 border-slate-200'
                                }`}>
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                                ) : (
                                    <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-teal-600' : 'text-slate-400'}`} />
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {isUploading ? 'Uploading...' : isDragging ? 'Drop images here' : 'Upload Images'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {isUploading ? 'Please wait' : 'Drag and drop or click to browse'}
                            </p>

                            {/* Progress Bar */}
                            {isUploading && uploadProgress > 0 && (
                                <div className="max-w-xs mx-auto mt-4">
                                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {!isUploading && (
                                <div className="inline-flex items-center gap-2 text-xs text-slate-400">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>JPG, PNG, GIF up to 10MB</span>
                                </div>
                            )}
                        </div>

                        {/* Gallery Grid */}
                        {images.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Gallery ({images.length})
                                    </h3>
                                    <div className="text-sm text-slate-500">
                                        {selectedImage ? '1 selected' : 'Select an image'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {images.map((image, index) => (
                                        <div
                                            key={image.fileId}
                                            onClick={() => handleImageSelect(image.url)}
                                            className="gallery-image-item group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100 border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                            style={{
                                                animationDelay: `${index * 0.03}s`,
                                                borderColor: selectedImage === image.url ? '#3B82F6' : '#E5E7EB',
                                            }}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.name}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => handleDeleteImage(image.fileId, image.url, e)}
                                                    className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </button>
                                            </div>

                                            {/* Selection Indicator */}
                                            {selectedImage === image.url && (
                                                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shadow-lg ring-4 ring-white">
                                                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {images.length === 0 && (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
                                    <ImageIcon className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No images yet</h3>
                                <p className="text-sm text-slate-500">Upload your first image to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {selectedImage && (
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-teal-500">
                                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Image selected</p>
                                    <p className="text-xs text-slate-500">Ready to use</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30"
                                >
                                    Use This Image
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}