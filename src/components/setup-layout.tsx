import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
    AnimatedRouteIcon,
    type AnimationType,
} from "@/components/animated-icons";

type SetupLayoutProps = {
    title: string;
    subtitle: string;
    showBack?: boolean;
    motifType?: AnimationType;
    children: ReactNode;
};

export function SetupLayout({
    title,
    subtitle,
    showBack = false,
    motifType,
    children,
}: SetupLayoutProps) {
    const [boosted, setBoosted] = useState(false);

    return (
        <div className="relative min-h-screen bg-background text-foreground">
            {/* Screentone dot background via inline radial-gradient */}
            <div
                className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "4px 4px",
                }}
            />
            <div className="absolute inset-0 bg-background/90 z-0 pointer-events-none" />

            {/* Animated top bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-muted via-foreground to-muted bg-[length:100%_100%] animate-pulse z-20" />

            <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <header className="relative mb-10 md:mb-12">
                    {showBack && (
                        <Link
                            to="/onboarding"
                            className="inline-flex items-center gap-2 border-2 border-foreground/40 bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:border-foreground hover:bg-foreground hover:text-background transition-all shadow-[4px_4px_0px_0px_var(--color-foreground)]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                    )}

                    <div
                        className="mt-6 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10"
                        onMouseEnter={() => motifType && setBoosted(true)}
                        onMouseLeave={() => motifType && setBoosted(false)}
                    >
                        {motifType && (
                            <div className="shrink-0 h-32 w-32 text-foreground md:h-40 md:w-40">
                                <AnimatedRouteIcon
                                    type={motifType}
                                    boosted={boosted}
                                    variant="standalone"
                                />
                            </div>
                        )}

                        <div className="space-y-4 min-w-0">
                            <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
                                {title}
                            </h1>
                            <p className="border-l-4 border-foreground pl-4 text-base font-medium text-muted-foreground md:text-lg">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </header>

                <main>{children}</main>
            </div>
        </div>
    );
}
