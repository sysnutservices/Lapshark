"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useUserFeatures } from "@/context/UserFeatureContext";
import { ProductCard } from "@/components/ProductCard";
import { Category } from "@/types";
import { Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const FILTER_OPTIONS = {
    brands: [
        "Apple",
        "Dell",
        "Lenovo",
        "HP",
        "Asus",
        "Microsoft",
        "MSI",
        "Razer",
        "LG",
    ],
    ram: ["8GB", "16GB", "32GB", "64GB"],
    processors: [
        "Intel Core i5",
        "Intel Core i7",
        "Intel Core i9",
        "Apple M2",
        "Apple M3",
        "AMD Ryzen 5",
        "AMD Ryzen 7",
        "AMD Ryzen 9",
    ],
    storage: ["256GB", "512GB", "1TB", "2TB"],
    display: ["13-inch", "14-inch", "15-inch", "16-inch", "17-inch", "18-inch"],
};

const MAX_PRICE = 300000;

function CheckboxRow({
    label,
    checked,
    onCheckedChange,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: () => void;
}) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group py-1.5 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors">
            <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
            <span
                className={`text-sm ${checked ? "text-slate-900 font-bold" : "text-slate-600 group-hover:text-slate-900 font-medium"
                    }`}
            >
                {label}
            </span>
        </label>
    );
}

function FilterSectionLabel({ title, count }: { title: string; count?: number }) {
    return (
        <span className="flex items-center gap-2">
            {title}
            {!!count && (
                <Badge className="rounded-full bg-teal-100 px-1.5 text-[10px] font-extrabold text-teal-700 hover:bg-teal-100">
                    {count}
                </Badge>
            )}
        </span>
    );
}

export default function ShopClient({
    initialCategory,
    initialPriceRange,
    initialProducts = [],
}: {
    initialCategory: string;
    initialPriceRange: number;
    initialProducts?: any[];
}) {
    const { products: storeProducts } = useStore();
    // Server-rendered catalogue until the store hydrates, so the grid is never
    // empty in the initial HTML.
    const products = storeProducts.length ? storeProducts : initialProducts;

    // Quoted in the intro copy; derived so it never goes stale as stock changes.
    const lowestPrice = products.reduce(
        (min: number, p: any) => (p?.finalPrice > 0 && p.finalPrice < min ? p.finalPrice : min),
        Infinity
    );
    const router = useRouter();

    // State
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, initialPriceRange]);
    const [sortBy, setSortBy] = useState<string>("featured");
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Filters state
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedRam, setSelectedRam] = useState<string[]>([]);
    const [selectedProcessor, setSelectedProcessor] = useState<string[]>([]);
    const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
    const [selectedDisplay, setSelectedDisplay] = useState<string[]>([]);

    useEffect(() => {
        setSelectedCategory(initialCategory);
    }, [initialCategory]);

    useEffect(() => {
        setPriceRange([0, initialPriceRange]);
    }, [initialPriceRange]);

    const toggleFilter = (
        list: string[],
        setList: React.Dispatch<React.SetStateAction<string[]>>,
        value: string
    ) => {
        setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    };

    // Filter Logic
    const filteredProducts = products
        .filter((product) => {
            const matchCategory =
                selectedCategory === "All" || product.category === selectedCategory;

            const matchPrice =
                product.finalPrice >= priceRange[0] && product.finalPrice <= priceRange[1];

            const matchBrand =
                selectedBrands.length === 0 || selectedBrands.includes(product.brand);

            const matchRam =
                selectedRam.length === 0 ||
                selectedRam.some((r) => product?.specs?.ram?.includes(r));

            // Normalize processor matching (e.g. "i7" matches "Intel Core i7-1365U")
            const matchProcessor =
                selectedProcessor.length === 0 ||
                selectedProcessor.some((p) => {
                    const processor = product?.specs?.processor?.toLowerCase() || "";
                    if (!processor) return false;

                    const normalized = p.toLowerCase();

                    if (normalized.includes("intel")) {
                        const key = normalized.split(" ")[2]?.toLowerCase();
                        return key ? processor.includes(key) : false;
                    }
                    if (normalized.includes("apple")) {
                        return processor.includes("m1") || processor.includes("m2") || processor.includes("m3");
                    }
                    if (normalized.includes("amd")) {
                        const key = normalized.split(" ")[2]?.toLowerCase();
                        return key ? processor.includes(key) : false;
                    }
                    return false;
                });

            const matchStorage =
                selectedStorage.length === 0 ||
                selectedStorage.some((s) => product?.specs?.storage?.includes(s));

            const matchDisplay =
                selectedDisplay.length === 0 ||
                selectedDisplay.some((d) => {
                    const size = parseInt(d);
                    const productSize = parseFloat(product?.specs?.display || "0");
                    return productSize >= size && productSize < size + 1;
                });

            return (
                matchCategory &&
                matchPrice &&
                matchBrand &&
                matchRam &&
                matchProcessor &&
                matchStorage &&
                matchDisplay
            );
        })
        .sort((a, b) => {
            if (sortBy === "price_asc") return a.finalPrice - b.finalPrice;
            if (sortBy === "price_desc") return b.finalPrice - a.finalPrice;
            if (sortBy === "rating") return b.rating - a.rating;
            return 0;
        });

    const clearAllFilters = () => {
        setSelectedCategory("All");
        setPriceRange([0, MAX_PRICE]);
        setSelectedBrands([]);
        setSelectedRam([]);
        setSelectedProcessor([]);
        setSelectedStorage([]);
        setSelectedDisplay([]);
    };

    const totalActiveFilters =
        selectedBrands.length +
        selectedRam.length +
        selectedProcessor.length +
        selectedStorage.length +
        selectedDisplay.length +
        (priceRange[1] < MAX_PRICE || priceRange[0] > 0 ? 1 : 0);

    const FilterPanel = (
        <>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-900" /> Filters
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-auto gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                    <RotateCcw className="w-3 h-3" /> Clear All
                </Button>
            </div>

            <Accordion
                multiple
                defaultValue={["category", "price", "brand"]}
                className="space-y-0"
            >
                <AccordionItem value="category">
                    <AccordionTrigger>Category</AccordionTrigger>
                    <AccordionContent>
                        <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                            <label className="flex items-center gap-3 cursor-pointer py-1.5">
                                <RadioGroupItem value="All" />
                                <span className={`text-sm ${selectedCategory === "All" ? "text-slate-900 font-bold" : "text-slate-600 font-medium"}`}>
                                    All Categories
                                </span>
                            </label>
                            {Object.values(Category).map((cat) => (
                                <label key={cat} className="flex items-center gap-3 cursor-pointer py-1.5">
                                    <RadioGroupItem value={cat} />
                                    <span className={`text-sm ${selectedCategory === cat ? "text-slate-900 font-bold" : "text-slate-600 font-medium"}`}>
                                        {cat}
                                    </span>
                                </label>
                            ))}
                        </RadioGroup>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price">
                    <AccordionTrigger>Price Range</AccordionTrigger>
                    <AccordionContent>
                        <div className="pt-1 pb-3">
                            <div className="flex items-center justify-between mb-5 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-1/2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Min</span>
                                    <span className="text-sm font-bold text-slate-900">₹{priceRange[0].toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-1/2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Max</span>
                                    <span className="text-sm font-bold text-slate-900">₹{priceRange[1].toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <Slider
                                min={0}
                                max={MAX_PRICE}
                                step={5000}
                                value={priceRange}
                                onValueChange={(v) => setPriceRange(v as [number, number])}
                                className="px-1"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="brand">
                    <AccordionTrigger>
                        <FilterSectionLabel title="Laptop Brand" count={selectedBrands.length} />
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-0.5">
                            {FILTER_OPTIONS.brands.map((brand) => (
                                <CheckboxRow
                                    key={brand}
                                    label={brand}
                                    checked={selectedBrands.includes(brand)}
                                    onCheckedChange={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="processor">
                    <AccordionTrigger>
                        <FilterSectionLabel title="Processor" count={selectedProcessor.length} />
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-0.5">
                            {FILTER_OPTIONS.processors.map((proc) => (
                                <CheckboxRow
                                    key={proc}
                                    label={proc}
                                    checked={selectedProcessor.includes(proc)}
                                    onCheckedChange={() => toggleFilter(selectedProcessor, setSelectedProcessor, proc)}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ram">
                    <AccordionTrigger>
                        <FilterSectionLabel title="RAM Size" count={selectedRam.length} />
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-0.5">
                            {FILTER_OPTIONS.ram.map((ram) => (
                                <CheckboxRow
                                    key={ram}
                                    label={ram}
                                    checked={selectedRam.includes(ram)}
                                    onCheckedChange={() => toggleFilter(selectedRam, setSelectedRam, ram)}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="storage">
                    <AccordionTrigger>
                        <FilterSectionLabel title="Storage" count={selectedStorage.length} />
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-0.5">
                            {FILTER_OPTIONS.storage.map((storage) => (
                                <CheckboxRow
                                    key={storage}
                                    label={storage}
                                    checked={selectedStorage.includes(storage)}
                                    onCheckedChange={() => toggleFilter(selectedStorage, setSelectedStorage, storage)}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="display">
                    <AccordionTrigger>
                        <FilterSectionLabel title="Display Size" count={selectedDisplay.length} />
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-0.5">
                            {FILTER_OPTIONS.display.map((display) => (
                                <CheckboxRow
                                    key={display}
                                    label={display}
                                    checked={selectedDisplay.includes(display)}
                                    onCheckedChange={() => toggleFilter(selectedDisplay, setSelectedDisplay, display)}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-6 border-b border-slate-200 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <span
                            onClick={() => router.push("/")}
                            className="hover:text-slate-900 cursor-pointer transition-colors"
                        >
                            Home
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-900 font-bold">Laptops</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Refurbished &amp; Second Hand Laptops in India
                    </h1>
                    {/* Crawlable prose: the grid alone gives Google and AI engines
                        nothing to quote. Names both terms buyers actually search,
                        and explains the difference rather than just stuffing them. */}
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                        Every machine here is ex-corporate stock from Dell, HP and Lenovo —
                        business-grade laptops built for daily use, then quality-checked
                        through our 40-point inspection.
                        {Number.isFinite(lowestPrice) &&
                            ` Prices start at ₹${lowestPrice.toLocaleString("en-IN")}.`}{" "}
                        All come with a 1-year warranty, doorstep delivery across India, and
                        a 14-day return window with free pickup.
                    </p>
                </div>
                <div className="flex items-center w-full md:w-auto gap-3">
                    {/* Mobile Filters Trigger */}
                    <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                        <SheetTrigger
                            render={
                                <Button
                                    variant="outline"
                                    className="md:hidden h-auto flex-1 justify-center gap-2 rounded-xl border-slate-200 bg-white px-4 py-2 font-bold text-slate-700"
                                />
                            }
                        >
                            <SlidersHorizontal className="w-4 h-4" /> Filters
                            {totalActiveFilters > 0 && (
                                <Badge className="rounded-full bg-slate-900 px-1.5 text-[10px] font-bold hover:bg-slate-900">
                                    {totalActiveFilters}
                                </Badge>
                            )}
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85%] p-0">
                            <SheetHeader className="border-b border-slate-100">
                                <SheetTitle className="flex items-center gap-2 text-lg">
                                    <SlidersHorizontal className="w-5 h-5" /> Filters
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto px-4">{FilterPanel}</div>
                            <SheetFooter className="border-t border-slate-100">
                                <Button
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                    className="h-auto w-full rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg shadow-teal-200 hover:bg-teal-700"
                                >
                                    Show {filteredProducts.length} Results
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    {/* Sort Dropdown */}
                    <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                        <SelectTrigger className="h-auto w-full min-w-[180px] rounded-xl border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 md:w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="featured">Recommended</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="rating">Top Rated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block md:sticky md:top-24 md:w-72 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        {FilterPanel}
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="flex-1 w-full">
                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center h-96 flex flex-col items-center justify-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-6">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                No matching laptops found
                            </h3>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                                We couldn't find any products matching your current filters. Try
                                adjusting your price range or categories.
                            </p>
                            <Button
                                onClick={clearAllFilters}
                                variant="secondary"
                                className="h-auto rounded-xl bg-teal-50 px-6 py-3 text-sm font-bold text-teal-700 hover:bg-teal-100"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
                            {filteredProducts.map((p) => (
                                <ProductCard
                                    key={p.id || p._id || p.productId || Math.random()}
                                    product={p}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Crawlable, out of the primary viewport: still same-page prose for
                "second hand laptops" (outsearches "refurbished" 49.5k vs 40.5k/mo
                in India), just moved below the grid instead of pushing it down. */}
            <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate-500">
                People often call these second hand laptops, and the stock is the
                same — the difference is what happens before it reaches you. A used
                laptop is resold as-is. Ours is tested, repaired where needed, and
                sold with a warranty behind it.
            </p>
        </div>
    );
}
