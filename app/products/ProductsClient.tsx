"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useUserFeatures } from "@/context/UserFeatureContext";
import { ProductCard } from "@/components/ProductCard";
import { Category } from "@/types";
import {
    Filter,
    ChevronDown,
    ChevronUp,
    X,
    Check,
    Search,
    SlidersHorizontal,
    RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

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

const CheckboxItem: React.FC<{
    label: string;
    selected: boolean;
    onChange: () => void;
}> = ({ label, selected, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer group py-2 hover:bg-gray-50 px-2 rounded-lg -mx-2 transition-all">
        <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${selected
                ? "bg-blue-600 border-blue-600 shadow-sm scale-105"
                : "border-gray-300 bg-white group-hover:border-blue-400"
                }`}
        >
            {selected && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
        </div>
        <input
            type="checkbox"
            className="hidden"
            checked={selected}
            onChange={onChange}
        />
        <span
            className={`text-sm ${selected
                ? "text-gray-900 font-bold"
                : "text-gray-600 group-hover:text-gray-900 font-medium"
                }`}
        >
            {label}
        </span>
    </label>
);

const FilterAccordion: React.FC<{
    title: string;
    activeCount?: number;
    children: React.ReactNode;
    onClear?: () => void;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, activeCount, children, onClear, isOpen, onToggle }) => {
    return (
        <div className="border-b border-gray-100 last:border-0 py-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full group select-none"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {title}
                    </h3>
                    {activeCount && activeCount > 0 ? (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {activeCount}
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    {activeCount && activeCount > 0 && onClear && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wide mr-1 cursor-pointer"
                        >
                            Reset
                        </span>
                    )}
                    <div
                        className={`p-1 rounded-full transition-all ${isOpen ? "bg-gray-100 text-gray-900" : "text-gray-400"
                            }`}
                    >
                        {isOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                        )}
                    </div>
                </div>
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
                    }`}
            >
                {children}
            </div>
        </div>
    );
};

export default function ShopClient({
    initialCategory,
}: {
    initialCategory: string;
}) {
    const { products } = useStore();
    const { compareList } = useUserFeatures();
    const router = useRouter();

    // State
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [priceRange, setPriceRange] = useState<number>(300000);
    const [sortBy, setSortBy] = useState<string>("featured");
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >({
        Category: true,
        "Price Range": true,
        "Laptop Brand": true,
        "RAM Size": false,
        Processor: false,
        Storage: false,
        "Display Size": false,
    });

    // New Filters State
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedRam, setSelectedRam] = useState<string[]>([]);
    const [selectedProcessor, setSelectedProcessor] = useState<string[]>([]);
    const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
    const [selectedDisplay, setSelectedDisplay] = useState<string[]>([]);

    // Update category when prop changes
    useEffect(() => {
        setSelectedCategory(initialCategory);
    }, [initialCategory]);

    // Toggle Helper
    const toggleFilter = (
        list: string[],
        setList: React.Dispatch<React.SetStateAction<string[]>>,
        value: string
    ) => {
        if (list.includes(value)) {
            setList(list.filter((item) => item !== value));
        } else {
            setList([...list, value]);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Filter Logic
    const filteredProducts = products
        .filter((product) => {
            // 1. Category
            const matchCategory =
                selectedCategory === "All" || product.category === selectedCategory;

            // 2. Price
            const matchPrice = product.finalPrice <= priceRange;

            // 3. Brand
            const matchBrand =
                selectedBrands.length === 0 || selectedBrands.includes(product.brand);

            // 4. Specs Matching (Partial text match for flexibility)
            const matchRam =
                selectedRam.length === 0 ||
                selectedRam.some((r) => product?.specs?.ram?.includes(r));


            // Normalize processor matching (e.g. "i7" matches "Intel Core i7-1365U")
            const matchProcessor =
                selectedProcessor.length === 0 ||
                selectedProcessor.some((p) => {
                    const processor = product?.specs?.processor?.toLowerCase() || "";

                    if (!processor) return false; // product doesn't have processor field

                    const normalized = p.toLowerCase();

                    if (normalized.includes("intel")) {
                        const key = normalized.split(" ")[2]?.toLowerCase(); // "i5", "i7", ...
                        return key ? processor.includes(key) : false;
                    }

                    if (normalized.includes("apple")) {
                        return processor.includes("m1") || processor.includes("m2") || processor.includes("m3");
                    }

                    if (normalized.includes("amd")) {
                        const key = normalized.split(" ")[2]?.toLowerCase(); // "5", "7", ...
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
            return 0; // featured (default)
        });

    const clearAllFilters = () => {
        setSelectedCategory("All");
        setPriceRange(300000);
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
        selectedDisplay.length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-6 border-b border-gray-200 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span
                            onClick={() => router.push("/")}
                            className="hover:text-gray-900 cursor-pointer transition-colors"
                        >
                            Home
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 font-bold">Laptops</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Shop Premium Laptops
                    </h1>
                </div>
                <div className="flex items-center w-full md:w-auto gap-3">

                    {/* Mobile Filters Button */}
                    <button
                        className="md:hidden flex-1 flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white font-bold hover:bg-gray-50 active:scale-95 transition-all"
                        onClick={() => setIsMobileFiltersOpen(true)}
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2" /> <span className="text-sm">Filters</span>
                        {totalActiveFilters > 0 && (
                            <span className="ml-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {totalActiveFilters}
                            </span>
                        )}
                    </button>

                    {/* Sort Dropdown */}
                    <div className="w-full md:w-[200px]">
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            displayEmpty
                            fullWidth
                            sx={{
                                background: "white",
                                borderRadius: "12px",
                                fontWeight: 600,
                                fontSize: "14px",
                                color: "#374151",
                                height: "44px",
                                "& .MuiSelect-select": {
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0 14px",
                                    height: "44px",
                                },
                                "& fieldset": {
                                    borderColor: "#e5e7eb",
                                },
                                "&:hover fieldset": {
                                    borderColor: "#d1d5db",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#3b82f6",
                                    borderWidth: "2px",
                                },
                            }}
                        >
                            <MenuItem value={"featured"}>Recommended</MenuItem>
                            <MenuItem value={"price_asc"}>Price: Low to High</MenuItem>
                            <MenuItem value={"price_desc"}>Price: High to Low</MenuItem>
                            <MenuItem value={"rating"}>Top Rated</MenuItem>
                        </Select>
                    </div>
                </div>

            </div>

            <div className="flex flex-col md:flex-row gap-8 relative items-start">
                {/* Mobile Overlay - CRITICAL FOR MOBILE */}
                <div
                    className={`
            fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden
            ${isMobileFiltersOpen
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                        }
          `}
                    onClick={() => setIsMobileFiltersOpen(false)}
                />

                {/* Sidebar Filters */}
                <aside
                    className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl 
            transition-transform duration-300 ease-in-out 
            md:sticky md:top-24 md:w-72 md:bg-transparent md:shadow-none 
            flex flex-col md:z-10
            ${isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
          `}
                    style={{
                        height:
                            typeof window !== "undefined" && window.innerWidth >= 768
                                ? `calc(100vh - 8rem)`
                                : "100%",
                        overflowY: "auto",
                    }}
                >
                    {/* Desktop Container Wrapper */}
                    <div className="md:bg-white md:rounded-2xl md:border md:border-gray-200 md:shadow-sm h-full flex flex-col overflow-hidden">
                        {/* Mobile Header */}
                        <div className="flex justify-between items-center p-5 border-b md:hidden bg-white">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5" /> Filters
                            </h2>
                            <button
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                                <span className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-900" /> Filters
                                </span>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-[11px] bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3 h-3" /> Clear All
                                </button>
                            </div>

                            <div className="space-y-1">
                                {/* Categories - Radio Style */}
                                <FilterAccordion
                                    title="Category"
                                    isOpen={expandedSections["Category"]}
                                    onToggle={() => toggleSection("Category")}
                                >
                                    <div className="space-y-1">
                                        <label className="flex items-center space-x-3 cursor-pointer group py-2 hover:bg-gray-50 px-2 rounded-lg -mx-2 transition-all">
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedCategory === "All"
                                                    ? "border-gray-900 bg-white"
                                                    : "border-gray-300 bg-gray-50"
                                                    }`}
                                            >
                                                {selectedCategory === "All" && (
                                                    <div className="w-2 h-2 rounded-full bg-gray-900" />
                                                )}
                                            </div>
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={selectedCategory === "All"}
                                                onChange={() => setSelectedCategory("All")}
                                                className="hidden"
                                            />
                                            <span
                                                className={`text-sm ${selectedCategory === "All"
                                                    ? "text-gray-900 font-bold"
                                                    : "text-gray-600 font-medium"
                                                    }`}
                                            >
                                                All Categories
                                            </span>
                                        </label>
                                        {Object.values(Category).map((cat) => (
                                            <label
                                                key={cat}
                                                className="flex items-center space-x-3 cursor-pointer group py-2 hover:bg-gray-50 px-2 rounded-lg -mx-2 transition-all"
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedCategory === cat
                                                        ? "border-blue-600 bg-white"
                                                        : "border-gray-300 bg-gray-50"
                                                        }`}
                                                >
                                                    {selectedCategory === cat && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                    )}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    checked={selectedCategory === cat}
                                                    onChange={() => setSelectedCategory(cat)}
                                                    className="hidden"
                                                />
                                                <span
                                                    className={`text-sm ${selectedCategory === cat
                                                        ? "text-gray-900 font-bold"
                                                        : "text-gray-600 font-medium"
                                                        }`}
                                                >
                                                    {cat}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </FilterAccordion>

                                {/* Price Range */}
                                <FilterAccordion
                                    title="Price Range"
                                    isOpen={expandedSections["Price Range"]}
                                    onToggle={() => toggleSection("Price Range")}
                                >
                                    <div className="px-1 pt-2 pb-4">
                                        <div className="flex items-center justify-between mb-4 gap-3">
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-1/2">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
                                                    Min
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    ₹0
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-1/2">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
                                                    Max
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    ₹{priceRange.toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="300000"
                                            step="5000"
                                            value={priceRange}
                                            onChange={(e) => setPriceRange(Number(e.target.value))}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 hover:accent-gray-900"
                                        />
                                    </div>
                                </FilterAccordion>

                                {/* Brand */}
                                <FilterAccordion
                                    title="Laptop Brand"
                                    activeCount={selectedBrands.length}
                                    onClear={() => setSelectedBrands([])}
                                    isOpen={expandedSections["Laptop Brand"]}
                                    onToggle={() => toggleSection("Laptop Brand")}
                                >
                                    <div className="space-y-0.5">
                                        {FILTER_OPTIONS.brands.map((brand) => (
                                            <CheckboxItem
                                                key={brand}
                                                label={brand}
                                                selected={selectedBrands.includes(brand)}
                                                onChange={() =>
                                                    toggleFilter(selectedBrands, setSelectedBrands, brand)
                                                }
                                            />
                                        ))}
                                    </div>
                                </FilterAccordion>

                                {/* Processor */}
                                <FilterAccordion
                                    title="Processor"
                                    activeCount={selectedProcessor.length}
                                    onClear={() => setSelectedProcessor([])}
                                    isOpen={expandedSections["Processor"]}
                                    onToggle={() => toggleSection("Processor")}
                                >
                                    <div className="space-y-0.5">
                                        {FILTER_OPTIONS.processors.map((proc) => (
                                            <CheckboxItem
                                                key={proc}
                                                label={proc}
                                                selected={selectedProcessor.includes(proc)}
                                                onChange={() =>
                                                    toggleFilter(
                                                        selectedProcessor,
                                                        setSelectedProcessor,
                                                        proc
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </FilterAccordion>

                                {/* RAM */}
                                <FilterAccordion
                                    title="RAM Size"
                                    activeCount={selectedRam.length}
                                    onClear={() => setSelectedRam([])}
                                    isOpen={expandedSections["RAM Size"]}
                                    onToggle={() => toggleSection("RAM Size")}
                                >
                                    <div className="space-y-0.5">
                                        {FILTER_OPTIONS.ram.map((ram) => (
                                            <CheckboxItem
                                                key={ram}
                                                label={ram}
                                                selected={selectedRam.includes(ram)}
                                                onChange={() =>
                                                    toggleFilter(selectedRam, setSelectedRam, ram)
                                                }
                                            />
                                        ))}
                                    </div>
                                </FilterAccordion>

                                {/* Storage */}
                                <FilterAccordion
                                    title="Storage"
                                    activeCount={selectedStorage.length}
                                    onClear={() => setSelectedStorage([])}
                                    isOpen={expandedSections["Storage"]}
                                    onToggle={() => toggleSection("Storage")}
                                >
                                    <div className="space-y-0.5">
                                        {FILTER_OPTIONS.storage.map((storage) => (
                                            <CheckboxItem
                                                key={storage}
                                                label={storage}
                                                selected={selectedStorage.includes(storage)}
                                                onChange={() =>
                                                    toggleFilter(
                                                        selectedStorage,
                                                        setSelectedStorage,
                                                        storage
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </FilterAccordion>

                                {/* Display */}
                                <FilterAccordion
                                    title="Display Size"
                                    activeCount={selectedDisplay.length}
                                    onClear={() => setSelectedDisplay([])}
                                    isOpen={expandedSections["Display Size"]}
                                    onToggle={() => toggleSection("Display Size")}
                                >
                                    <div className="space-y-0.5">
                                        {FILTER_OPTIONS.display.map((display) => (
                                            <CheckboxItem
                                                key={display}
                                                label={display}
                                                selected={selectedDisplay.includes(display)}
                                                onChange={() =>
                                                    toggleFilter(
                                                        selectedDisplay,
                                                        setSelectedDisplay,
                                                        display
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </FilterAccordion>

                                {/* Bottom spacer for sticky bar */}
                                <div className="h-10"></div>
                            </div>
                        </div>

                        {/* Mobile Footer Actions */}
                        <div className="p-4 border-t bg-white md:hidden sticky bottom-0">
                            <button
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                            >
                                Show {filteredProducts.length} Results
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="flex-1 w-full">
                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center h-96 flex flex-col items-center justify-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6 animate-pulse">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                No matching laptops found
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                We couldn't find any products matching your current filters. Try
                                adjusting your price range or categories.
                            </p>
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                                Clear All Filters
                            </button>
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
        </div>
    );
}