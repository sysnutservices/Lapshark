// Reserves roughly the same height as the real HomeClient sections so the
// client-fetched product/category data swapping in doesn't cause a large CLS jump.
const SECTIONS = [
    { mobile: 316, desktop: 130 },
    { mobile: 146, desktop: 138 },
    { mobile: 248, desktop: 204 },
    { mobile: 455, desktop: 244 },
    { mobile: 2051, desktop: 1250 },
    { mobile: 782, desktop: 360 },
    { mobile: 709, desktop: 306 },
    { mobile: 525, desktop: 694 },
    { mobile: 1060, desktop: 663 },
    { mobile: 613, desktop: 750 },
    { mobile: 522, desktop: 546 },
    { mobile: 285, desktop: 305 },
    { mobile: 88, desktop: 120 },
    { mobile: 356, desktop: 286 },
];

export function HomeSkeleton() {
    return (
        <div className="space-y-12 md:space-y-16 pb-16 bg-slate-50/50" aria-hidden="true">
            {SECTIONS.map((s, i) => (
                <div key={i} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="block w-full animate-pulse rounded-2xl bg-slate-200/70 md:hidden"
                        style={{ height: s.mobile }}
                    />
                    <div
                        className="hidden w-full animate-pulse rounded-2xl bg-slate-200/70 md:block"
                        style={{ height: s.desktop }}
                    />
                </div>
            ))}
        </div>
    );
}
