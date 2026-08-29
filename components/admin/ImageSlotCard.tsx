import React from 'react';
import { GripVertical, Star, Undo2 } from 'lucide-react';

// One approved-image grid card: primary radio + native HTML5 drag reorder.
// No dnd library — draggable/onDragOver/onDrop is a well-known ~10-line
// pattern, not worth a dependency for.
interface ImageSlotCardProps {
    thumbnailUrl: string;
    isPrimary: boolean;
    onSetPrimary: () => void;
    onReturnToReview: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
}

export default function ImageSlotCard({ thumbnailUrl, isPrimary, onSetPrimary, onReturnToReview, onDragStart, onDragOver, onDrop }: ImageSlotCardProps) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative border rounded-lg overflow-hidden bg-white cursor-move ${isPrimary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
        >
            <div className="absolute top-1 left-1 bg-black/50 rounded p-0.5">
                <GripVertical className="w-3.5 h-3.5 text-white" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl} alt="" className="w-full aspect-square object-contain bg-gray-50" />
            <div className="p-2 flex items-center justify-between gap-1">
                <button
                    type="button"
                    onClick={onSetPrimary}
                    title="Set as primary image"
                    className={`flex items-center gap-1 text-xs font-medium ${isPrimary ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Star className="w-3.5 h-3.5" fill={isPrimary ? 'currentColor' : 'none'} />
                    {isPrimary ? 'Primary' : 'Set primary'}
                </button>
                <button type="button" onClick={onReturnToReview} title="Return to review" className="text-gray-400 hover:text-gray-600">
                    <Undo2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
