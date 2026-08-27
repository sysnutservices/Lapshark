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
        // isInView starts false on every render (including the first, before
        // the observer has measured anything) — with a literal "0" as the
        // resting DOM content, that made every stat render "0-Month",
        // "0-Day", etc. on first paint, SSR, no-JS, and to crawlers, until
        // scroll + a full animation cycle corrected it. The resting content
        // is now the real value (below); this effect only ever animates
        // count-up as a decoration once it's actually in view.
        if (!isInView || shouldReduceMotion) return;
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
            {prefix}{value}{suffix}
        </span>
    );
}
