"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, animate } from "motion/react";

export function AnimatedCounter({
    value,
    suffix = "",
    prefix = "",
    className,
}: {
    value: number;
    suffix?: string;
    prefix?: string;
    className?: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-40px" });
    const shouldReduceMotion = useReducedMotion();
    const motionValue = useMotionValue(0);

    useEffect(() => {
        if (!isInView) return;
        if (shouldReduceMotion) {
            if (ref.current) ref.current.textContent = `${prefix}${value}${suffix}`;
            return;
        }
        const controls = animate(motionValue, value, {
            duration: 1.4,
            ease: "easeOut",
            onUpdate(latest) {
                if (ref.current) ref.current.textContent = `${prefix}${Math.round(latest)}${suffix}`;
            },
        });
        return () => controls.stop();
    }, [isInView, value, prefix, suffix, shouldReduceMotion, motionValue]);

    return (
        <span ref={ref} className={className}>
            {prefix}0{suffix}
        </span>
    );
}
