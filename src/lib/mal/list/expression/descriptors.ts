import { z } from "zod";

import type { ScalarType } from "@/lib/mal/list/common";
import { allEnums, numberEnums, stringEnums } from "./enum-descriptors";
import { TypeReference } from "./type-reference";

export const scalar = (
    scalarKind: z.infer<typeof ScalarType>,
): Extract<z.infer<typeof TypeReference>, { kind: "scalar" }> => ({
    kind: "scalar" as const,
    type: scalarKind,
});

export const templateRef = (
    name: string,
): Extract<z.infer<typeof TypeReference>, { kind: "template_ref" }> => ({
    kind: "template_ref" as const,
    name,
});

export const arrayOf = (
    item: z.infer<typeof TypeReference>,
): Extract<z.infer<typeof TypeReference>, { kind: "array" }> => ({
    kind: "array" as const,
    item,
});

export const nullable = (
    inner: z.infer<typeof TypeReference>,
): Extract<z.infer<typeof TypeReference>, { kind: "nullable" }> => ({
    kind: "nullable" as const,
    inner,
});

export const union = (
    options: z.infer<typeof TypeReference>[],
): Extract<z.infer<typeof TypeReference>, { kind: "union" }> => ({
    kind: "union" as const,
    options,
});

export const functionType = (
    arguments_: z.infer<typeof TypeReference>[],
    result: z.infer<typeof TypeReference>,
): Extract<z.infer<typeof TypeReference>, { kind: "function" }> => ({
    kind: "function" as const,
    signature: {
        templates: [],
        arguments: arguments_,
        result,
    },
});

export const textType = union([scalar("string"), ...stringEnums]);
export const numberType = union([scalar("number"), ...numberEnums]);

export const anyScalarType = union([
    scalar("string"),
    scalar("number"),
    scalar("date"),
    scalar("boolean"),
    scalar("url"),
    scalar("other"),
    ...allEnums,
]);

export const anyValueType = union([anyScalarType, arrayOf(anyScalarType)]);

export const scalarComparableType = union([
    scalar("string"),
    scalar("number"),
    scalar("date"),
    scalar("boolean"),
    scalar("url"),
    ...allEnums,
]);
