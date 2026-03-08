import { z } from "zod";

import { Integer } from "@/lib/mal/api/schema";
import { NonEmptyString, uniqueStringArray } from "@/lib/mal/list/common";

export const TextSourceSettingDefinition = z.object({
    kind: z.literal("text"),
    key: z.string().min(1),
    label: NonEmptyString,
    required: z.boolean().optional(),
    default_value: NonEmptyString.optional(),
});

export const IntegerSourceSettingDefinition = z
    .object({
        kind: z.literal("integer"),
        key: z.string().min(1),
        label: NonEmptyString,
        required: z.boolean().optional(),
        min_value: Integer.optional(),
        max_value: Integer.positive().optional(),
        step: Integer.positive().optional(),
        default_value: Integer.optional(),
    })
    .refine(
        (input) =>
            input.default_value === undefined ||
            input.min_value === undefined ||
            input.default_value >= input.min_value,
        {
            message:
                "Integer source setting default_value must be >= min_value",
        },
    )
    .refine(
        (input) =>
            input.default_value === undefined ||
            input.max_value === undefined ||
            input.default_value <= input.max_value,
        {
            message:
                "Integer source setting default_value must be <= max_value",
        },
    );

export const StringEnumSourceSettingDefinition = z
    .object({
        kind: z.literal("string_enum"),
        key: z.string().min(1),
        label: NonEmptyString,
        required: z.boolean().optional(),
        values: uniqueStringArray(NonEmptyString).min(1),
        default_value: NonEmptyString.optional(),
    })
    .refine(
        (input) =>
            input.default_value === undefined ||
            input.values.includes(input.default_value),
        {
            message:
                "String enum source setting default_value must exist in values",
        },
    );

export const SourceSettingDefinition = z.discriminatedUnion("kind", [
    TextSourceSettingDefinition,
    IntegerSourceSettingDefinition,
    StringEnumSourceSettingDefinition,
]);

export const SourceFamily = z.enum([
    "anime_search",
    "manga_search",
    "anime_seasonal",
    "anime_ranking",
    "manga_ranking",
    "anime_user_list",
    "manga_user_list",
    "anime_suggestions",
]);

const AnimeSearchSource = z.object({
    family: z.literal("anime_search"),
    medium: z.literal("anime"),
    query: NonEmptyString,
    entry_limit: Integer.positive(),
});

const MangaSearchSource = z.object({
    family: z.literal("manga_search"),
    medium: z.literal("manga"),
    query: NonEmptyString,
    entry_limit: Integer.positive(),
});

const AnimeSeasonalSource = z.object({
    family: z.literal("anime_seasonal"),
    medium: z.literal("anime"),
    year: Integer,
    season: z.enum(["winter", "spring", "summer", "fall"]),
});

const AnimeRankingSource = z.object({
    family: z.literal("anime_ranking"),
    medium: z.literal("anime"),
    ranking_type: NonEmptyString,
    entry_limit: Integer.positive(),
});

const MangaRankingSource = z.object({
    family: z.literal("manga_ranking"),
    medium: z.literal("manga"),
    ranking_type: NonEmptyString,
    entry_limit: Integer.positive(),
});

const AnimeUserListSource = z.object({
    family: z.literal("anime_user_list"),
    medium: z.literal("anime"),
    user_name: NonEmptyString,
});

const MangaUserListSource = z.object({
    family: z.literal("manga_user_list"),
    medium: z.literal("manga"),
    user_name: NonEmptyString,
});

const AnimeSuggestionsSource = z.object({
    family: z.literal("anime_suggestions"),
    medium: z.literal("anime"),
    entry_limit: Integer.positive(),
});

export const SourceConfig = z.discriminatedUnion("family", [
    AnimeSearchSource,
    MangaSearchSource,
    AnimeSeasonalSource,
    AnimeRankingSource,
    MangaRankingSource,
    AnimeUserListSource,
    MangaUserListSource,
    AnimeSuggestionsSource,
]);
