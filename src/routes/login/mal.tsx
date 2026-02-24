import { AuthApi, getAuthErrorMessage } from "@/lib/auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SetupLayout } from "@/components/setup-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login/mal")({
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setError(null);
            setIsLoading(true);
            await AuthApi.login("mal");
            navigate({ to: "/" });
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        await AuthApi.removeSecrets();
        navigate({ to: "/" });
    };

    return (
        <SetupLayout
            title="MyAnimeList"
            subtitle="Connect your MyAnimeList account to sync your anime list."
        >
            <div className="flex flex-col items-center justify-center pt-8 md:pt-16">
                <Card
                    variant="framed"
                    effect="offset"
                    className="w-full max-w-xl p-8 md:p-12 text-center"
                >
                    <div className="space-y-8 flex flex-col items-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight">
                                Authorize AniLog
                            </h2>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                                AniLog needs access to your MyAnimeList account
                                to read and update your anime list.
                            </p>
                        </div>

                        {error && (
                            <div className="text-destructive font-bold text-sm bg-destructive/10 p-4 w-full border-2 border-destructive">
                                {error}
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full sm:w-auto min-w-[240px]"
                            onClick={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Authenticating..."
                                : "Login with MyAnimeList"}
                        </Button>
                    </div>
                </Card>

                <button
                    type="button"
                    onClick={handleReset}
                    className="mt-12 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                    Reset & Start Over
                </button>
            </div>
        </SetupLayout>
    );
}
