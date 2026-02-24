import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    AlertTriangle,
    CheckCircle,
    FileJson,
    UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { SetupLayout } from "@/components/setup-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    AuthApi,
    OAUTH_SECRET_KEYS,
    OAUTH_SECRET_LABELS,
    getAuthErrorMessage,
    type OAuthSecrets,
} from "@/lib/auth";

export const Route = createFileRoute("/onboarding/import")({
    component: OnboardingImport,
});

type ImportResult =
    | { status: "empty" }
    | { status: "invalid_json" }
    | { status: "not_object" }
    | { status: "missing_keys"; keys: string[] }
    | { status: "save_error"; message: string }
    | { status: "valid" };

type DisplayError = {
    title: string;
    message: string;
};

function validatePayload(value: string): ImportResult {
    if (!value.trim()) return { status: "empty" };

    let parsed: unknown;
    try {
        parsed = JSON.parse(value);
    } catch {
        return { status: "invalid_json" };
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        return { status: "not_object" };
    }

    const obj = parsed as Record<string, unknown>;
    const missing = OAUTH_SECRET_KEYS.filter(
        (key) =>
            typeof obj[key] !== "string" ||
            (obj[key] as string).trim().length === 0,
    );

    if (missing.length > 0) {
        return {
            status: "missing_keys",
            keys: missing.map((k) => OAUTH_SECRET_LABELS[k]),
        };
    }

    return { status: "valid" };
}

function resultToDisplayError(result: ImportResult): DisplayError | null {
    if (result.status === "save_error") {
        return {
            title: "Failed to save credentials",
            message: result.message,
        };
    } else if (result.status === "not_object") {
        return {
            title: "Invalid Payload",
            message: "The payload must be a JSON object.",
        };
    } else if (result.status === "invalid_json") {
        return {
            title: "Invalid JSON",
            message:
                "The payload is not valid JSON. Please check for syntax errors and try again.",
        };
    } else if (result.status === "missing_keys") {
        return {
            title: "Missing Required Fields",
            message: result.keys.join(", "),
        };
    }

    return null;
}

function OnboardingImport() {
    const navigate = useNavigate();
    const [jsonInput, setJsonInput] = useState("");
    const [result, setResult] = useState<ImportResult>({
        status: "empty",
    });

    const handleChange = (value: string) => {
        setJsonInput(value);
        setResult(validatePayload(value));
    };

    const isValid = result.status === "valid";
    let displayError: DisplayError | null = resultToDisplayError(result);

    const handleImport = async () => {
        if (!isValid) return;

        try {
            const parsed = JSON.parse(jsonInput) as OAuthSecrets;
            await AuthApi.setSecrets(parsed);
            navigate({ to: "/" });
        } catch (error) {
            setResult({
                status: "save_error",
                message: getAuthErrorMessage(error),
            });
        }
    };

    return (
        <SetupLayout
            title="Import Settings"
            subtitle="Import your Google and MyAnimeList credentials from a JSON payload exported from another device."
            showBack
            motifType="dataPipeline"
        >
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Main JSON input card */}
                <Card variant="framed" effect="offset" className="p-6 md:p-8">
                    <div className="mb-5 border-b-2 border-foreground/30 pb-3">
                        <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
                            <FileJson className="h-5 w-5" />
                            JSON Payload
                        </h2>
                    </div>

                    <div className="relative">
                        <Textarea
                            className="h-64 md:h-80 bg-background text-foreground border-4 border-foreground font-mono text-sm p-4 md:p-6 resize-y transition-shadow focus:shadow-[4px_4px_0px_0px_var(--color-foreground)] placeholder:text-muted-foreground/50"
                            placeholder={`{\n  "malClientId": "...",\n  "googleClientId": "...",\n  "googleClientSecret": "..."\n}`}
                            value={jsonInput}
                            onChange={(e) => handleChange(e.target.value)}
                            spellCheck={false}
                        />
                    </div>

                    {result.status === "valid" && (
                        <Alert className="mt-4">
                            <CheckCircle />
                            <AlertTitle>Valid Payload</AlertTitle>
                            <AlertDescription>
                                The payload is valid and ready to be imported.
                            </AlertDescription>
                        </Alert>
                    )}

                    {displayError && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTriangle />
                            <AlertTitle>{displayError.title}</AlertTitle>
                            <AlertDescription>
                                {displayError.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </Card>

                {/* Submit Button */}
                <Button
                    type="button"
                    disabled={!isValid}
                    onClick={handleImport}
                    variant="primary"
                    size="lg"
                    className={`w-full border-4 text-lg tracking-[0.16em] ${
                        isValid
                            ? "hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_var(--color-foreground)]"
                            : "bg-muted text-muted-foreground border-dashed shadow-none"
                    }`}
                >
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Import
                </Button>
            </div>
        </SetupLayout>
    );
}
