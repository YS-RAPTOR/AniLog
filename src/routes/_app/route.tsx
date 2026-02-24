import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AuthApi } from "@/lib/auth";

async function getToken(provider: "mal" | "google") {
    try {
        const token = await AuthApi.getAccessToken(provider);
        return token.trim().length > 0 ? token : null;
    } catch {
        return null;
    }
}

export const Route = createFileRoute("/_app")({
    beforeLoad: async () => {
        const secretsExist = await AuthApi.secretsExist();

        if (!secretsExist) {
            throw redirect({ to: "/onboarding" });
        }

        const [malToken, googleToken] = await Promise.all([
            getToken("mal"),
            getToken("google"),
        ]);

        if (!malToken) {
            throw redirect({ href: "/login/mal" });
        }

        if (!googleToken) {
            throw redirect({ href: "/login/google" });
        }
    },
    component: AppLayoutRoute,
});

function AppLayoutRoute() {
    return <Outlet />;
}
