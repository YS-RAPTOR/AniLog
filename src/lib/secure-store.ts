import { invoke } from "@tauri-apps/api/core";

export type SecureKey = {
    service: string;
    user: string;
};

type SecureSetRequest = {
    key: SecureKey;
    value: string;
};

type SecureGetRequest = {
    key: SecureKey;
};

type SecureDeleteRequest = {
    key: SecureKey;
};

type SecureExistsRequest = {
    key: SecureKey;
};

export const secureStore = {
    set: (key: SecureKey, value: string) =>
        invoke<void>("secure_set", {
            request: { key, value } satisfies SecureSetRequest,
        }),

    get: (key: SecureKey) =>
        invoke<string | null>("secure_get", {
            request: { key } satisfies SecureGetRequest,
        }),

    delete: (key: SecureKey) =>
        invoke<void>("secure_delete", {
            request: { key } satisfies SecureDeleteRequest,
        }),

    exists: (key: SecureKey) =>
        invoke<boolean>("secure_exists", {
            request: { key } satisfies SecureExistsRequest,
        }),
};
