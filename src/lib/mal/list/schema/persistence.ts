import { z } from "zod";

import {
    ActiveView,
    Identifier,
    ListConfigVersion,
    NonEmptyString,
    TrackingStateVersion,
} from "@/lib/mal/list/common";
import {
    GroupingDefinition,
    SortingDefinition,
    TypedExpression,
} from "@/lib/mal/list/expression/ast";
import { scalar, union } from "@/lib/mal/list/expression/descriptors";
import { SourceConfig } from "./source-config";
import { SourceSnapshot } from "./source-snapshots";
import { TrackingConfig } from "./tracking";
import { CardViewConfig, TableViewConfig } from "./view";

export const SavedListEditableState = z.object({
    version: ListConfigVersion,
    name: NonEmptyString,
    source: SourceConfig,
    active_view: ActiveView,
    table_view: TableViewConfig,
    card_view: CardViewConfig,
    grouping: GroupingDefinition.nullable(),
    sorting: SortingDefinition.nullable(),
    tracking: TrackingConfig,
});

export const SavedListRecord = SavedListEditableState.extend({
    id: Identifier,
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable(),
});

export const ListDraftRecord = z.object({
    list_id: Identifier,
    draft: SavedListEditableState,
    updated_at: z.date(),
});

export const SourceSnapshotRecord = z
    .object({
        id: Identifier,
        source_config: SourceConfig,
        snapshot: SourceSnapshot,
    })
    .superRefine((value, ctx) => {
        if (
            value.source_config.family !== value.snapshot.metadata.source_family
        ) {
            ctx.addIssue({
                code: "custom",
                message: `Source config family '${value.source_config.family}' must match snapshot metadata source family '${value.snapshot.metadata.source_family}'`,
                path: ["source_config", "family"],
            });
        }

        if (value.source_config.medium !== value.snapshot.metadata.medium) {
            ctx.addIssue({
                code: "custom",
                message: `Source config medium '${value.source_config.medium}' must match snapshot metadata medium '${value.snapshot.metadata.medium}'`,
                path: ["source_config", "medium"],
            });
        }
    });

export const TrackingRuntimeState = z.object({
    version: TrackingStateVersion,
    list_id: Identifier,
    baseline_snapshot_id: Identifier.nullable(),
    last_successful_poll_at: z.date().nullable(),
    rule_match_state: z.record(z.string(), z.record(z.string(), z.boolean())),
    updated_at: z.date(),
});

export const ExportScriptDefinition = z.object({
    id: Identifier,
    name: NonEmptyString,
    medium: z.enum(["anime", "manga", "both"]),
    code: NonEmptyString,
    created_at: z.date(),
    updated_at: z.date(),
});

export const ExternalLinkDefinition = z.object({
    id: Identifier,
    name: NonEmptyString,
    medium: z.enum(["anime", "manga", "both"]),
    url_expression: TypedExpression(union([scalar("string"), scalar("url")])),
    icon_hint: z.string().nullable(),
    sort_order: z.number().int().nonnegative(),
    created_at: z.date(),
    updated_at: z.date(),
});

export const IntegrationSettingsRecord = z.object({
    id: Identifier,
    integration_key: Identifier,
    settings: z.record(z.string(), z.unknown()),
    updated_at: z.date(),
});

export const AppSettingsRecord = z.object({
    id: Identifier,
    settings: z.record(z.string(), z.unknown()),
    updated_at: z.date(),
});
