// app/page.tsx
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

import Image from 'next/image';
import hero_banner_desktop from '@/assets/hero_banner.png';
import hero_banner_tablet from '@/assets/hero_banner_tab.png';
import hero_banner_mobile from '@/assets/hero_banner_mobile.png';
import Link from "next/link";

export const metadata: Metadata = {
    title: "Laptop Rentals & Services | Lapshark",
    description: "Affordable laptop rentals, doorstep delivery, and premium device services across India.",
    keywords: ["laptop rental", "lapshark", "rent laptop", "device services", "affordable rentals"],
    openGraph: {
        title: "Laptop Rentals & Services | Lapshark",
        description: "Rent laptops at the best prices with Lapshark. Fast delivery, top brands, and reliable service.",
        url: "https://lapshark.com",
        type: "website",
    },
    alternates: {
        canonical: "https://lapshark.com",
    },
};

export default function HomePage() {

    const hero_banner = {
        mobile: hero_banner_mobile,
        tablet: hero_banner_tablet,
        desktop: hero_banner_desktop,
    };

    return (
        <main>
            <div className="space-y-16 md:space-y-24 pb-24 bg-gray-50/50">
                <Link href="/products" className="w-full cursor-pointer">
                    {/* Mobile */}
                    <div className="mb-8">
                        <div className="block md:hidden">
                            <Image
                                src={hero_banner.mobile}
                                alt="Hero Mobile"
                                width={750}
                                height={1334}
                                loading="eager"
                                priority
                                className="w-full h-auto"
                            />
                        </div>

                        {/* Tablet */}
                        <div className="hidden md:block lg:hidden">
                            <Image
                                src={hero_banner.tablet}
                                alt="Hero Tablet"
                                width={1200}
                                height={800}
                                loading="eager"
                                priority
                                className="w-full h-auto"
                            />
                        </div>

                        {/* Desktop */}
                        <div className="hidden lg:block">
                            <Image
                                src={hero_banner.desktop}
                                alt="Hero Desktop"
                                width={1920}
                                loading="eager"
                                priority
                                height={1080}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>

                </Link>
                <HomeClient />
            </div>
        </main>
    );
}
