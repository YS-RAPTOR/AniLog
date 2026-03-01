import { AuthApi } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
    component: RouteComponent,
});

function RouteComponent() {
    const secrets = AuthApi.getAccessToken("google");

    return (
        <div>
            Hello "/_app/"! {secrets}
            <button onClick={() => AuthApi.removeSecrets()}>
                Clear Secrets
            </button>
        </div>
    );
}
