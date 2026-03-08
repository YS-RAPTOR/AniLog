import { z } from "zod";

import {
    Identifier,
    SortDirection,
    uniqueObjectArrayBy,
} from "@/lib/mal/list/common";
import {
    arrayOf,
    nullable,
    scalarComparableType,
    union,
} from "@/lib/mal/list/expression/descriptors";
import { LiteralValue, TypeReference } from "./type-reference";

const FieldReferenceScope = Identifier;

export const ValueExpression = z.union([
    z.object({
        kind: z.literal("field_ref"),
        scope: FieldReferenceScope,
        field_key: Identifier,
    }),
    z.object({
        kind: z.literal("literal"),
        value: LiteralValue,
    }),
    z.object({
        kind: z.literal("array_expression"),
        get items() {
            return z.array(ValueExpression);
        },
    }),
    z.object({
        kind: z.literal("function_expression"),
        function_id: Identifier,
        get arguments() {
            return z.array(ValueExpression);
        },
    }),
    z.object({
        kind: z.literal("lambda_expression"),
        parameters: z.array(
            z.object({
                name: Identifier,
                get type() {
                    return TypeReference;
                },
            }),
        ),
        get expression() {
            return ValueExpression;
        },
    }),
]);

export const TypedExpression = (type: z.infer<typeof TypeReference>) =>
    z.object({
        expression: ValueExpression,
        type: type,
    });

export const SortKey = z.object({
    id: Identifier,
    expression: TypedExpression(nullable(scalarComparableType)),
    direction: SortDirection,
});

export const SortingDefinition = uniqueObjectArrayBy(SortKey, (key) => key.id);

export const GroupingDefinition = z.object({
    id: Identifier,
    expression: TypedExpression(
        nullable(
            union([...scalarComparableType.options, arrayOf(scalarComparableType)]),
        ),
    ),
    sorting: z.union([SortingDefinition, SortDirection]),
});
