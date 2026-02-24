import { motion, useReducedMotion } from "motion/react";

/**
 * Guided Constellation Path — Beginner motif.
 *
 * A high-tech constellation map representing a guided step-by-step journey.
 * Features a starfield grid, connected data nodes, and orbiting data packets
 * flowing smoothly through a defined path from start to finish.
 */
export function GuidedConstellation({ boosted }: { boosted: boolean }) {
    const prefersReduced = useReducedMotion();
    const stopped = !!prefersReduced;

    const dataSpeed = boosted ? 2.5 : 4;
    const pulseSpeed = boosted ? 2 : 3;

    // Main step-by-step path
    const mainPath = "M 20 100 L 45 80 L 40 45 L 75 40 L 100 20";

    const nodes = [
        { x: 20, y: 100, size: 4, active: true },
        { x: 45, y: 80, size: 5, active: true },
        { x: 40, y: 45, size: 5, active: true },
        { x: 75, y: 40, size: 6, active: true },
        { x: 100, y: 20, size: 7, active: true },
        // Decorative background nodes
        { x: 25, y: 40, size: 2, active: false },
        { x: 80, y: 80, size: 3, active: false },
        { x: 60, y: 25, size: 2, active: false },
        { x: 95, y: 65, size: 2, active: false },
        { x: 30, y: 20, size: 2, active: false },
        { x: 60, y: 105, size: 1.5, active: false },
    ];

    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
            aria-hidden="true"
        >
            <defs>
                <radialGradient
                    id="constellation-glow"
                    cx="0.5"
                    cy="0.5"
                    r="0.5"
                >
                    <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="0.25"
                    />
                    <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0"
                    />
                </radialGradient>
            </defs>

            {/* Background Core Glow */}
            <circle cx="60" cy="60" r="54" fill="url(#constellation-glow)" />

            {/* Background Grid (Static) */}
            <g opacity="0.1">
                {Array.from({ length: 12 }).map((_, i) => (
                    <line
                        key={`v-${i}`}
                        x1={i * 10}
                        y1="0"
                        x2={i * 10}
                        y2="120"
                        stroke="currentColor"
                        strokeWidth="0.5"
                    />
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                    <line
                        key={`h-${i}`}
                        x1="0"
                        y1={i * 10}
                        x2="120"
                        y2={i * 10}
                        stroke="currentColor"
                        strokeWidth="0.5"
                    />
                ))}
            </g>

            {/* Distant Stars */}
            <g fill="currentColor" opacity="0.4">
                <motion.circle
                    cx="15"
                    cy="25"
                    r="1"
                    animate={stopped ? undefined : { opacity: [0.1, 0.8, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.circle
                    cx="105"
                    cy="35"
                    r="1"
                    animate={stopped ? undefined : { opacity: [0.1, 0.8, 0.1] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: 0.5,
                    }}
                />
                <motion.circle
                    cx="85"
                    cy="100"
                    r="1.5"
                    animate={stopped ? undefined : { opacity: [0.1, 0.6, 0.1] }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: 1,
                    }}
                />
                <motion.circle
                    cx="35"
                    cy="110"
                    r="1"
                    animate={stopped ? undefined : { opacity: [0.1, 0.8, 0.1] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 1.5,
                    }}
                />
                <motion.circle
                    cx="110"
                    cy="80"
                    r="1"
                    animate={stopped ? undefined : { opacity: [0.1, 0.6, 0.1] }}
                    transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: 0.2,
                    }}
                />
            </g>

            {/* Internal Background Connections */}
            <g
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.15"
                strokeDasharray="2 4"
            >
                <line x1="25" y1="40" x2="40" y2="45" />
                <line x1="25" y1="40" x2="30" y2="20" />
                <line x1="80" y1="80" x2="75" y2="40" />
                <line x1="80" y1="80" x2="95" y2="65" />
                <line x1="60" y1="25" x2="75" y2="40" />
                <line x1="60" y1="25" x2="40" y2="45" />
                <line x1="45" y1="80" x2="80" y2="80" />
                <line x1="20" y1="100" x2="60" y2="105" />
                <line x1="60" y1="105" x2="80" y2="80" />
            </g>

            {/* Main Guided Path Track */}
            <path
                d={mainPath}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                opacity="0.3"
                fill="none"
            />

            {/* Animated Data Packets along Main Path */}
            <g
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
            >
                <motion.path
                    d={mainPath}
                    strokeDasharray="4 80"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [84, 0] }
                    }
                    transition={{
                        duration: dataSpeed,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <motion.path
                    d={mainPath}
                    strokeDasharray="4 80"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [84, 0] }
                    }
                    transition={{
                        duration: dataSpeed,
                        repeat: Infinity,
                        ease: "linear",
                        delay: dataSpeed / 2,
                    }}
                />
            </g>

            {/* Nodes */}
            {nodes.map((node, i) => (
                <g key={`node-${i}`}>
                    {/* Node Halo for active nodes */}
                    {node.active && (
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size + 4}
                            fill="currentColor"
                            opacity="0.1"
                            animate={
                                stopped
                                    ? undefined
                                    : {
                                          scale: [1, 1.3, 1],
                                          opacity: [0.1, 0.25, 0.1],
                                      }
                            }
                            transition={{
                                duration: pulseSpeed,
                                repeat: Infinity,
                                delay: i * 0.3,
                            }}
                        />
                    )}
                    {/* Outer Ring */}
                    <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill="var(--background, #000)"
                        stroke="currentColor"
                        strokeWidth={node.active ? 1.5 : 1}
                        opacity={node.active ? 1 : 0.5}
                    />
                    {/* Inner Core */}
                    <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.active ? node.size / 2 : node.size / 2.5}
                        fill="currentColor"
                        opacity={node.active ? 1 : 0.5}
                    />
                </g>
            ))}
        </motion.svg>
    );
}
