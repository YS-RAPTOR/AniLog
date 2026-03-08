import { z } from "zod";

import { Identifier, ScalarType } from "@/lib/mal/list/common";

export const LiteralValue = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.date(),
]);

export const TypeTemplate = z.object({
    name: Identifier,
    get type() {
        return TypeReference;
    },
});

export const CallableSignature = z.object({
    templates: z.array(TypeTemplate),
    get arguments() {
        return z.array(TypeReference);
    },
    get result() {
        return TypeReference;
    },
});

export const TypeReference = z.union([
    z.object({
        kind: z.literal("scalar"),
        type: ScalarType,
    }),
    z.object({
        kind: z.literal("enum"),
        type: ScalarType,
        open: z.boolean(),
        values: z.array(LiteralValue),
    }),
    z.object({
        kind: z.literal("template_ref"),
        name: Identifier,
    }),
    z.object({
        kind: z.literal("array"),
        get item() {
            return TypeReference;
        },
    }),
    z.object({
        kind: z.literal("nullable"),
        get inner() {
            return TypeReference;
        },
    }),
    z.object({
        kind: z.literal("union"),
        get options() {
            return z.array(TypeReference).min(2);
        },
    }),
    z.object({
        kind: z.literal("function"),
        get signature() {
            return CallableSignature;
        },
    }),
]);
