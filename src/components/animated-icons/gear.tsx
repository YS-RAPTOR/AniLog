import { motion, useReducedMotion } from "motion/react";

export function Gear({ boosted }: { boosted: boolean }) {
    const prefersReduced = useReducedMotion();
    const stopped = !!prefersReduced;

    const mainDuration = boosted ? 14 : 20;
    const hubDuration = boosted ? 20 : 28;

    // Outer gear shape
    const teethCount = 12; // Increased teeth for a smoother look
    const outerR = 52;
    const innerR = 42;
    const cx = 60;
    const cy = 60;

    let gearPath = "";
    for (let i = 0; i < teethCount; i++) {
        const step = (Math.PI * 2) / teethCount;
        const angle1 = i * step;
        const angle2 = i * step + step * 0.2;
        const angle3 = i * step + step * 0.4;
        const angle4 = i * step + step * 0.6;
        const angle5 = (i + 1) * step;

        const p1x = cx + innerR * Math.cos(angle1);
        const p1y = cy + innerR * Math.sin(angle1);
        const p2x = cx + outerR * Math.cos(angle2);
        const p2y = cy + outerR * Math.sin(angle2);
        const p3x = cx + outerR * Math.cos(angle3);
        const p3y = cy + outerR * Math.sin(angle3);
        const p4x = cx + innerR * Math.cos(angle4);
        const p4y = cy + innerR * Math.sin(angle4);
        const p5x = cx + innerR * Math.cos(angle5);
        const p5y = cy + innerR * Math.sin(angle5);

        if (i === 0) {
            gearPath += `M${p1x.toFixed(1)},${p1y.toFixed(1)}`;
        }
        // Drawing tooth profile
        gearPath += ` L${p2x.toFixed(1)},${p2y.toFixed(1)} 
                     A${outerR},${outerR} 0 0 1 ${p3x.toFixed(1)},${p3y.toFixed(1)}
                     L${p4x.toFixed(1)},${p4y.toFixed(1)} 
                     A${innerR},${innerR} 0 0 1 ${p5x.toFixed(1)},${p5y.toFixed(1)} `;
    }
    gearPath += " Z";

    // Re-create a continuous smooth gear rim with fill to create volume
    const rimPath = `M60,20 A40,40 0 1,1 59.9,20 Z M60,32 A28,28 0 1,0 60.1,32 Z`;

    return (
        <motion.svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="gear-glow" cx="0.5" cy="0.5" r="0.5">
                    <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="0.4"
                    />
                    <stop
                        offset="60%"
                        stopColor="currentColor"
                        stopOpacity="0.15"
                    />
                    <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0"
                    />
                </radialGradient>
            </defs>

            {/* Background Glow */}
            <circle cx="60" cy="60" r="54" fill="url(#gear-glow)" />

            {/* Main gear body */}
            <motion.g
                animate={stopped ? undefined : { rotate: 360 }}
                transition={{
                    duration: mainDuration,
                    ease: "linear",
                    repeat: Infinity,
                }}
                style={{ originX: "50%", originY: "50%" }}
            >
                {/* Teeth silhouette */}
                <path d={gearPath} fill="currentColor" opacity="0.15" />
                <path
                    d={gearPath}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
                {/* Thick rim for structure */}
                <path
                    d={rimPath}
                    fill="currentColor"
                    fillRule="evenodd"
                    opacity="0.2"
                />

                {/* Gear spokes */}
                {[0, 60, 120].map((angle) => (
                    <line
                        key={angle}
                        x1="32"
                        y1="60"
                        x2="88"
                        y2="60"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.3"
                        transform={`rotate(${angle} 60 60)`}
                    />
                ))}
            </motion.g>

            {/* Inner counter-rotating mechanism */}
            <motion.g
                animate={stopped ? undefined : { rotate: -360 }}
                transition={{
                    duration: hubDuration,
                    ease: "linear",
                    repeat: Infinity,
                }}
                style={{ originX: "50%", originY: "50%" }}
            >
                {/* Dashed secondary track */}
                <circle
                    cx="60"
                    cy="60"
                    r="25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    opacity="0.5"
                />
                <circle
                    cx="60"
                    cy="60"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.4"
                />
                {/* Inner hub cross */}
                <path
                    d="M45,60 L75,60 M60,45 L60,75"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.5"
                />
            </motion.g>

            {/* Center axle details */}
            <circle cx="60" cy="60" r="10" fill="currentColor" opacity="0.2" />
            <circle
                cx="60"
                cy="60"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.8"
            />
            <circle cx="60" cy="60" r="2" fill="currentColor" opacity="0.9" />
        </motion.svg>
    );
}
