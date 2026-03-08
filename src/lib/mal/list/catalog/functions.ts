import { z } from "zod";

import {
    stringEnums,
    weekdayEnum,
} from "@/lib/mal/list/expression/enum-descriptors";
import {
    anyScalarType,
    anyValueType,
    arrayOf,
    functionType,
    nullable,
    numberType,
    scalar,
    scalarComparableType,
    templateRef,
    textType,
    union,
} from "@/lib/mal/list/expression/descriptors";
import { ExpressionFunction } from "@/lib/mal/list/expression/function-schema";

type RuntimeContext = { now: Date };
type RuntimeArgs = unknown[];
type FunctionInput = z.input<typeof ExpressionFunction>;

const implement = (
    fn: (context: RuntimeContext, args: RuntimeArgs) => unknown,
) => fn;

const numberOrDateType = union([...numberType.options, scalar("date")]);

const assertNumber = (value: unknown, name: string): number => {
    if (typeof value !== "number") {
        throw new TypeError(`${name} must be a number`);
    }

    return value;
};

const assertBoolean = (value: unknown, name: string): boolean => {
    if (typeof value !== "boolean") {
        throw new TypeError(`${name} must be a boolean`);
    }

    return value;
};

const assertDate = (value: unknown, name: string): Date => {
    if (!(value instanceof Date)) {
        throw new TypeError(`${name} must be a Date`);
    }

    return value;
};

const assertText = (value: unknown, name: string): string => {
    if (typeof value !== "string") {
        throw new TypeError(`${name} must be a string-like value`);
    }

    return value;
};

const assertArray = (value: unknown, name: string): unknown[] => {
    if (!Array.isArray(value)) {
        throw new TypeError(`${name} must be an array`);
    }

    return value;
};

const assertBinaryComparablePair = (
    left: unknown,
    right: unknown,
    functionId: string,
): [number, number] => {
    if (typeof left === "number" && typeof right === "number") {
        return [left, right];
    }

    if (left instanceof Date && right instanceof Date) {
        return [left.getTime(), right.getTime()];
    }

    throw new TypeError(
        `${functionId} expects both operands to be numbers or dates of the same type`,
    );
};

const areEqual = (left: unknown, right: unknown): boolean => {
    if (left instanceof Date && right instanceof Date) {
        return left.getTime() === right.getTime();
    }

    if (left instanceof URL && right instanceof URL) {
        return left.href === right.href;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
        return (
            left.length === right.length &&
            left.every((value, index) => areEqual(value, right[index]))
        );
    }

    return left === right;
};

const createShiftedDate = (date: Date, mutator: (next: Date) => void): Date => {
    const next = new Date(date.getTime());
    mutator(next);
    return next;
};

const functionDefinitions: FunctionInput[] = [
    // Comparison functions
    {
        id: "equals",
        templates: [{ name: "T", type: scalarComparableType }],
        arguments: [templateRef("T"), templateRef("T")],
        result: scalar("boolean"),
        implementation: implement((_context, [left, right]) =>
            areEqual(left, right),
        ),
    },
    {
        id: "between",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [templateRef("T"), templateRef("T"), templateRef("T")],
        result: scalar("boolean"),
        implementation: implement((_context, [value, minimum, maximum]) => {
            const [resolvedValue, resolvedMinimum] = assertBinaryComparablePair(
                value,
                minimum,
                "between",
            );
            const [, resolvedMaximum] = assertBinaryComparablePair(
                minimum,
                maximum,
                "between",
            );

            return (
                resolvedValue >= resolvedMinimum &&
                resolvedValue <= resolvedMaximum
            );
        }),
    },
    {
        id: "gt",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [templateRef("T"), templateRef("T")],
        result: scalar("boolean"),
        implementation: implement((_context, [left, right]) => {
            const [resolvedLeft, resolvedRight] = assertBinaryComparablePair(
                left,
                right,
                "gt",
            );
            return resolvedLeft > resolvedRight;
        }),
    },
    {
        id: "gte",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [templateRef("T"), templateRef("T")],
        result: scalar("boolean"),
        implementation: implement((_context, [left, right]) => {
            const [resolvedLeft, resolvedRight] = assertBinaryComparablePair(
                left,
                right,
                "gte",
            );
            return resolvedLeft >= resolvedRight;
        }),
    },
    {
        id: "lt",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [templateRef("T"), templateRef("T")],
        result: scalar("boolean"),
        implementation: implement((_context, [left, right]) => {
            const [resolvedLeft, resolvedRight] = assertBinaryComparablePair(
                left,
                right,
                "lt",
            );
            return resolvedLeft < resolvedRight;
        }),
    },
    {
        id: "lte",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [templateRef("T"), templateRef("T")],
        result: scalar("boolean"),
        implementation: implement((_context, [left, right]) => {
            const [resolvedLeft, resolvedRight] = assertBinaryComparablePair(
                left,
                right,
                "lte",
            );
            return resolvedLeft <= resolvedRight;
        }),
    },

    // Boolean functions
    {
        id: "and",
        templates: [],
        arguments: [arrayOf(scalar("boolean"))],
        result: scalar("boolean"),
        implementation: implement((_context, [values]) =>
            assertArray(values, "and values").every((value, index) =>
                assertBoolean(value, `and values[${index}]`),
            ),
        ),
    },
    {
        id: "or",
        templates: [],
        arguments: [arrayOf(scalar("boolean"))],
        result: scalar("boolean"),
        implementation: implement((_context, [values]) =>
            assertArray(values, "or values").some((value, index) =>
                assertBoolean(value, `or values[${index}]`),
            ),
        ),
    },
    {
        id: "at_least",
        templates: [],
        arguments: [arrayOf(scalar("boolean")), numberType],
        result: scalar("boolean"),
        implementation: implement((_context, [values, count]) => {
            const requiredMatches = assertNumber(count, "at_least count");

            if (!Number.isInteger(requiredMatches) || requiredMatches < 0) {
                throw new TypeError(
                    "at_least count must be a non-negative integer",
                );
            }

            const matches = assertArray(values, "at_least values").filter(
                (value, index) =>
                    assertBoolean(value, `at_least values[${index}]`),
            ).length;

            return matches >= requiredMatches;
        }),
    },
    {
        id: "not",
        templates: [],
        arguments: [scalar("boolean")],
        result: scalar("boolean"),
        implementation: implement(
            (_context, [value]) => !assertBoolean(value, "not value"),
        ),
    },

    // Conditional and nullable functions
    {
        id: "match",
        templates: [
            {
                name: "T",
                type: union([anyValueType, nullable(anyValueType)]),
            },
        ],
        arguments: [
            arrayOf(scalar("boolean")),
            arrayOf(templateRef("T")),
            templateRef("T"),
        ],
        result: templateRef("T"),
        implementation: implement(
            (_context, [conditions, values, fallback]) => {
                const resolvedConditions = assertArray(
                    conditions,
                    "match conditions",
                );
                const resolvedValues = assertArray(values, "match values");

                if (resolvedConditions.length !== resolvedValues.length) {
                    throw new TypeError(
                        "match expects conditions and values arrays to have the same length",
                    );
                }

                for (const [index, condition] of resolvedConditions.entries()) {
                    if (
                        assertBoolean(condition, `match conditions[${index}]`)
                    ) {
                        return resolvedValues[index];
                    }
                }

                return fallback;
            },
        ),
    },
    {
        id: "is_null",
        templates: [{ name: "T", type: anyValueType }],
        arguments: [nullable(templateRef("T"))],
        result: scalar("boolean"),
        implementation: implement((_context, [value]) => value === null),
    },
    {
        id: "default",
        templates: [{ name: "T", type: anyValueType }],
        arguments: [nullable(templateRef("T")), templateRef("T")],
        result: templateRef("T"),
        implementation: implement((_context, [value, fallback]) =>
            value === null ? fallback : value,
        ),
    },

    // String construction functions
    {
        id: "to_string",
        templates: [{ name: "T", type: anyValueType }],
        arguments: [templateRef("T")],
        result: scalar("string"),
        implementation: implement((_context, [value]) => {
            if (value instanceof Date) {
                return value.toISOString();
            }

            if (value instanceof URL) {
                return value.href;
            }

            if (Array.isArray(value)) {
                return value.map((item) => String(item)).join(",");
            }

            return String(value);
        }),
    },
    {
        id: "join",
        templates: [],
        arguments: [arrayOf(scalar("string")), scalar("string")],
        result: scalar("string"),
        implementation: implement((_context, [values, separator]) =>
            assertArray(values, "join values")
                .map((value, index) =>
                    assertText(value, `join values[${index}]`),
                )
                .join(assertText(separator, "join separator")),
        ),
    },

    // Collection functions
    {
        id: "map",
        templates: [
            { name: "T", type: anyValueType },
            { name: "U", type: anyValueType },
        ],
        arguments: [
            arrayOf(templateRef("T")),
            functionType(
                [templateRef("T"), scalar("number")],
                templateRef("U"),
            ),
        ],
        result: arrayOf(templateRef("U")),
        implementation: implement((_context, [values, mapper]) => {
            const items = assertArray(values, "map values");

            if (typeof mapper !== "function") {
                throw new TypeError(
                    "map expects a function as the second argument",
                );
            }

            return items.map((item, index) => mapper(item, index));
        }),
    },
    {
        id: "min",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [arrayOf(templateRef("T"))],
        result: nullable(templateRef("T")),
        implementation: implement((_context, [values]) => {
            const items = assertArray(values, "min values");

            if (items.length === 0) {
                return null;
            }

            if (items.every((value) => typeof value === "number")) {
                return Math.min(...items);
            }

            if (items.every((value) => value instanceof Date)) {
                return new Date(
                    Math.min(...items.map((value) => value.getTime())),
                );
            }

            throw new TypeError("min expects an array of numbers or dates");
        }),
    },
    {
        id: "max",
        templates: [
            { name: "T", type: numberOrDateType },
        ],
        arguments: [arrayOf(templateRef("T"))],
        result: nullable(templateRef("T")),
        implementation: implement((_context, [values]) => {
            const items = assertArray(values, "max values");

            if (items.length === 0) {
                return null;
            }

            if (items.every((value) => typeof value === "number")) {
                return Math.max(...items);
            }

            if (items.every((value) => value instanceof Date)) {
                return new Date(
                    Math.max(...items.map((value) => value.getTime())),
                );
            }

            throw new TypeError("max expects an array of numbers or dates");
        }),
    },
    {
        id: "compact",
        templates: [{ name: "T", type: anyValueType }],
        arguments: [arrayOf(nullable(templateRef("T")))],
        result: arrayOf(templateRef("T")),
        implementation: implement((_context, [values]) =>
            assertArray(values, "compact values").filter(
                (value) => value !== null,
            ),
        ),
    },
    {
        id: "unique",
        templates: [{ name: "T", type: anyScalarType }],
        arguments: [arrayOf(templateRef("T"))],
        result: arrayOf(templateRef("T")),
        implementation: implement((_context, [values]) => {
            const items = assertArray(values, "unique values");
            const uniqueItems: unknown[] = [];

            for (const item of items) {
                if (!uniqueItems.some((existing) => areEqual(existing, item))) {
                    uniqueItems.push(item);
                }
            }

            return uniqueItems;
        }),
    },
    {
        id: "contains",
        templates: [
            { name: "Text", type: textType },
            {
                name: "Container",
                type: union([
                    templateRef("Text"),
                    arrayOf(templateRef("Text")),
                ]),
            },
        ],
        arguments: [templateRef("Container"), templateRef("Text")],
        result: scalar("boolean"),
        implementation: implement((_context, [container, needle]) => {
            const textNeedle = assertText(needle, "contains needle");

            if (typeof container === "string") {
                return container.includes(textNeedle);
            }

            if (Array.isArray(container)) {
                return container.some((value) => areEqual(value, textNeedle));
            }

            throw new TypeError("contains expects a string or array container");
        }),
    },
    {
        id: "index_of",
        templates: [
            {
                name: "Indexable",
                type: union([textType, arrayOf(anyScalarType)]),
            },
        ],
        arguments: [templateRef("Indexable"), numberType],
        result: nullable(union([scalar("string"), anyScalarType])),
        implementation: implement((_context, [value, index]) => {
            const numericIndex = assertNumber(index, "index_of index");

            if (!Number.isInteger(numericIndex) || numericIndex < 0) {
                return null;
            }

            if (typeof value === "string") {
                return numericIndex >= value.length
                    ? null
                    : value.charAt(numericIndex);
            }

            if (Array.isArray(value)) {
                return numericIndex >= value.length
                    ? null
                    : value[numericIndex];
            }

            throw new TypeError(
                "index_of expects a string-like value or array",
            );
        }),
    },
    {
        id: "length",
        templates: [
            {
                name: "Value",
                type: union([textType, arrayOf(anyScalarType)]),
            },
        ],
        arguments: [templateRef("Value")],
        result: scalar("number"),
        implementation: implement((_context, [value]) => {
            if (typeof value === "string") {
                return value.length;
            }

            if (Array.isArray(value)) {
                return value.length;
            }

            throw new TypeError("length expects a string-like value or array");
        }),
    },
    {
        id: "starts_with",
        templates: [{ name: "Text", type: textType }],
        arguments: [templateRef("Text"), templateRef("Text")],
        result: scalar("boolean"),
        implementation: implement((_context, [value, prefix]) =>
            assertText(value, "starts_with value").startsWith(
                assertText(prefix, "starts_with prefix"),
            ),
        ),
    },
    {
        id: "ends_with",
        templates: [{ name: "Text", type: textType }],
        arguments: [templateRef("Text"), templateRef("Text")],
        result: scalar("boolean"),
        implementation: implement((_context, [value, suffix]) =>
            assertText(value, "ends_with value").endsWith(
                assertText(suffix, "ends_with suffix"),
            ),
        ),
    },
    {
        id: "word_count",
        templates: [{ name: "Text", type: textType }],
        arguments: [templateRef("Text")],
        result: scalar("number"),
        implementation: implement((_context, [value]) => {
            const text = assertText(value, "word_count value").trim();
            return text === "" ? 0 : text.split(/\s+/).length;
        }),
    },

    // Numeric functions
    {
        id: "round",
        templates: [],
        arguments: [numberType],
        result: scalar("number"),
        implementation: implement((_context, [value]) =>
            Math.round(assertNumber(value, "round value")),
        ),
    },
    {
        id: "floor",
        templates: [],
        arguments: [numberType],
        result: scalar("number"),
        implementation: implement((_context, [value]) =>
            Math.floor(assertNumber(value, "floor value")),
        ),
    },
    {
        id: "ceil",
        templates: [],
        arguments: [numberType],
        result: scalar("number"),
        implementation: implement((_context, [value]) =>
            Math.ceil(assertNumber(value, "ceil value")),
        ),
    },
    {
        id: "divide",
        templates: [],
        arguments: [numberType, numberType],
        result: nullable(scalar("number")),
        implementation: implement((_context, [left, right]) => {
            const denominator = assertNumber(right, "divide right");

            if (denominator === 0) {
                return null;
            }

            return assertNumber(left, "divide left") / denominator;
        }),
    },
    {
        id: "multiply",
        templates: [],
        arguments: [numberType, numberType],
        result: scalar("number"),
        implementation: implement(
            (_context, [left, right]) =>
                assertNumber(left, "multiply left") *
                assertNumber(right, "multiply right"),
        ),
    },
    {
        id: "add",
        templates: [],
        arguments: [numberType, numberType],
        result: scalar("number"),
        implementation: implement(
            (_context, [left, right]) =>
                assertNumber(left, "add left") +
                assertNumber(right, "add right"),
        ),
    },
    {
        id: "subtract",
        templates: [],
        arguments: [numberType, numberType],
        result: scalar("number"),
        implementation: implement(
            (_context, [left, right]) =>
                assertNumber(left, "subtract left") -
                assertNumber(right, "subtract right"),
        ),
    },
    {
        id: "remainder",
        templates: [],
        arguments: [numberType, numberType],
        result: nullable(scalar("number")),
        implementation: implement((_context, [left, right]) => {
            const divisor = assertNumber(right, "remainder right");

            if (divisor === 0) {
                return null;
            }

            return assertNumber(left, "remainder left") % divisor;
        }),
    },
    {
        id: "decimal_part",
        templates: [],
        arguments: [numberType],
        result: scalar("number"),
        implementation: implement((_context, [value]) => {
            const numericValue = assertNumber(value, "decimal_part value");
            return numericValue - Math.trunc(numericValue);
        }),
    },
    {
        id: "integer_part",
        templates: [],
        arguments: [numberType],
        result: scalar("number"),
        implementation: implement((_context, [value]) =>
            Math.trunc(assertNumber(value, "integer_part value")),
        ),
    },

    // Date functions
    {
        id: "year",
        templates: [],
        arguments: [scalar("date")],
        result: scalar("number"),
        implementation: implement((_context, [value]) =>
            assertDate(value, "year value").getUTCFullYear(),
        ),
    },
    {
        id: "month",
        templates: [],
        arguments: [scalar("date")],
        result: scalar("number"),
        implementation: implement(
            (_context, [value]) =>
                assertDate(value, "month value").getUTCMonth() + 1,
        ),
    },
    {
        id: "day",
        templates: [],
        arguments: [scalar("date")],
        result: scalar("number"),
        implementation: implement((_context, [value]) =>
            assertDate(value, "day value").getUTCDate(),
        ),
    },
    {
        id: "day_of_week",
        templates: [],
        arguments: [scalar("date")],
        result: weekdayEnum,
        implementation: implement((_context, [value]) => {
            const day = assertDate(value, "day_of_week value").getUTCDay();

            return weekdayEnum.values[day];
        }),
    },
    {
        id: "add_years",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(assertDate(date, "add_years date"), (next) => {
                next.setUTCFullYear(
                    next.getUTCFullYear() +
                        assertNumber(amount, "add_years amount"),
                );
            }),
        ),
    },
    {
        id: "add_months",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(assertDate(date, "add_months date"), (next) => {
                next.setUTCMonth(
                    next.getUTCMonth() +
                        assertNumber(amount, "add_months amount"),
                );
            }),
        ),
    },
    {
        id: "add_weeks",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(assertDate(date, "add_weeks date"), (next) => {
                next.setUTCDate(
                    next.getUTCDate() +
                        assertNumber(amount, "add_weeks amount") * 7,
                );
            }),
        ),
    },
    {
        id: "add_days",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(assertDate(date, "add_days date"), (next) => {
                next.setUTCDate(
                    next.getUTCDate() + assertNumber(amount, "add_days amount"),
                );
            }),
        ),
    },
    {
        id: "subtract_years",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(
                assertDate(date, "subtract_years date"),
                (next) => {
                    next.setUTCFullYear(
                        next.getUTCFullYear() -
                            assertNumber(amount, "subtract_years amount"),
                    );
                },
            ),
        ),
    },
    {
        id: "subtract_months",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(
                assertDate(date, "subtract_months date"),
                (next) => {
                    next.setUTCMonth(
                        next.getUTCMonth() -
                            assertNumber(amount, "subtract_months amount"),
                    );
                },
            ),
        ),
    },
    {
        id: "subtract_weeks",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(
                assertDate(date, "subtract_weeks date"),
                (next) => {
                    next.setUTCDate(
                        next.getUTCDate() -
                            assertNumber(amount, "subtract_weeks amount") * 7,
                    );
                },
            ),
        ),
    },
    {
        id: "subtract_days",
        templates: [],
        arguments: [scalar("date"), numberType],
        result: scalar("date"),
        implementation: implement((_context, [date, amount]) =>
            createShiftedDate(
                assertDate(date, "subtract_days date"),
                (next) => {
                    next.setUTCDate(
                        next.getUTCDate() -
                            assertNumber(amount, "subtract_days amount"),
                    );
                },
            ),
        ),
    },

    // Utility functions
    {
        id: "encode",
        templates: [
            {
                name: "Encodable",
                type: union([scalar("string"), scalar("url"), ...stringEnums]),
            },
        ],
        arguments: [templateRef("Encodable")],
        result: scalar("string"),
        implementation: implement((_context, [value]) => {
            if (value instanceof URL) {
                return encodeURIComponent(value.href);
            }

            return encodeURIComponent(assertText(value, "encode value"));
        }),
    },
];

export const functionCatalog = ExpressionFunction.array().parse(
    functionDefinitions,
);

export const functionById = new Map(
    functionCatalog.map((entry) => [entry.id, entry] as const),
);
