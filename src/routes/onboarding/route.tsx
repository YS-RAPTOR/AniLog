import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AuthApi } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
    beforeLoad: async () => {
        const secretsExist = await AuthApi.secretsExist();

        if (secretsExist) {
            throw redirect({ to: "/" });
        }
    },
    component: OnboardingLayoutRoute,
});

function OnboardingLayoutRoute() {
    return <Outlet />;
}
