'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { API_URL, API_URL2 } from '@/api/api';

interface ImageGalleryPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (imageUrl: string) => void;
    currentImage?: string;
    uploadEndpoint?: string; // Add this prop
}

export default function ImageGalleryPopup({
    isOpen,
    onClose,
    onSelect,
    currentImage,
    uploadEndpoint = 'http://localhost:5000/api/gallery/upload' // Default endpoint
}: ImageGalleryPopupProps) {
    const [images, setImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(currentImage || null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // Add loading state
    const [uploadProgress, setUploadProgress] = useState(0); // Add progress state
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
    };

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch(`${API_URL}/gallery/images`);
                const data = await response.json();
                setImages(data.images);
            } catch (error) {
                console.error('Failed to fetch images:', error);
            }
        };

        fetchImages();

    }, [images]);
    const handleFiles = async (files: File[]) => {
        setIsUploading(true);

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    // Upload to backend
                    const imageUrl = await uploadToBackend(file);

                    // Add uploaded URL to gallery
                    setImages(prev => [...prev, imageUrl]);
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert(`Failed to upload ${file.name}`);
                }
            }
        }

        setIsUploading(false);
        setUploadProgress(0);
    };

    // New function to upload to backend
    const uploadToBackend = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(uploadEndpoint, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success || !data.url) {
            throw new Error(data.error || "Upload failed");
        }

        // Handle absolute/relative URL
        return data.url.startsWith("http")
            ? data.url
            : `${uploadEndpoint.replace("/api/upload", "")}${data.url}`;
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

    const handleDeleteImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setImages(prev => prev.filter((_, i) => i !== index));
        if (selectedImage === images[index]) {
            setSelectedImage(null);
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
                <div className="gallery-modal-content bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                    Select Image
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Choose from gallery or upload new images
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <X className="w-5 h-5 text-gray-600" />
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
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                                    : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100/50'
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

                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-300 ${isDragging ? 'bg-blue-100 scale-110' : 'bg-white border-2 border-gray-200'
                                }`}>
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                ) : (
                                    <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {isUploading ? 'Uploading...' : isDragging ? 'Drop images here' : 'Upload Images'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {isUploading ? 'Please wait' : 'Drag and drop or click to browse'}
                            </p>

                            {/* Progress Bar */}
                            {isUploading && uploadProgress > 0 && (
                                <div className="max-w-xs mx-auto mt-4">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Uploading...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {!isUploading && (
                                <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>JPG, PNG, GIF up to 10MB</span>
                                </div>
                            )}
                        </div>

                        {/* Gallery Grid */}
                        {images.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Gallery ({images.length})
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        {selectedImage ? '1 selected' : 'Select an image'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {images.map((image, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleImageSelect(image)}
                                            className="gallery-image-item group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                                            style={{
                                                animationDelay: `${index * 0.03}s`,
                                                borderColor: selectedImage === image ? '#3B82F6' : '#E5E7EB',
                                            }}
                                        >
                                            <img
                                                src={API_URL2 + image}
                                                alt={`Gallery ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => handleDeleteImage(index, e)}
                                                    className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </button>
                                            </div>

                                            {/* Selection Indicator */}
                                            {selectedImage === image && (
                                                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg ring-4 ring-white">
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
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                                    <ImageIcon className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No images yet</h3>
                                <p className="text-sm text-gray-500">Upload your first image to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {selectedImage && (
                        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-500">
                                    <img src={API_URL2 + selectedImage} alt="Selected" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Image selected</p>
                                    <p className="text-xs text-gray-500">Ready to use</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
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