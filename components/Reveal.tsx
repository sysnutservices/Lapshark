"use client";

import * as motion from "motion/react-m";
import { useReducedMotion, type HTMLMotionProps } from "motion/react";

interface RevealProps extends HTMLMotionProps<"div"> {
    delay?: number;
    y?: number;
}

export function Reveal({ children, delay = 0, y = 28, ...props }: RevealProps) {
    const shouldReduceMotion = useReducedMotion();
    const offset = shouldReduceMotion ? 0 : y;

    return (
        <motion.div
            initial={{ opacity: 0, y: offset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: "easeOut" }}
            {...props}
        >
            {children}
        </motion.div>
    );
}
