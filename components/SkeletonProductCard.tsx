"use client";

import Skeleton from "@mui/material/Skeleton";

export default function SkeletonProductCard() {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 p-4 flex flex-col animate-fade">

            {/* Image */}
            <Skeleton
                variant="rectangular"
                width="100%"
                height={180}
                className="rounded-xl md:rounded-2xl"
            />

            {/* Category + Rating */}
            <div className="flex justify-between items-center mt-4">
                <Skeleton variant="text" width={80} height={20} />
                <Skeleton variant="text" width={40} height={20} />
            </div>

            {/* Title */}
            <Skeleton variant="text" width="80%" height={26} />
            <Skeleton variant="text" width="60%" height={26} />

            {/* Condition */}
            <Skeleton
                variant="rounded"
                width={90}
                height={22}
                className="mt-3"
            />

            {/* Price Section */}
            <div className="mt-4 flex justify-between items-center">

                <div>
                    <Skeleton variant="text" width={60} height={18} />
                    <Skeleton variant="text" width={100} height={30} />
                </div>

                <Skeleton
                    variant="circular"
                    width={45}
                    height={45}
                />
            </div>
        </div>
    );
}
