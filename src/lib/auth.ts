import { invoke } from "@tauri-apps/api/core";

export type OAuthProvider = "google" | "mal";

export const OAUTH_SECRET_KEYS = [
    "malClientId",
    "googleClientId",
    "googleClientSecret",
] as const;

export type OAuthSecretKeys = (typeof OAUTH_SECRET_KEYS)[number];

export const OAUTH_SECRET_LABELS: Record<OAuthSecretKeys, string> = {
    malClientId: "MAL Client ID",
    googleClientId: "Google Client ID",
    googleClientSecret: "Google Client Secret",
};

export type OAuthSecrets = Record<OAuthSecretKeys, string>;

function normalizeSecrets(secrets: OAuthSecrets): OAuthSecrets {
    return {
        malClientId: secrets.malClientId.trim(),
        googleClientId: secrets.googleClientId.trim(),
        googleClientSecret: secrets.googleClientSecret.trim(),
    };
}

export function getAuthErrorMessage(error: unknown): string {
    if (typeof error === "string") {
        return error;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }

    return "INTERNAL";
}

export const AuthApi = {
    getSecrets: async () => {
        const secrets = await invoke<OAuthSecrets>("get_secrets");
        return normalizeSecrets(secrets);
    },
    setSecrets: (secrets: OAuthSecrets) => {
        return invoke<void>("set_secrets", {
            secrets: normalizeSecrets(secrets),
        });
    },
    removeSecrets: () => {
        return invoke<void>("remove_secrets");
    },
    secretsExist: () => {
        return invoke<boolean>("secrets_exist");
    },
    login: (provider: OAuthProvider) => {
        return invoke<void>("login", { provider });
    },
    logout: (provider: OAuthProvider) => {
        return invoke<void>("logout", { provider });
    },
    getAccessToken: (provider: OAuthProvider) => {
        return invoke<string>("get_access_token", { provider });
    },
};
