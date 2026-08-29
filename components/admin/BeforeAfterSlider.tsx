import React, { useState } from 'react';

// Native <input type="range"> + CSS clip-path over two stacked <img>s — no
// dependency needed for a draggable before/after comparison (Phase 27/31).
interface BeforeAfterSliderProps {
    beforeUrl: string;
    afterUrl: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, beforeLabel = 'Original', afterLabel = 'Processed' }: BeforeAfterSliderProps) {
    const [position, setPosition] = useState(50);

    return (
        <div className="space-y-2">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={beforeUrl} alt={beforeLabel} className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={afterUrl} alt={afterLabel} className="absolute inset-0 w-full h-full object-contain" />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${position}%` }} />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{beforeLabel}</span>
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{afterLabel}</span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full"
            />
        </div>
    );
}
