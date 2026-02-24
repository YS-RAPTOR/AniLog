import { motion, useReducedMotion } from "motion/react";

export function Clipboard({ boosted }: { boosted: boolean }) {
    const prefersReduced = useReducedMotion();
    const stopped = !!prefersReduced;

    const ringDuration = boosted ? 12 : 24;
    const pulseDuration = boosted ? 2 : 4;

    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="clipboard-glow" cx="0.5" cy="0.5" r="0.5">
                    <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="0.4"
                    />
                    <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0"
                    />
                </radialGradient>
                <clipPath id="clipboard-clip">
                    <rect x="36" y="30" width="48" height="64" rx="4" />
                </clipPath>
            </defs>

            <g transform="translate(60 60) scale(1.35) translate(-60 -60)">
                {/* Background Glow */}
                <circle cx="60" cy="60" r="50" fill="url(#clipboard-glow)" />

                {/* Outer dotted area representing pasting zone */}
                <motion.rect
                    x="26"
                    y="18"
                    width="68"
                    height="84"
                    rx="6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                    opacity="0.35"
                    animate={
                        stopped ? undefined : { strokeDashoffset: [0, -20] }
                    }
                    transition={{
                        duration: ringDuration / 2,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />

                {/* Clipboard Board */}
                <rect
                    x="36"
                    y="30"
                    width="48"
                    height="64"
                    rx="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="currentColor"
                    fillOpacity="0.05"
                />

                {/* Clipboard Clip */}
                <path
                    d="M 50 26 C 50 24 52 22 54 22 L 66 22 C 68 22 70 24 70 26 L 70 34 L 50 34 Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="currentColor"
                    fillOpacity="0.15"
                    strokeLinejoin="round"
                />
                <line
                    x1="56"
                    y1="28"
                    x2="64"
                    y2="28"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.8"
                />

                {/* JSON Content inside Clipboard */}
                <g clipPath="url(#clipboard-clip)">
                    {/* Left Brace { */}
                    <path
                        d="M 48 44 Q 44 44 44 48 Q 44 51 42 53 Q 44 55 44 58 Q 44 62 48 62"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                        fill="none"
                    />

                    {/* Inner JSON structure dots/lines */}
                    <circle
                        cx="52"
                        cy="48"
                        r="1.5"
                        fill="currentColor"
                        opacity="0.5"
                    />
                    <line
                        x1="56"
                        y1="48"
                        x2="70"
                        y2="48"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.4"
                    />

                    <circle
                        cx="52"
                        cy="53"
                        r="1.5"
                        fill="currentColor"
                        opacity="0.5"
                    />
                    <line
                        x1="56"
                        y1="53"
                        x2="64"
                        y2="53"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.4"
                    />

                    <circle
                        cx="52"
                        cy="58"
                        r="1.5"
                        fill="currentColor"
                        opacity="0.5"
                    />
                    <line
                        x1="56"
                        y1="58"
                        x2="68"
                        y2="58"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.4"
                    />

                    {/* Right Brace } */}
                    <path
                        d="M 72 66 Q 76 66 76 70 Q 76 73 78 75 Q 76 77 76 80 Q 76 84 72 84"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                        fill="none"
                    />

                    <circle
                        cx="68"
                        cy="70"
                        r="1.5"
                        fill="currentColor"
                        opacity="0.5"
                    />
                    <line
                        x1="50"
                        y1="70"
                        x2="64"
                        y2="70"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.4"
                    />

                    <circle
                        cx="68"
                        cy="75"
                        r="1.5"
                        fill="currentColor"
                        opacity="0.5"
                    />
                    <line
                        x1="50"
                        y1="75"
                        x2="64"
                        y2="75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.4"
                    />

                    <circle
                        cx="68"
                        cy="80"
                        r="1.5"
                        fill="currentColor"
                        opacity="0.5"
                    />
                    <line
                        x1="50"
                        y1="80"
                        x2="64"
                        y2="80"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.4"
                    />
                </g>

                {/* Glowing Scanline showing paste sequence */}
                <motion.line
                    x1="36"
                    x2="84"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.5"
                    animate={
                        stopped
                            ? undefined
                            : {
                                  y1: [30, 94, 30],
                                  y2: [30, 94, 30],
                                  opacity: [0, 0.6, 0],
                              }
                    }
                    transition={{
                        duration: pulseDuration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </g>
        </motion.svg>
    );
}
