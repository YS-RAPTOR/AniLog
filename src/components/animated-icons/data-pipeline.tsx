import { motion, useReducedMotion } from "motion/react";

/**
 * Data Transfer Pipeline — Import motif.
 *
 * Simulates a high-tech JSON parsing pipeline. Features a source JSON Document
 * sending data packets across ortholinear bus tracks into a destination System Rack,
 * representing the import/migration of secure credentials.
 */
export function DataPipeline({ boosted }: { boosted: boolean }) {
    const prefersReduced = useReducedMotion();
    const stopped = !!prefersReduced;

    const dataSpeed = boosted ? 1.5 : 2.5;

    // Data bus tracks connecting the document (left) to the system (right)
    const path1 = "M 48 40 C 60 40 60 38 75 38";
    const path2 = "M 48 55 C 60 55 60 57 75 57";
    const path3 = "M 48 70 C 60 70 60 76 75 76";

    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="pipeline-glow" cx="0.5" cy="0.5" r="0.5">
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
            <circle cx="60" cy="60" r="54" fill="url(#pipeline-glow)" />

            {/* Background Matrix/Grid (Static) */}
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

            {/* Data Bus Tracks (Base lines) */}
            <g
                opacity="0.2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={path1} />
                <path d={path2} />
                <path d={path3} />
            </g>

            {/* Moving Data Packets (using animated dashed strokes over the tracks) */}
            <g
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <motion.path
                    d={path1}
                    strokeDasharray="4 24"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [28, 0] }
                    }
                    transition={{
                        duration: dataSpeed,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <motion.path
                    d={path2}
                    strokeDasharray="6 30"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [36, 0] }
                    }
                    transition={{
                        duration: dataSpeed * 1.2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.5,
                    }}
                />
                <motion.path
                    d={path3}
                    strokeDasharray="4 20"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [24, 0] }
                    }
                    transition={{
                        duration: dataSpeed * 0.8,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.2,
                    }}
                />
            </g>

            {/* Source Node: JSON Document (Left side) */}
            <g transform="translate(18, 25)">
                {/* Document Back Glow */}
                <rect
                    x="0"
                    y="0"
                    width="30"
                    height="60"
                    fill="currentColor"
                    opacity="0.05"
                    rx="2"
                />

                {/* Document Outline with folded corner */}
                <path
                    d="M 0 0 L 20 0 L 30 10 L 30 60 L 0 60 Z"
                    fill="currentColor"
                    fillOpacity="0.1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <path
                    d="M 20 0 L 20 10 L 30 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />

                {/* JSON Bracket text shapes inside document */}
                <g stroke="currentColor" strokeWidth="1.5" fill="none">
                    {/* { */}
                    <path d="M 12 25 Q 9 25 9 28 Q 9 30 7 32 Q 9 34 9 36 Q 9 39 12 39" />
                    {/* } */}
                    <path d="M 18 25 Q 21 25 21 28 Q 21 30 23 32 Q 21 34 21 36 Q 21 39 18 39" />
                </g>

                {/* Document Data lines */}
                <line
                    x1="8"
                    y1="46"
                    x2="22"
                    y2="46"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.5"
                />
                <line
                    x1="8"
                    y1="51"
                    x2="18"
                    y2="51"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.5"
                />
            </g>

            {/* Destination Node: Server Rack System (Right side) */}
            <g transform="translate(75, 28)">
                {/* Back glow */}
                <rect
                    x="-2"
                    y="-2"
                    width="34"
                    height="58"
                    fill="currentColor"
                    opacity="0.05"
                    rx="3"
                />

                {/* Individual Rack Units */}
                {[0, 20, 40].map((y) => (
                    <g key={y}>
                        {/* Rack Chassis */}
                        <rect
                            x="0"
                            y={y}
                            width="30"
                            height="14"
                            rx="1.5"
                            fill="currentColor"
                            fillOpacity="0.1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                        {/* Status LED */}
                        <motion.circle
                            cx="6"
                            cy={y + 7}
                            r="1.5"
                            fill="currentColor"
                            animate={
                                stopped ? undefined : { opacity: [0.3, 1, 0.3] }
                            }
                            transition={{
                                duration: Math.random() * 1.5 + 1,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        {/* Ventilation/Drive slots */}
                        <line
                            x1="12"
                            y1={y + 7}
                            x2="24"
                            y2={y + 7}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                            opacity="0.7"
                        />
                    </g>
                ))}
            </g>
        </motion.svg>
    );
}
