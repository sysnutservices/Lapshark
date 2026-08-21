import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonProductCard() {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100 p-4 flex flex-col animate-fade">

            {/* Image */}
            <Skeleton className="w-full h-[180px] rounded-xl md:rounded-2xl" />

            {/* Category + Rating */}
            <div className="flex justify-between items-center mt-4">
                <Skeleton className="w-20 h-5" />
                <Skeleton className="w-10 h-5" />
            </div>

            {/* Title */}
            <Skeleton className="w-4/5 h-[26px] mt-2" />
            <Skeleton className="w-3/5 h-[26px] mt-2" />

            {/* Condition */}
            <Skeleton className="w-[90px] h-[22px] rounded-full mt-3" />

            {/* Price Section */}
            <div className="mt-4 flex justify-between items-center">

                <div className="space-y-1.5">
                    <Skeleton className="w-[60px] h-[18px]" />
                    <Skeleton className="w-[100px] h-[30px]" />
                </div>

                <Skeleton className="w-[45px] h-[45px] rounded-full" />
            </div>
        </div>
    );
}
