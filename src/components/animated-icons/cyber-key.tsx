import { motion, useReducedMotion } from "motion/react";

/**
 * Cyber Key — Advanced motif.
 *
 * A high-tech cyber key designed as a secure circuit board diagram.
 * Features data bus tracks feeding into a central cryptographic node,
 * generating a geometric key with data flowing through its teeth.
 */
export function CyberKey({ boosted }: { boosted: boolean }) {
    const prefersReduced = useReducedMotion();
    const stopped = !!prefersReduced;

    const dataSpeed = boosted ? 1.5 : 2.5;
    const pulseSpeed = boosted ? 2 : 3;

    // Outer Key Outline
    const keyOutline = `
        M 12 60
        L 22 44
        L 42 44
        L 48 54
        L 105 54
        L 111 60
        L 105 66
        L 98 66
        L 98 72
        L 92 72
        L 92 66
        L 88 66
        L 88 78
        L 80 78
        L 80 66
        L 74 66
        L 74 74
        L 66 74
        L 66 66
        L 48 66
        L 42 76
        L 22 76
        Z
    `
        .replace(/\s+/g, " ")
        .trim();

    const innerHex = `
        M 22 60
        L 27 51
        L 37 51
        L 42 60
        L 37 69
        L 27 69
        Z
    `
        .replace(/\s+/g, " ")
        .trim();

    const inputTrack1 = "M 0 20 L 16 20 L 32 36 L 32 44";
    const inputTrack2 = "M 0 100 L 16 100 L 32 84 L 32 76";
    const inputTrack3 = "M 0 60 L 12 60";

    const shaftTrack = "M 42 60 L 105 60";
    const pin1 = "M 95 60 L 95 68";
    const pin2 = "M 84 60 L 84 74";
    const pin3 = "M 70 60 L 70 70";

    const nodes = [
        { x: 32, y: 44, size: 3, active: false },
        { x: 32, y: 76, size: 3, active: false },
        { x: 12, y: 60, size: 3, active: false },
        { x: 32, y: 60, size: 6, active: true },
        { x: 95, y: 68, size: 2, active: false },
        { x: 84, y: 74, size: 2, active: false },
        { x: 70, y: 70, size: 2, active: false },
        { x: 105, y: 60, size: 2.5, active: false },
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
                <radialGradient id="cyber-key-glow" cx="0.5" cy="0.5" r="0.5">
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
            <circle cx="60" cy="60" r="54" fill="url(#cyber-key-glow)" />

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

            {/* Distant Data Nodes (Stars) */}
            <g fill="currentColor" opacity="0.4">
                <motion.circle
                    cx="15"
                    cy="25"
                    r="1"
                    animate={
                        stopped ? undefined : { opacity: [0.1, 0.8, 0.1] }
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.circle
                    cx="105"
                    cy="35"
                    r="1"
                    animate={
                        stopped ? undefined : { opacity: [0.1, 0.8, 0.1] }
                    }
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
                    animate={
                        stopped ? undefined : { opacity: [0.1, 0.6, 0.1] }
                    }
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
                    animate={
                        stopped ? undefined : { opacity: [0.1, 0.8, 0.1] }
                    }
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
                    animate={
                        stopped ? undefined : { opacity: [0.1, 0.6, 0.1] }
                    }
                    transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: 0.2,
                    }}
                />
            </g>

            {/* Input Data Tracks (Base lines) */}
            <g
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={inputTrack1} />
                <path d={inputTrack2} />
                <path d={inputTrack3} />
            </g>

            {/* Moving Packets on Input Tracks */}
            <g
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <motion.path
                    d={inputTrack1}
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
                    d={inputTrack2}
                    strokeDasharray="4 80"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [84, 0] }
                    }
                    transition={{
                        duration: dataSpeed,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.5,
                    }}
                />
                <motion.path
                    d={inputTrack3}
                    strokeDasharray="3 30"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [33, 0] }
                    }
                    transition={{
                        duration: dataSpeed * 0.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.2,
                    }}
                />
            </g>

            {/* Main Key Outline Base */}
            <path
                d={keyOutline}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                opacity="0.3"
                fill="none"
            />

            {/* Animated Data Packets along Key Outline */}
            <g
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <motion.path
                    d={keyOutline}
                    strokeDasharray="6 136"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [142, 0] }
                    }
                    transition={{
                        duration: dataSpeed * 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </g>

            {/* Key Inner Core / Hexagon */}
            <path
                d={innerHex}
                fill="currentColor"
                fillOpacity="0.05"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                opacity="0.6"
            />

            {/* Inner Shaft Track & Pins (Base lines) */}
            <g
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
                strokeLinecap="round"
            >
                <path d={shaftTrack} />
                <path d={pin1} />
                <path d={pin2} />
                <path d={pin3} />
            </g>

            {/* Animated Pulses on Inner Shaft */}
            <motion.path
                d={shaftTrack}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4 100"
                animate={stopped ? undefined : { strokeDashoffset: [104, 0] }}
                transition={{
                    duration: dataSpeed * 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

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

            {/* Tiny accent details */}
            <g fill="currentColor" opacity="0.5">
                <rect x="52" y="58" width="4" height="4" rx="1" />
                <rect x="62" y="58" width="4" height="4" rx="1" />
            </g>
        </motion.svg>
    );
}
