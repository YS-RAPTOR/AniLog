import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
    Save,
    CircleQuestionMarkIcon,
    BookOpen,
    AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { SetupLayout } from "@/components/setup-layout";
import { SecretInput } from "@/components/secret-input";
import { CopyField } from "@/components/copy-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AuthApi,
    OAUTH_SECRET_KEYS,
    OAUTH_SECRET_LABELS,
    getAuthErrorMessage,
    type OAuthSecretKeys,
    type OAuthSecrets,
} from "@/lib/auth";

export const Route = createFileRoute("/onboarding/advanced")({
    component: OnboardingAdvanced,
});

function OnboardingAdvanced() {
    const navigate = useNavigate();
    const [showHelpPopover, setShowHelpPopover] = useState(false);

    const [revealState, setRevealState] = useState<
        Record<OAuthSecretKeys, boolean>
    >({
        malClientId: false,
        googleClientId: false,
        googleClientSecret: false,
    });
    const [credentials, setCredentials] = useState<OAuthSecrets>({
        malClientId: "",
        googleClientId: "",
        googleClientSecret: "",
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

    const handleValidate = async () => {
        const missing = OAUTH_SECRET_KEYS.filter(
            (key) => credentials[key].trim().length === 0,
        );

        if (missing.length > 0) {
            setValidationMessage({
                title: "Missing required fields:",
                message: missing
                    .map((key) => OAUTH_SECRET_LABELS[key])
                    .join(", "),
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
            title="Advanced Setup"
            subtitle="Provide your own OAuth credentials to isolate quotas and fully control authentication behavior. Fill in the credentials below."
            showBack
            motifType="cyberKey"
        >
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Main Form Area */}
                <div className="order-2 space-y-6 lg:order-1 lg:col-span-8">
                    {/* MAL Credentials Section */}
                    <Card
                        variant="framed"
                        effect="offset"
                        className="p-6 md:p-8"
                    >
                        <div className="mb-5 flex items-center justify-between border-b-2 border-foreground/30 pb-3">
                            <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
                                MAL Credentials
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <SecretInput
                                label="MAL Client ID"
                                placeholder="Paste MAL client ID"
                                visible={revealState.malClientId}
                                onToggle={() =>
                                    setRevealState((prev) => ({
                                        ...prev,
                                        malClientId: !prev.malClientId,
                                    }))
                                }
                                value={credentials.malClientId}
                                onChange={(value) =>
                                    handleCredentialChange("malClientId", value)
                                }
                            />
                        </div>
                    </Card>

                    {/* Google Drive OAuth Section */}
                    <Card
                        variant="framed"
                        effect="offset"
                        className="p-6 md:p-8"
                    >
                        <div className="mb-5 flex items-center justify-between border-b-2 border-foreground/30 pb-3">
                            <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
                                Google Credentials
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <SecretInput
                                label="Google Client ID"
                                placeholder="Paste Google client ID"
                                visible={revealState.googleClientId}
                                onToggle={() =>
                                    setRevealState((prev) => ({
                                        ...prev,
                                        googleClientId: !prev.googleClientId,
                                    }))
                                }
                                value={credentials.googleClientId}
                                onChange={(value) =>
                                    handleCredentialChange(
                                        "googleClientId",
                                        value,
                                    )
                                }
                            />
                            <SecretInput
                                label="Google Client Secret"
                                placeholder="Paste Google client secret"
                                visible={revealState.googleClientSecret}
                                onToggle={() =>
                                    setRevealState((prev) => ({
                                        ...prev,
                                        googleClientSecret:
                                            !prev.googleClientSecret,
                                    }))
                                }
                                value={credentials.googleClientSecret}
                                onChange={(value) =>
                                    handleCredentialChange(
                                        "googleClientSecret",
                                        value,
                                    )
                                }
                            />
                        </div>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        type="button"
                        onClick={handleValidate}
                        variant="primary"
                        size="lg"
                        className="w-full border-4 text-lg tracking-[0.16em] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_var(--color-foreground)]"
                    >
                        <Save className="mr-2 h-5 w-5" />
                        Validate & Continue
                    </Button>

                    {validationMessage && (
                        <Alert variant="destructive">
                            <AlertTriangle />
                            <AlertTitle>{validationMessage.title}</AlertTitle>
                            <AlertDescription>
                                {validationMessage.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <aside className="order-1 space-y-6 lg:order-2 lg:col-span-4">
                    {/* Setup Values */}
                    <Card variant="framed" effect="offset" className="p-5">
                        <h3 className="border-b-2 border-foreground/30 pb-2 text-lg font-black uppercase">
                            MAL Configuration
                        </h3>
                        <p className="mt-3 mb-4 text-sm font-medium text-muted-foreground">
                            Make sure that these settings are applied to your
                            MyAnimeList API settings.
                        </p>
                        <div className="space-y-4 text-sm">
                            <CopyField
                                label="App Type"
                                value="other"
                                mode="single"
                            />
                            <CopyField
                                label="App Redirect URL"
                                values={[
                                    "http://127.0.0.1:2003/oauth/mal/callback",
                                    "http://127.0.0.1:2030/oauth/mal/callback",
                                    "http://127.0.0.1:2300/oauth/mal/callback",
                                    "http://127.0.0.1:3002/oauth/mal/callback",
                                    "http://127.0.0.1:3020/oauth/mal/callback",
                                    "http://127.0.0.1:3200/oauth/mal/callback",
                                    "anilog://oauth/mal/callback",
                                ]}
                                mode="multi"
                            />
                        </div>
                    </Card>
                    <Card variant="framed" effect="offset" className="p-5">
                        <h3 className="border-b-2 border-foreground/30 pb-2 text-lg font-black uppercase">
                            Google Configuration
                        </h3>
                        <p className="mt-3 mb-4 text-sm font-medium text-muted-foreground">
                            Make sure that these settings are applied to your
                            Google API settings.
                        </p>
                        <div className="space-y-4 text-sm">
                            <CopyField
                                label="Google Audience"
                                value="External"
                                mode="single"
                            />
                            <CopyField
                                label="Google Application Type"
                                value="Web application"
                                mode="single"
                            />
                            <CopyField
                                label="Authorized redirect URIs"
                                values={[
                                    "http://127.0.0.1:2003/oauth/google/callback",
                                    "http://127.0.0.1:2030/oauth/google/callback",
                                    "http://127.0.0.1:2300/oauth/google/callback",
                                    "http://127.0.0.1:3002/oauth/google/callback",
                                    "http://127.0.0.1:3020/oauth/google/callback",
                                    "http://127.0.0.1:3200/oauth/google/callback",
                                    "anilog://oauth/google/callback",
                                ]}
                                mode="multi"
                            />
                            <CopyField
                                label="Google Test User"
                                value="your.email@gmail.com"
                                mode="single"
                            />
                            <CopyField
                                label="Google OAuth Scopes"
                                value="https://www.googleapis.com/auth/drive.appdata,https://www.googleapis.com/auth/youtube"
                                mode="single"
                            />
                        </div>
                    </Card>
                    <Card
                        variant="framed"
                        effect="offset"
                        className="hidden p-5 bg-foreground text-background border-foreground lg:block"
                    >
                        <h3 className="text-lg font-black uppercase mb-2 border-b-2 border-background/30 pb-1">
                            Need Help?
                        </h3>
                        <p className="text-sm font-bold opacity-80">
                            The beginner guide walks you through creating API
                            keys step by step. It usually takes 5-10 minutes.
                        </p>
                        <Link
                            to="/onboarding/beginner"
                            className="mt-4 block w-full bg-background text-foreground border-2 border-background py-2 text-center font-black uppercase hover:bg-transparent hover:text-background hover:border-background transition-colors"
                        >
                            Read Guide
                        </Link>
                    </Card>
                </aside>
            </div>

            <Popover open={showHelpPopover} onOpenChange={setShowHelpPopover}>
                <PopoverTrigger
                    render={
                        <Button
                            variant="secondary"
                            size="icon-md"
                            className="fixed right-5 z-50 lg:hidden size-14 border-4 border-foreground shadow-[4px_4px_0px_0px_var(--color-foreground)] hover:shadow-[6px_6px_0px_0px_var(--color-foreground)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all duration-200"
                            style={{
                                bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
                            }}
                            aria-label="Open setup help"
                        />
                    }
                >
                    <CircleQuestionMarkIcon className="h-6 w-6" />
                </PopoverTrigger>
                <PopoverContent
                    side="top"
                    align="end"
                    sideOffset={16}
                    className="w-80 rounded-none border-4 border-foreground bg-foreground p-0 shadow-[8px_8px_0px_0px_var(--color-foreground/40)] ring-0"
                >
                    <div className="p-6 space-y-4">
                        <PopoverHeader className="gap-3">
                            <div className="flex items-center gap-3 border-b-4 border-background/20 pb-3">
                                <PopoverTitle className="text-lg font-black uppercase tracking-[0.08em] text-background">
                                    Need Help?
                                </PopoverTitle>
                            </div>
                            <PopoverDescription className="text-sm font-bold leading-relaxed text-background/70">
                                The beginner guide walks you through creating
                                API keys step by step. It usually takes 5-10
                                minutes.
                            </PopoverDescription>
                        </PopoverHeader>
                        <Link
                            to="/onboarding/beginner"
                            onClick={() => setShowHelpPopover(false)}
                            className="group/link flex items-center justify-center gap-2 w-full border-4 border-background bg-background py-2.5 text-center font-black uppercase tracking-[0.1em] text-foreground transition-all duration-200 hover:bg-transparent hover:text-background hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--color-background)]"
                        >
                            <BookOpen className="size-4 transition-transform duration-200 group-hover/link:rotate-[-8deg]" />
                            Read Guide
                        </Link>
                    </div>
                </PopoverContent>
            </Popover>
        </SetupLayout>
    );
}
