import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Basic settings always visible; Advanced collapsed by default (Phase 30 —
// "do not overwhelm the user"). Every change here is Sharp-only — the parent
// debounces these into a settings-only PATCH, never an OpenAI call
// (Phase 25A #4/#6).
export interface ImageSettings {
    scale?: number;
    position?: 'center' | 'center-top' | 'center-bottom' | 'left' | 'right';
    brightness?: number;
    contrast?: number;
    shadow?: boolean;
    saturation?: number;
    sharpen?: boolean;
    xOffset?: number;
    yOffset?: number;
    shadowOpacity?: number;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    outputFormat?: 'webp' | 'jpeg' | 'png';
    quality?: number;
}

interface ImageSettingsPanelProps {
    settings: ImageSettings;
    onChange: (settings: ImageSettings) => void;
}

const POSITIONS: { value: NonNullable<ImageSettings['position']>; label: string }[] = [
    { value: 'center', label: 'Center' },
    { value: 'center-top', label: 'Top' },
    { value: 'center-bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
];

export default function ImageSettingsPanel({ settings, onChange }: ImageSettingsPanelProps) {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const set = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => onChange({ ...settings, [key]: value });

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Size ({Math.round((settings.scale ?? 0.85) * 100)}%)</label>
                <input type="range" min={0.3} max={1} step={0.01} value={settings.scale ?? 0.85} onChange={(e) => set('scale', Number(e.target.value))} className="w-full" />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                <div className="flex flex-wrap gap-2">
                    {POSITIONS.map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => set('position', p.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${(settings.position ?? 'center') === p.value ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Brightness ({(settings.brightness ?? 1).toFixed(2)})</label>
                <input type="range" min={0.5} max={1.5} step={0.01} value={settings.brightness ?? 1} onChange={(e) => set('brightness', Number(e.target.value))} className="w-full" />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contrast ({(settings.contrast ?? 1).toFixed(2)})</label>
                <input type="range" min={0.5} max={1.5} step={0.01} value={settings.contrast ?? 1} onChange={(e) => set('contrast', Number(e.target.value))} className="w-full" />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={settings.shadow ?? false} onChange={(e) => set('shadow', e.target.checked)} />
                Shadow
            </label>

            <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
                {advancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Advanced Settings
            </button>

            {advancedOpen && (
                <div className="space-y-4 pl-1 border-l-2 border-gray-100 ml-1">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Saturation ({(settings.saturation ?? 1).toFixed(2)})</label>
                        <input type="range" min={0} max={2} step={0.01} value={settings.saturation ?? 1} onChange={(e) => set('saturation', Number(e.target.value))} className="w-full" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings.sharpen ?? true} onChange={(e) => set('sharpen', e.target.checked)} />
                        Sharpen
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">X Offset</label>
                            <input type="number" value={settings.xOffset ?? 0} onChange={(e) => set('xOffset', Number(e.target.value))} className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Y Offset</label>
                            <input type="number" value={settings.yOffset ?? 0} onChange={(e) => set('yOffset', Number(e.target.value))} className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm" />
                        </div>
                    </div>
                    {settings.shadow && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Shadow Opacity</label>
                                <input type="range" min={0} max={1} step={0.01} value={settings.shadowOpacity ?? 0.35} onChange={(e) => set('shadowOpacity', Number(e.target.value))} className="w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Shadow Blur</label>
                                <input type="range" min={0} max={200} step={1} value={settings.shadowBlur ?? 40} onChange={(e) => set('shadowBlur', Number(e.target.value))} className="w-full" />
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Output Format</label>
                        <select value={settings.outputFormat ?? 'webp'} onChange={(e) => set('outputFormat', e.target.value as ImageSettings['outputFormat'])} className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm">
                            <option value="webp">WebP</option>
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quality ({settings.quality ?? 92})</label>
                        <input type="range" min={1} max={100} step={1} value={settings.quality ?? 92} onChange={(e) => set('quality', Number(e.target.value))} className="w-full" />
                    </div>
                </div>
            )}
        </div>
    );
}
