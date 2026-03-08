import { z } from "zod";

import {
    AnimeListStatus,
    Integer,
    MangaListStatus,
} from "@/lib/mal/api/schema";
import { Identifier } from "@/lib/mal/list/common";
import { TypedExpression } from "@/lib/mal/list/expression/ast";
import { textType } from "@/lib/mal/list/expression/descriptors";

const PollingConfig = z.object({
    interval_ms: Integer.positive(),
});

const TrackingNotifyAction = z.object({
    kind: z.literal("notify"),
    message_expression: TypedExpression(textType),
});

const TrackingUpdateStatusAction = z.object({
    kind: z.literal("update_status"),
    status: z.union([AnimeListStatus, MangaListStatus]),
});

const TrackingExportDataAction = z.object({
    kind: z.literal("export_data"),
    export_script_id: Identifier,
});

const TrackingAction = z.discriminatedUnion("kind", [
    TrackingNotifyAction,
    TrackingUpdateStatusAction,
    TrackingExportDataAction,
]);

const TrackingRule = z.object({
    id: Identifier,
    condition: TypedExpression({
        kind: "scalar",
        type: "boolean",
    }),
    actions: z.array(TrackingAction).min(1),
});

export const TrackingConfig = z
    .object({
        polling: PollingConfig.nullable(),
        rules: z.array(TrackingRule),
    })
    .superRefine((value, ctx) => {
        const seenRuleIds = new Set<string>();

        for (const [ruleIndex, rule] of value.rules.entries()) {
            if (seenRuleIds.has(rule.id)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Duplicate tracking rule id '${rule.id}'`,
                    path: ["rules", ruleIndex, "id"],
                });
            } else {
                seenRuleIds.add(rule.id);
            }
        }
    });
