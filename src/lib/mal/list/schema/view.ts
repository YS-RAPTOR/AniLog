import { z } from "zod";

import { Identifier } from "@/lib/mal/list/common";
import { TypedExpression } from "@/lib/mal/list/expression/ast";

const FieldInstanceBase = z.object({
    id: Identifier,
    field_key: Identifier,
    label_override: z.string().nullable(),
    visibility_expression: TypedExpression({
        kind: "scalar",
        type: "boolean",
    }).optional(),
});

const TableFieldInstance = FieldInstanceBase.extend({
    kind: z.literal("table"),
});

export const TableViewConfig = z.object({
    fields: z.array(TableFieldInstance),
});

const CardCellDirection = z.enum([
    "left_to_right",
    "right_to_left",
    "top_to_bottom",
    "bottom_to_top",
]);

export const CardFieldInstance = FieldInstanceBase.extend({
    kind: z.literal("card"),
});

const CardCellConfig = z.object({
    direction: CardCellDirection,
    fields: z.array(CardFieldInstance),
});

const CardGridConfig = z.object({
    rows: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    cells: z.array(CardCellConfig),
});

export const CardViewConfig = z
    .object({
        main_grid: CardGridConfig,
        alt_grid: CardGridConfig,
    })
    .superRefine((value, ctx) => {
        const allFieldIds = new Set<string>();

        const grids = [
            ["main_grid", value.main_grid] as const,
            ["alt_grid", value.alt_grid] as const,
        ];

        for (const [gridKey, grid] of grids) {
            const maxCells = grid.rows * grid.columns;

            if (grid.cells.length > maxCells) {
                ctx.addIssue({
                    code: "custom",
                    message: `${gridKey} has ${grid.cells.length} cells but only ${maxCells} fit in a ${grid.rows}x${grid.columns} grid`,
                    path: [gridKey, "cells"],
                });
            }

            for (const [cellIndex, cell] of grid.cells.entries()) {
                const seenCellFieldIds = new Set<string>();

                for (const [fieldIndex, field] of cell.fields.entries()) {
                    if (seenCellFieldIds.has(field.id)) {
                        ctx.addIssue({
                            code: "custom",
                            message: `Duplicate card field id '${field.id}' in the same cell`,
                            path: [
                                gridKey,
                                "cells",
                                cellIndex,
                                "fields",
                                fieldIndex,
                                "id",
                            ],
                        });
                    } else {
                        seenCellFieldIds.add(field.id);
                    }

                    if (allFieldIds.has(field.id)) {
                        ctx.addIssue({
                            code: "custom",
                            message: `Duplicate card field id '${field.id}' across card view`,
                            path: [
                                gridKey,
                                "cells",
                                cellIndex,
                                "fields",
                                fieldIndex,
                                "id",
                            ],
                        });
                    } else {
                        allFieldIds.add(field.id);
                    }
                }
            }
        }
    });
