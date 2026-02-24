import { createFileRoute } from "@tanstack/react-router";
import { SetupLayout } from "@/components/setup-layout";
import {
    PathCard,
    type PathCardProps,
} from "@/components/onboarding/path-card";

export const Route = createFileRoute("/onboarding/")({
    component: OnboardingIndex,
});

const paths: Readonly<PathCardProps>[] = [
    {
        to: "/onboarding/beginner",
        animationType: "compass",
        title: "Beginner",
        description:
            "Will hand hold you through setting up the Google and MyAnimeList client ids and secrets.",
        features: [
            "Step-by-step guided walkthrough",
            "Detailed explanations for each step",
            "Best for non-technical users",
        ],
        cta: "Start Journey",
    },
    {
        to: "/onboarding/advanced",
        animationType: "gear",
        title: "Advanced",
        description:
            "Will provide you the bare minimum information to configure the Google and MyAnimeList credentials on your own.",
        features: [
            "Concise setup checklist",
            "Minimal guidance and reading",
            "Best for technical users",
        ],
        cta: "Configure",
    },
    {
        to: "/onboarding/import",
        animationType: "clipboard",
        title: "Import",
        description:
            "If you are already setup in another machine, you can export your credentials to JSON and import it here.",
        features: [
            "Seamless cross-device migration",
            "Instantly ready to use",
            "Best for users with existing setups",
        ],
        cta: "Restore",
    },
] as const;

function OnboardingIndex() {
    return (
        <SetupLayout
            title="Choose Your Route"
            subtitle="Start tracking anime your way: choose guided setup, a quick checklist, or import existing credentials."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {paths.map((path) => (
                    <PathCard key={path.to} {...path} />
                ))}
            </div>
        </SetupLayout>
    );
}
