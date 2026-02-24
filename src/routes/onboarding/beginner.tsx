import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SetupLayout } from "@/components/setup-layout";
import { BeginnerMd } from "@/components/onboarding/beginner-md";
import { Card } from "@/components/ui/card";
import onboardingMarkdown from "./beginner.md?raw";
import { parseOnboardingMarkdown } from "@/lib/onboarding/beginner-markdown";
import {
    AuthApi,
    OAUTH_SECRET_KEYS,
    OAUTH_SECRET_LABELS,
    getAuthErrorMessage,
    type OAuthSecretKeys,
    type OAuthSecrets,
} from "@/lib/auth";

export const Route = createFileRoute("/onboarding/beginner")({
    component: OnboardingBeginner,
});

function OnboardingBeginner() {
    const parsedContent = parseOnboardingMarkdown(onboardingMarkdown);
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState<OAuthSecrets>({
        malClientId: "",
        googleClientId: "",
        googleClientSecret: "",
    });
    const [revealState, setRevealState] = useState<
        Record<OAuthSecretKeys, boolean>
    >({
        malClientId: false,
        googleClientId: false,
        googleClientSecret: false,
    });
    const [validationMessage, setValidationMessage] = useState<{
        title: string;
        message: string;
    } | null>(null);

    const handleCredentialChange = (key: OAuthSecretKeys, value: string) => {
        setCredentials((previous) => ({
            ...previous,
            [key]: value,
        }));
        setValidationMessage(null);
    };

    const handleToggleReveal = (key: OAuthSecretKeys) => {
        setRevealState((previous) => ({
            ...previous,
            [key]: !previous[key],
        }));
    };

    const handleExternalLink = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleAction = async (_action: "validateContinue") => {
        const missing = OAUTH_SECRET_KEYS.filter(
            (key) => credentials[key].trim().length === 0,
        );

        if (missing.length > 0) {
            setValidationMessage({
                title: "Missing required fields:",
                message: `${missing.map((key) => OAUTH_SECRET_LABELS[key]).join(", ")}.`,
            });
            return;
        }

        try {
            setValidationMessage(null);
            await AuthApi.setSecrets(credentials);
            navigate({ to: "/" });
        } catch (error) {
            setValidationMessage({
                title: "Failed to save credentials:",
                message: getAuthErrorMessage(error),
            });
        }
    };

    return (
        <SetupLayout
            title="Beginner Setup"
            subtitle="A step-by-step guide that gets you from zero to fully setup AniLog system. Follow each step below and make sure not to miss any step."
            showBack
            motifType="guidedConstellation"
        >
            {!parsedContent.ok ? (
                <Card
                    variant="framed"
                    effect="offset"
                    className="mx-auto max-w-4xl p-6 md:p-8"
                >
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black uppercase">
                            Invalid Beginner Config
                        </h2>
                        <p className="font-medium text-muted-foreground leading-relaxed">
                            The onboarding markdown could not be loaded. Fix the
                            issues below and reload this route.
                        </p>
                        <ul className="list-inside list-disc space-y-2 text-sm font-semibold text-destructive">
                            {parsedContent.issues.map((issue) => (
                                <li key={issue}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                </Card>
            ) : (
                <>
                    <BeginnerMd
                        steps={parsedContent.steps}
                        credentials={credentials}
                        revealState={revealState}
                        validationError={validationMessage}
                        onCredentialChange={handleCredentialChange}
                        onToggleReveal={handleToggleReveal}
                        onAction={handleAction}
                        onExternalLink={handleExternalLink}
                    />
                </>
            )}
        </SetupLayout>
    );
}
