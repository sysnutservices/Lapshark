import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Loader2, Check, X, RefreshCw, AlertCircle, Camera, ZoomIn, Trash2, Layers } from 'lucide-react';
import { api } from '@/api/api';
import { ensureUploadableImage } from '@/lib/convertHeic';
import BeforeAfterSlider from './BeforeAfterSlider';
import ImageSettingsPanel, { ImageSettings } from './ImageSettingsPanel';
import ImageSlotCard from './ImageSlotCard';

// The AI Ecommerce Images workflow: upload original -> pick view type ->
// "Create Ecommerce Image" -> review -> approve -> publish. Background
// removal is local segmentation (never touches product pixels — see
// processingModel on each version), not a generative model. Only mounted in
// edit mode (a real productId is required — Approve/Publish/Reorder are
// inherently product-scoped). The create-new-product modal's Main Image/
// Gallery boxes use a separate, simpler endpoint (productController.
// processImage) that skips versioning/review since no product exists yet to
// attach a ProductImage history to.

const VIEW_TYPES: { value: string; label: string }[] = [
    { value: 'open_front', label: 'Open Front' },
    { value: 'open_angle', label: 'Open Angle' },
    { value: 'closed_top', label: 'Closed Top' },
    { value: 'closed_angle', label: 'Closed Angle' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left_side', label: 'Left Side' },
    { value: 'right_side', label: 'Right Side' },
    { value: 'ports', label: 'Ports' },
    { value: 'detail', label: 'Detail' },
    { value: 'custom', label: 'Custom' },
];

interface Version {
    id: string;
    viewType: string;
    status: string;
    version: number;
    isActive: boolean;
    isApproved: boolean;
    isPublished: boolean;
    transparentMasterUrl?: string | null;
    masterImageUrl: string | null;
    productImageUrl: string | null;
    thumbnailImageUrl: string | null;
    processingModel: string | null;
    processingSettings: ImageSettings | null;
    rejectionReason?: string;
    qualityWarning?: string | null;
    occupancyPercent?: number | null;
    estimatedCost: number | null;
    estimatedCostIsApproximate: boolean;
}

interface Slot {
    rootImageId: string;
    legacy: boolean;
    originalImageUrl: string | null;
    isPrimary: boolean;
    sortOrder: number;
    versions: Version[];
}

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function activeVersion(slot: Slot): Version | undefined {
    return slot.versions.find((v) => v.isActive) ?? slot.versions[0];
}

export default function ProductImageWorkflow({ productId }: { productId: string }) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [processingSlotId, setProcessingSlotId] = useState<string | null>(null);
    const [viewTypeBySlot, setViewTypeBySlot] = useState<Record<string, string>>({});
    const [modeBySlot, setModeBySlot] = useState<Record<string, 'catalogue_safe' | 'ai_edit'>>({});
    const [brightnessModeBySlot, setBrightnessModeBySlot] = useState<Record<string, 'auto' | 'original'>>({});
    const [reflectionModeBySlot, setReflectionModeBySlot] = useState<Record<string, 'off' | 'auto' | 'on'>>({});
    const [settingsBySlot, setSettingsBySlot] = useState<Record<string, ImageSettings>>({});
    const [error, setError] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [zoom, setZoom] = useState<{ url: string; checkerboard: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const settingsDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const dragIndex = useRef<number | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`/products/${productId}/images`, { headers: authHeaders() })
            .then((res) => setSlots(res.data.slots))
            .catch(() => setError("Couldn't load product images"))
            .finally(() => setLoading(false));
    }, [productId]);

    useEffect(() => { load(); }, [load]);

    // Selecting a file only saves the original — no OpenAI call happens here
    // (Phase 21/25A #2).
    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const uploadable = await ensureUploadableImage(file);
            const form = new FormData();
            form.append('image', uploadable);
            const res = await api.post(`/products/${productId}/images/upload-original`, form, { headers: authHeaders() });
            setSlots((prev) => [...prev, { ...res.data.image, versions: [] }]);
        } catch {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    // Shared by "Create Ecommerce Image" and "Reprocess" — one explicit
    // button click, never triggered automatically (Phase 25A #6/#8).
    const handleProcess = async (slot: Slot) => {
        setProcessingSlotId(slot.rootImageId);
        setError(null);
        try {
            const viewType = viewTypeBySlot[slot.rootImageId] ?? activeVersion(slot)?.viewType ?? 'custom';
            const mode = modeBySlot[slot.rootImageId] ?? 'catalogue_safe';
            const brightnessMode = brightnessModeBySlot[slot.rootImageId] ?? 'auto';
            const reflectionMode = reflectionModeBySlot[slot.rootImageId] ?? 'auto';
            await api.post(`/products/images/${slot.rootImageId}/process`, { viewType, mode, brightnessMode, reflectionMode, settings: settingsBySlot[slot.rootImageId] }, { headers: authHeaders() });
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Image processing failed');
        } finally {
            setProcessingSlotId(null);
        }
    };

    // Sharp-only recompute — debounced, never calls OpenAI (Phase 25A #4/#6).
    const handleSettingsChange = (slot: Slot, versionId: string, settings: ImageSettings) => {
        setSettingsBySlot((prev) => ({ ...prev, [slot.rootImageId]: settings }));
        const key = versionId;
        if (settingsDebounce.current[key]) clearTimeout(settingsDebounce.current[key]);
        settingsDebounce.current[key] = setTimeout(async () => {
            try {
                const res = await api.patch(`/products/images/versions/${versionId}/settings`, { settings }, { headers: authHeaders() });
                setSlots((prev) => prev.map((s) => s.rootImageId !== slot.rootImageId ? s : {
                    ...s,
                    versions: s.versions.map((v) => v.id !== versionId ? v : {
                        ...v,
                        transparentMasterUrl: res.data.image.transparentUrl,
                        masterImageUrl: res.data.image.masterUrl,
                        productImageUrl: res.data.image.processedUrl,
                        thumbnailImageUrl: res.data.image.thumbnailUrl,
                        qualityWarning: res.data.image.qualityWarning,
                        occupancyPercent: res.data.image.occupancyPercent,
                    }),
                }));
            } catch {
                // Live preview failure isn't fatal — the last successful render stays visible.
            }
        }, 300);
    };

    const handleApprove = async (versionId: string) => {
        await api.post(`/products/images/versions/${versionId}/approve`, {}, { headers: authHeaders() });
        load();
    };
    const handleReject = async (versionId: string) => {
        await api.post(`/products/images/versions/${versionId}/reject`, {}, { headers: authHeaders() });
        load();
    };
    const handleReturnToReview = async (versionId: string) => {
        await api.post(`/products/images/versions/${versionId}/return-to-review`, {}, { headers: authHeaders() });
        load();
    };

    const handleDeleteSlot = async (slot: Slot) => {
        if (!window.confirm('Delete this image and all its AI versions? This cannot be undone.')) return;
        setError(null);
        try {
            await api.delete(`/products/images/${slot.rootImageId}`, { headers: authHeaders() });
            setSlots((prev) => prev.filter((s) => s.rootImageId !== slot.rootImageId));
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete image');
        }
    };

    // Removes one bad AI attempt without touching the original or other
    // versions under the same slot — for "reprocess again, but I don't want
    // to keep looking at this one."
    const handleDeleteVersion = async (slot: Slot, versionId: string) => {
        if (!window.confirm("Delete this generated image? This cannot be undone.")) return;
        setError(null);
        try {
            await api.delete(`/products/images/versions/${versionId}`, { headers: authHeaders() });
            setSlots((prev) => prev.map((s) => s.rootImageId !== slot.rootImageId ? s : {
                ...s,
                versions: s.versions.filter((v) => v.id !== versionId),
            }));
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete image');
        }
    };

    const approvedSlots = slots.filter((s) => activeVersion(s)?.status === 'APPROVED' || activeVersion(s)?.status === 'PUBLISHED');

    const handleDrop = async (targetIndex: number) => {
        const from = dragIndex.current;
        dragIndex.current = null;
        if (from === null || from === targetIndex) return;
        const reordered = [...approvedSlots];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(targetIndex, 0, moved);
        await api.patch(`/products/${productId}/images/reorder`, {
            order: reordered.map((s, i) => ({ rootImageId: s.rootImageId, sortOrder: i })),
        }, { headers: authHeaders() });
        load();
    };

    const handleSetPrimary = async (rootImageId: string) => {
        await api.patch(`/products/${productId}/images/reorder`, {
            order: approvedSlots.map((s) => ({ rootImageId: s.rootImageId, sortOrder: s.sortOrder, isPrimary: s.rootImageId === rootImageId })),
        }, { headers: authHeaders() });
        load();
    };

    const handlePublish = async () => {
        setPublishing(true);
        setError(null);
        try {
            await api.post(`/products/${productId}/images/publish`, {}, { headers: authHeaders() });
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Publish failed');
        } finally {
            setPublishing(false);
        }
    };

    if (loading) return <div className="text-sm text-gray-400 py-6">Loading images...</div>;

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => {
                    const version = activeVersion(slot);
                    const isProcessing = processingSlotId === slot.rootImageId;
                    return (
                        <div key={slot.rootImageId} className="relative border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                            {!slot.legacy && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot)}
                                    title="Delete this image"
                                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 p-1.5 rounded-full border border-gray-200"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {slot.legacy ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={version?.thumbnailImageUrl ?? ''} alt="" className="w-full aspect-square object-contain bg-gray-50 rounded-lg" />
                                    <p className="text-xs text-gray-400">Existing image — upload a new original to enable AI editing.</p>
                                </>
                            ) : (
                                <>
                                    {version?.status === 'READY_FOR_REVIEW' || version?.status === 'APPROVED' || version?.status === 'PUBLISHED' ? (
                                        <div className="relative">
                                            <BeforeAfterSlider beforeUrl={slot.originalImageUrl!} afterUrl={version.productImageUrl!} />
                                            <button
                                                type="button"
                                                onClick={() => setZoom({ url: version.masterImageUrl!, checkerboard: false })}
                                                title="Inspect at full size — check screen, keyboard, trackpad, logos, ports"
                                                className="absolute bottom-10 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full"
                                            >
                                                <ZoomIn className="w-3.5 h-3.5" />
                                            </button>
                                            {version.transparentMasterUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoom({ url: version.transparentMasterUrl!, checkerboard: true })}
                                                    title="View the transparent cutout"
                                                    className="absolute bottom-10 right-10 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full"
                                                >
                                                    <Layers className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={slot.originalImageUrl!} alt="" className="w-full aspect-square object-contain bg-gray-50 rounded-lg" />
                                    )}

                                    <select
                                        value={viewTypeBySlot[slot.rootImageId] ?? version?.viewType ?? 'custom'}
                                        onChange={(e) => setViewTypeBySlot((prev) => ({ ...prev, [slot.rootImageId]: e.target.value }))}
                                        disabled={isProcessing}
                                        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm"
                                    >
                                        {VIEW_TYPES.map((vt) => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                                    </select>

                                    <select
                                        value={modeBySlot[slot.rootImageId] ?? 'catalogue_safe'}
                                        onChange={(e) => setModeBySlot((prev) => ({ ...prev, [slot.rootImageId]: e.target.value as 'catalogue_safe' | 'ai_edit' }))}
                                        disabled={isProcessing}
                                        title="Catalogue Safe never touches product pixels (real segmentation of the original photo). AI Edit lets OpenAI edit the background first — it can alter the product, and always needs closer review."
                                        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm"
                                    >
                                        <option value="catalogue_safe">Catalogue Safe (recommended)</option>
                                        <option value="ai_edit">AI Edit (experimental)</option>
                                    </select>

                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={brightnessModeBySlot[slot.rootImageId] ?? 'auto'}
                                            onChange={(e) => setBrightnessModeBySlot((prev) => ({ ...prev, [slot.rootImageId]: e.target.value as 'auto' | 'original' }))}
                                            disabled={isProcessing}
                                            title="Auto applies a small, capped brightness/contrast correction only when the photo actually needs it. Original skips this entirely. To set a value yourself, use the Brightness/Contrast sliders below after processing."
                                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs"
                                        >
                                            <option value="auto">Brightness: Auto</option>
                                            <option value="original">Brightness: Original</option>
                                        </select>
                                        <select
                                            value={reflectionModeBySlot[slot.rootImageId] ?? 'auto'}
                                            onChange={(e) => setReflectionModeBySlot((prev) => ({ ...prev, [slot.rootImageId]: e.target.value as 'off' | 'auto' | 'on' }))}
                                            disabled={isProcessing}
                                            title="Auto only flags possible glare for your review, no pixels change. On also asks OpenAI to reduce the glare (Catalogue Safe mode only, one extra API call) and flags it if the correction touched too much. Off skips glare detection entirely."
                                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs"
                                        >
                                            <option value="off">Reflections: Off</option>
                                            <option value="auto">Reflections: Auto</option>
                                            <option value="on">Reflections: On</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleProcess(slot)}
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-md"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        {version ? 'Reprocess' : 'Create Ecommerce Image'}
                                    </button>

                                    {version && (version.status === 'READY_FOR_REVIEW' || version.status === 'APPROVED') && (
                                        <>
                                            <ImageSettingsPanel
                                                settings={settingsBySlot[slot.rootImageId] ?? version.processingSettings ?? {}}
                                                onChange={(s) => handleSettingsChange(slot, version.id, s)}
                                            />
                                            {version.status === 'READY_FOR_REVIEW' ? (
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => handleApprove(version.id)} className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-md">
                                                        <Check className="w-4 h-4" /> Approve
                                                    </button>
                                                    <button type="button" onClick={() => handleReject(version.id)} className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-md">
                                                        <X className="w-4 h-4" /> Reject
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteVersion(slot, version.id)} title="Delete this attempt" className="flex items-center justify-center bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 px-3 rounded-md">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-green-600 font-medium">Approved</span>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" onClick={() => handleReturnToReview(version.id)} className="text-gray-400 hover:text-gray-600 underline">Return to review</button>
                                                        <button type="button" onClick={() => handleDeleteVersion(slot, version.id)} title="Delete this attempt" className="text-gray-400 hover:text-red-600">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {version?.status === 'REJECTED' && (
                                        <p className="text-xs text-red-500 flex items-center justify-between gap-2">
                                            <span>Rejected{version.rejectionReason ? `: ${version.rejectionReason}` : ''}</span>
                                            <button type="button" onClick={() => handleDeleteVersion(slot, version.id)} className="underline flex-shrink-0">Delete</button>
                                        </p>
                                    )}
                                    {version?.status === 'PROCESSING_FAILED' && (
                                        <p className="text-xs text-red-500 flex items-center justify-between gap-2">
                                            <span>Processing failed{version.rejectionReason ? `: ${version.rejectionReason}` : ''}. You can try again.</span>
                                            <button type="button" onClick={() => handleDeleteVersion(slot, version.id)} className="underline flex-shrink-0">Delete</button>
                                        </p>
                                    )}
                                    {version?.qualityWarning && version.status !== 'PROCESSING_FAILED' && (
                                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            Needs a closer look: {version.qualityWarning}
                                        </p>
                                    )}
                                    {typeof version?.occupancyPercent === 'number' && version.status !== 'PROCESSING_FAILED' && (
                                        <p className="text-xs text-gray-400">
                                            Product occupancy: {version.occupancyPercent}% · Background: #FFFFFF · 2000×2000
                                            {version.processingModel === 'local-segmentation' && ' · Catalogue Safe'}
                                            {version.processingModel === 'gpt-image-2+local-segmentation' && ' · AI Edit'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 py-10 text-gray-400 hover:border-gray-300 hover:text-gray-500 disabled:opacity-60"
                >
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    <span className="text-sm font-medium">Add Image</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            </div>

            {approvedSlots.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Approved Images (drag to reorder)</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {approvedSlots.map((slot, i) => {
                            const v = activeVersion(slot)!;
                            return (
                                <ImageSlotCard
                                    key={slot.rootImageId}
                                    thumbnailUrl={v.thumbnailImageUrl!}
                                    isPrimary={slot.isPrimary}
                                    onSetPrimary={() => handleSetPrimary(slot.rootImageId)}
                                    onReturnToReview={() => handleReturnToReview(v.id)}
                                    onDragStart={() => { dragIndex.current = i; }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(i)}
                                />
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishing}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md"
                    >
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        Publish to Storefront
                    </button>
                </div>
            )}

            {zoom && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto"
                    onClick={() => setZoom(null)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={zoom.url}
                        alt="Full size"
                        className="max-w-none"
                        style={zoom.checkerboard ? {
                            imageRendering: 'auto',
                            backgroundImage: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)',
                            backgroundSize: '20px 20px',
                        } : { imageRendering: 'auto' }}
                    />
                    <button
                        type="button"
                        onClick={() => setZoom(null)}
                        className="fixed top-4 right-4 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
