"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import Autoplay from "embla-carousel-autoplay";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface HeroSlide {
    href?: string;
    imageDesktop: string;
    imageTablet: string;
    imageMobile: string;
}

interface HeroData {
    title?: string;
    subtitle?: string;
    image?: string;
    imageDesktop?: string;
    imageMobile?: string;
    imageTablet?: string;
    slides?: HeroSlide[];
}

// Left as the raw masters deliberately. Pre-sizing these through ImageKit
// (?tr=w-1200,f-webp) shrank the source from 385KB to 119KB but measured WORSE
// end to end — LCP 3.3s -> 3.8s, perf 91 -> 86 — because the transform adds a
// generation round-trip to Next's server-side fetch and the webp->avif double
// encode gives back the savings. Don't re-apply without re-measuring.
// TODO: replace these with real campaign banner URLs as needed.
const HERO_SLIDES = [
    {
        href: "/products?category=Gaming+Laptops",
        imageDesktop: "https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/v2-desktop.png?updatedAt=1785603666143",
        imageTablet: "https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/v2-mob.png?updatedAt=1785603666357",
        imageMobile: "https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/v2-mob.png?updatedAt=1785603666357",
    },
    {
        href: "/products",
        imageDesktop: "https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/v1-desktop.png?updatedAt=1785603666164",
        imageTablet: "https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/v1-mob.png?updatedAt=1785603666359",
        imageMobile: "https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/v1-mob.png?updatedAt=1785603666359",
    },
];

export default function HeroSection({ hero }: { hero?: HeroData }) {
    const shouldReduceMotion = useReducedMotion();

    // Site Editor > Hero Section lets admins set banners from the dashboard;
    // use those when configured, and only fall back to the hardcoded campaign
    // slides above when the admin hasn't picked anything yet.
    const configuredDesktop = hero?.imageDesktop || hero?.image;
    const configuredTablet = hero?.imageTablet || hero?.imageMobile || hero?.image;
    const configuredMobile = hero?.imageMobile || hero?.imageTablet || hero?.image;
    const legacySlide = configuredDesktop
        ? [{
            href: "/products",
            imageDesktop: configuredDesktop,
            imageTablet: configuredTablet || configuredDesktop,
            imageMobile: configuredMobile || configuredDesktop,
        }]
        : [];
    // Backfill any device image an admin left blank on a given slide, so a
    // slide never renders an Image with an empty src.
    const configuredSlides = hero?.slides?.length
        ? hero.slides.map((slide) => ({
            href: slide.href,
            imageDesktop: slide.imageDesktop || slide.imageTablet || slide.imageMobile,
            imageTablet: slide.imageTablet || slide.imageMobile || slide.imageDesktop,
            imageMobile: slide.imageMobile || slide.imageTablet || slide.imageDesktop,
        }))
        : [];
    const slides = configuredSlides.length ? configuredSlides : legacySlide.length ? legacySlide : HERO_SLIDES;

    return (
        <section className="relative w-full">
            {/* Visually hidden but crawlable â€” keeps a real H1 on the page for SEO */}
            <h1 className="sr-only">
                {hero?.title || "Premium Refurbished Laptops â€” Lapshark"}
            </h1>
            {hero?.subtitle && <p className="sr-only">{hero.subtitle}</p>}

            <Carousel
                opts={{ loop: true }}
                plugins={shouldReduceMotion ? [] : [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: false })]}
                className="group w-full"
            >
                <CarouselContent className="ml-0">
                    {slides.map((slide, i) => (
                        <CarouselItem key={i} className="pl-0">
                            <Link href={slide.href || "/products"} className="block w-full cursor-pointer">
                                {/* Mobile */}
                                <div className="relative aspect-square block w-full md:hidden">
                                    <Image
                                        src={slide.imageMobile}
                                        alt={`Lapshark laptop sale banner ${i + 1}`}
                                        fill
                                        sizes="100vw"
                                        priority={i === 0}
                                        fetchPriority={i === 0 ? "high" : undefined}
                                        className="object-cover"
                                    />
                                </div>

                                {/* Tablet */}
                                <div className="relative aspect-square hidden w-full md:block lg:hidden">
                                    <Image
                                        src={slide.imageTablet}
                                        alt={`Lapshark laptop sale banner ${i + 1}`}
                                        fill
                                        sizes="100vw"
                                        priority={i === 0}
                                        fetchPriority={i === 0 ? "high" : undefined}
                                        className="object-cover"
                                    />
                                </div>

                                {/* Desktop */}
                                <div className="relative hidden aspect-3/1 w-full lg:block">
                                    <Image
                                        src={slide.imageDesktop}
                                        alt={`Lapshark laptop sale banner ${i + 1}`}
                                        fill
                                        // Desktop viewports only, so don't let mobile
                                        // request a full-width variant of a banner it
                                        // never displays.
                                        sizes="(max-width: 1023px) 1px, 100vw"
                                        priority={i === 0}
                                        fetchPriority={i === 0 ? "high" : undefined}
                                        className="object-cover"
                                    />
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {slides.length > 1 && (
                    <>
                        <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                )}
            </Carousel>
        </section>
    );
}
