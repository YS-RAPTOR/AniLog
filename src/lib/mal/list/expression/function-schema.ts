import { z } from "zod";

import { Identifier } from "@/lib/mal/list/common";
import { CallableSignature } from "./type-reference";

const ExpressionFunctionImplementation = z.custom<
    (context: { now: Date }, args: unknown[]) => unknown
>((value) => typeof value === "function", {
    message: "Expected expression function implementation",
});

export const ExpressionFunction = CallableSignature.extend({
    id: Identifier,
    implementation: ExpressionFunctionImplementation,
});
