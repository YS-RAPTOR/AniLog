import { z } from "zod";

import {
    Medium,
    NonEmptyString,
    uniqueStringArray,
} from "@/lib/mal/list/common";
import { SourceFamily, SourceSettingDefinition } from "./source-config";

export const SourceFamilyRegistryEntry = z
    .object({
        id: SourceFamily,
        medium: Medium,
        settings: z.array(SourceSettingDefinition),
        fetch_field_superset: uniqueStringArray(NonEmptyString),
        source_snapshot_schema: z.custom<z.ZodTypeAny>(
            (value) => value instanceof z.ZodType,
            {
                message: "Expected Zod schema",
            },
        ),
    })
    .superRefine((value, ctx) => {
        const seenSettingKeys = new Set<string>();

        for (const [settingIndex, setting] of value.settings.entries()) {
            if (seenSettingKeys.has(setting.key)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Duplicate source setting key '${setting.key}'`,
                    path: ["settings", settingIndex, "key"],
                });
            } else {
                seenSettingKeys.add(setting.key);
            }
        }
    });
