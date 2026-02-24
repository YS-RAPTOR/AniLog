import { motion, useReducedMotion } from "motion/react";
import type { ComponentType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Compass } from "./compass";
import { Gear } from "./gear";
import { Clipboard } from "./clipboard";
import { Copy } from "./copy";
import { Reveal } from "./reveal";
import { GuidedConstellation } from "./guided-constellation";
import { CyberKey } from "./cyber-key";
import { DataPipeline } from "./data-pipeline";

const routeIcons = {
    compass: Compass,
    gear: Gear,
    clipboard: Clipboard,
    guidedConstellation: GuidedConstellation,
    cyberKey: CyberKey,
    dataPipeline: DataPipeline,
} as const satisfies Record<string, ComponentType<{ boosted: boolean }>>;

export type AnimationType = keyof typeof routeIcons;

export const AnimatedRouteIcons = routeIcons;

export const AnimatedButtonIcons = {
    Copy,
    Reveal,
};

const animatedRouteIconVariants = cva(
    "pointer-events-none select-none text-foreground flex items-center justify-center",
    {
        variants: {
            variant: {
                card: "absolute inset-0 z-0 opacity-[0.15] group-hover:opacity-30 transition-opacity duration-500 p-3 md:p-4",
                standalone: "relative h-full w-full opacity-80",
            },
        },
        defaultVariants: {
            variant: "card",
        },
    },
);

type AnimatedRouteIconProps = VariantProps<typeof animatedRouteIconVariants> & {
    type: AnimationType;
    boosted: boolean;
    className?: string;
};

export function AnimatedRouteIcon({
    type,
    boosted,
    variant = "card",
    className,
}: AnimatedRouteIconProps) {
    const prefersReduced = useReducedMotion();
    const Icon = AnimatedRouteIcons[type];

    return (
        <motion.div
            className={cn(animatedRouteIconVariants({ variant }), className)}
            animate={{
                scale:
                    prefersReduced
                        ? 1
                        : boosted
                          ? 1.04
                          : 1,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-hidden="true"
        >
            <div className="h-full w-full max-h-full max-w-full aspect-square">
                <Icon boosted={boosted} />
            </div>
        </motion.div>
    );
}
