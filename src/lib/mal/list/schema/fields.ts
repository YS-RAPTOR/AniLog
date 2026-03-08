import { z } from "zod";

import { Identifier, Medium, uniqueStringArray } from "@/lib/mal/list/common";
import {
    GroupingDefinition,
    SortingDefinition,
} from "@/lib/mal/list/expression/ast";
import { TypeReference } from "@/lib/mal/list/expression/type-reference";
import { SourceFamily } from "./source-config";

export const FieldDefinition = z.object({
    key: Identifier,
    label: z.string().min(1),
    medium: Medium,
    source_path: z.string(),
    type: TypeReference,
    defaults: z.object({
        grouping: GroupingDefinition.optional(),
        sorting: SortingDefinition.optional(),
        card_component: z.unknown().optional(),
        table_component: z.unknown().optional(),
    }),
    source_availability: uniqueStringArray(SourceFamily),
});
