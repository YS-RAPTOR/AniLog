import { invoke } from "@tauri-apps/api/core";

export type OAuthProvider = "google" | "mal";

export type OAuthSecrets = {
    googleClientId: string;
    googleClientSecret: string;
    malClientId: string;
};

export const authApi = {
    getSecrets: () => {
        return invoke<OAuthSecrets>("get_secrets");
    },
    setSecrets: (secrets: OAuthSecrets) => {
        return invoke<void>("set_secrets", { secrets });
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
