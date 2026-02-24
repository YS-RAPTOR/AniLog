import { motion, useReducedMotion } from "motion/react";

export function Compass({ boosted }: { boosted: boolean }) {
    const prefersReduced = useReducedMotion();
    const stopped = !!prefersReduced;

    const ringDuration = boosted ? 16 : 24;
    const needleDuration = boosted ? 3.2 : 4.8;

    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="compass-glow" cx="0.5" cy="0.5" r="0.5">
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
            </defs>

            {/* Background Glow */}
            <circle cx="60" cy="60" r="50" fill="url(#compass-glow)" />

            {/* Outer ring */}
            <motion.g
                animate={stopped ? undefined : { rotate: 360 }}
                transition={{
                    duration: ringDuration,
                    ease: "linear",
                    repeat: Infinity,
                }}
                style={{ originX: "50%", originY: "50%" }}
            >
                {/* Dashed outer track */}
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                />
                {/* Main outer ring */}
                <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.6"
                />

                {/* 360 degree tick marks */}
                {Array.from({ length: 24 }).map((_, i) => {
                    const angle = i * 15;
                    const isCardinal = i % 6 === 0;
                    return (
                        <line
                            key={angle}
                            x1="60"
                            y1={isCardinal ? "12" : "15"}
                            x2="60"
                            y2="18"
                            stroke="currentColor"
                            strokeWidth={isCardinal ? "2" : "1"}
                            opacity={isCardinal ? "0.6" : "0.3"}
                            transform={`rotate(${angle} 60 60)`}
                        />
                    );
                })}
            </motion.g>

            {/* Inner intricate ring */}
            <motion.g
                animate={stopped ? undefined : { rotate: -180 }}
                transition={{
                    duration: ringDuration * 1.5,
                    ease: "linear",
                    repeat: Infinity,
                }}
                style={{ originX: "50%", originY: "50%" }}
            >
                <circle
                    cx="60"
                    cy="60"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="1 6"
                    opacity="0.4"
                />
                <circle
                    cx="60"
                    cy="60"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.2"
                />
            </motion.g>

            {/* Center pivot detail */}
            <circle
                cx="60"
                cy="60"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.5"
            />
            <circle cx="60" cy="60" r="2" fill="currentColor" opacity="0.8" />

            {/* Needle group */}
            <motion.g
                animate={stopped ? undefined : { rotate: [-12, 12, -12] }}
                transition={{
                    duration: needleDuration,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
                style={{ originX: "50%", originY: "50%" }}
            >
                {/* North needle with 3D-like shading */}
                <polygon
                    points="60,20 54,60 60,60"
                    fill="currentColor"
                    opacity="0.7"
                />
                <polygon
                    points="60,20 66,60 60,60"
                    fill="currentColor"
                    opacity="0.4"
                />
                {/* South needle with 3D-like shading */}
                <polygon
                    points="60,100 54,60 60,60"
                    fill="currentColor"
                    opacity="0.2"
                />
                <polygon
                    points="60,100 66,60 60,60"
                    fill="currentColor"
                    opacity="0.1"
                />
            </motion.g>
        </motion.svg>
    );
}
