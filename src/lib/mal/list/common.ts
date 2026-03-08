import { z } from "zod";

export const NonEmptyString = z.string().min(1);

export const Identifier = NonEmptyString;

export const uniqueStringArray = <T extends z.ZodType<string>>(schema: T) =>
    z.array(schema).superRefine((values, ctx) => {
        if (new Set(values).size !== values.length) {
            ctx.addIssue({
                code: "custom",
                message: "Expected unique values",
            });
        }
    });

export const uniqueObjectArrayBy = <T extends z.ZodTypeAny>(
    schema: T,
    getKey: (value: z.infer<T>) => string,
) =>
    z.array(schema).superRefine((values, ctx) => {
        const seen = new Set<string>();

        for (const value of values) {
            const key = getKey(value);

            if (seen.has(key)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Duplicate value for key '${key}'`,
                });

                return;
            }

            seen.add(key);
        }
    });

export const Medium = z.enum(["anime", "manga"]);

export const ActiveView = z.enum(["table", "card"]);

export const ListConfigVersion = z.literal(1);

export const SnapshotVersion = z.literal(1);

export const TrackingStateVersion = z.literal(1);

export const ValueCardinality = z.enum(["one", "many"]);

export const ScalarType = z.union([
    z.literal("string"),
    z.literal("number"),
    z.literal("date"),
    z.literal("boolean"),
    z.literal("url"),
    z.literal("other"),
]);

export const SortDirection = z.enum(["asc", "desc"]);
