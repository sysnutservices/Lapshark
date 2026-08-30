"use client";

import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { WhatsAppCTA } from "@/components/ecommerce/WhatsAppCTA";
import {
    USE_CASES, BUDGET_RANGES, PERFORMANCE_TIERS,
    recommendProducts, UseCase, BudgetRange, PerformanceTier,
} from "@/lib/product-recommendation";
import { trackEvent } from "@/lib/analytics";

type Step = "usecase" | "budget" | "performance" | "results";

function OptionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-colors"
        >
            {children}
        </button>
    );
}

export function LaptopFinder({ products }: { products: Product[] }) {
    const [step, setStep] = useState<Step>("usecase");
    const [useCase, setUseCase] = useState<UseCase | null>(null);
    const [budget, setBudget] = useState<BudgetRange | null>(null);
    const [performanceTier, setPerformanceTier] = useState<PerformanceTier | undefined>(undefined);
    const [results, setResults] = useState<Product[]>([]);

    const selectUseCase = (uc: UseCase) => {
        trackEvent("laptop_recommendation_started", { entryPoint: "homepage_finder" });
        setUseCase(uc);
        setStep("budget");
    };

    const selectBudget = (b: BudgetRange) => {
        setBudget(b);
        setStep("performance");
    };

    const finish = (tier?: PerformanceTier) => {
        if (!useCase || !budget) return;
        setPerformanceTier(tier);
        const matches = recommendProducts(products, { useCase, budget, performanceTier: tier });
        setResults(matches);
        trackEvent("laptop_recommendation_completed", {
            useCase, budget, performanceTier: tier, resultCount: matches.length,
        });
        setStep("results");
    };

    const reset = () => {
        setUseCase(null); setBudget(null); setPerformanceTier(undefined); setResults([]);
        setStep("usecase");
    };

    const useCaseLabel = USE_CASES.find((u) => u.value === useCase)?.label;
    const budgetLabel = BUDGET_RANGES.find((b) => b.value === budget)?.label;

    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 md:p-10 shadow-sm max-w-3xl mx-auto">
            {step !== "usecase" && step !== "results" && (
                <button
                    onClick={() => setStep(step === "budget" ? "usecase" : "budget")}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
            )}

            {step === "usecase" && (
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1">What will you use your laptop for?</h3>
                    <p className="text-sm text-slate-500 mb-5">Step 1 of 3</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {USE_CASES.map((uc) => (
                            <OptionButton key={uc.value} onClick={() => selectUseCase(uc.value)}>
                                <uc.icon className="inline-block w-4 h-4 mr-2 -mt-0.5" strokeWidth={1.75} aria-hidden />{uc.label}
                            </OptionButton>
                        ))}
                    </div>
                </div>
            )}

            {step === "budget" && (
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1">What is your budget?</h3>
                    <p className="text-sm text-slate-500 mb-5">Step 2 of 3</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {BUDGET_RANGES.map((b) => (
                            <OptionButton key={b.value} onClick={() => selectBudget(b.value)}>{b.label}</OptionButton>
                        ))}
                    </div>
                </div>
            )}

            {step === "performance" && (
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Performance preference?</h3>
                    <p className="text-sm text-slate-500 mb-5">Step 3 of 3 — optional</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PERFORMANCE_TIERS.map((t) => (
                            <OptionButton key={t.value} onClick={() => finish(t.value)}>{t.label}</OptionButton>
                        ))}
                    </div>
                    <button onClick={() => finish(undefined)} className="mt-4 text-sm font-bold text-teal-600 hover:text-teal-700">
                        Skip — show me everything in this budget
                    </button>
                </div>
            )}

            {step === "results" && (
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900">
                                Recommended for {useCaseLabel}
                            </h3>
                            <p className="text-sm text-slate-500">{budgetLabel}{performanceTier ? ` • ${PERFORMANCE_TIERS.find(t => t.value === performanceTier)?.label}` : ""}</p>
                        </div>
                        <Button variant="ghost" onClick={reset} className="h-auto gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500">
                            <RotateCcw className="w-3.5 h-3.5" /> Start Over
                        </Button>
                    </div>

                    {results.length === 0 ? (
                        <p className="text-sm text-slate-500 mb-6">
                            We don't have an exact match in stock right now for that combination — talk to an
                            expert and we'll help you find the closest fit.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                            {results.map((p) => (
                                <ProductCard key={p._id || p.id} product={p} />
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-500 flex-1">Not sure? Talk to an expert.</p>
                        <WhatsAppCTA
                            location="recommendation_result"
                            extraMessage={`Hi Lapshark, I used the laptop finder — looking for a ${useCaseLabel} laptop, budget ${budgetLabel}${performanceTier ? `, ${performanceTier} performance` : ""}. Can you help me choose?`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
