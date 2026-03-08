import { z } from "zod";

import {
    AnimeRankingSourceSnapshot,
    AnimeSearchSourceSnapshot,
    AnimeSeasonalSourceSnapshot,
    AnimeSuggestionsSourceSnapshot,
    AnimeUserListSourceSnapshot,
    MangaRankingSourceSnapshot,
    MangaSearchSourceSnapshot,
    MangaUserListSourceSnapshot,
} from "@/lib/mal/list/schema/source-snapshots";
import { SourceFamilyRegistryEntry } from "@/lib/mal/list/schema/source-family-entry";

const today = new Date();

const currentYear = today.getUTCFullYear();

const currentSeason = (() => {
    const month = today.getUTCMonth();

    if (month === 11 || month <= 1) {
        return "winter";
    }

    if (month <= 4) {
        return "spring";
    }

    if (month <= 7) {
        return "summer";
    }

    return "fall";
})();

const animeCommonFetchFieldSuperset = [
    "id",
    "title",
    "main_picture.medium",
    "mean",
    "media_type",
    "status",
    "start_season.season",
    "start_season.year",
    "genres[].name",
    "studios[].name",
    "my_list_status.status",
    "my_list_status.score",
];

const animeRankingFetchFieldSuperset = [
    ...animeCommonFetchFieldSuperset,
    "ranking.rank",
    "ranking.previous_rank",
];

const mangaCommonFetchFieldSuperset = [
    "id",
    "title",
    "main_picture.medium",
    "mean",
    "media_type",
    "status",
    "start_date",
    "genres[].name",
    "my_list_status.status",
    "my_list_status.score",
];

const mangaRankingFetchFieldSuperset = [
    ...mangaCommonFetchFieldSuperset,
    "ranking.rank",
    "ranking.previous_rank",
];

const sourceFamilies: z.infer<typeof SourceFamilyRegistryEntry>[] = [
    {
        id: "anime_search",
        medium: "anime",
        settings: [
            {
                kind: "text",
                key: "query",
                label: "Query",
                required: true,
            },
            {
                kind: "integer",
                key: "entry_limit",
                label: "Entry Limit",
                required: true,
                min_value: 1,
                default_value: 100,
                max_value: 5000,
            },
        ],
        fetch_field_superset: animeCommonFetchFieldSuperset,
        source_snapshot_schema: AnimeSearchSourceSnapshot,
    },
    {
        id: "manga_search",
        medium: "manga",
        settings: [
            {
                kind: "text",
                key: "query",
                label: "Query",
                required: true,
            },
            {
                kind: "integer",
                key: "entry_limit",
                label: "Entry Limit",
                required: true,
                min_value: 1,
                default_value: 100,
                max_value: 5000,
            },
        ],
        fetch_field_superset: mangaCommonFetchFieldSuperset,
        source_snapshot_schema: MangaSearchSourceSnapshot,
    },
    {
        id: "anime_seasonal",
        medium: "anime",
        settings: [
            {
                kind: "integer",
                key: "year",
                label: "Year",
                required: true,
                min_value: 1917,
                default_value: currentYear,
                max_value: 3000,
            },
            {
                kind: "string_enum",
                key: "season",
                label: "Season",
                required: true,
                values: ["winter", "spring", "summer", "fall"],
                default_value: currentSeason,
            },
        ],
        fetch_field_superset: animeCommonFetchFieldSuperset,
        source_snapshot_schema: AnimeSeasonalSourceSnapshot,
    },
    {
        id: "anime_ranking",
        medium: "anime",
        settings: [
            {
                kind: "string_enum",
                key: "ranking_type",
                label: "Ranking Type",
                required: true,
                values: [
                    "all",
                    "airing",
                    "upcoming",
                    "tv",
                    "ova",
                    "movie",
                    "special",
                    "bypopularity",
                    "favorite",
                ],
            },
            {
                kind: "integer",
                key: "entry_limit",
                label: "Entry Limit",
                required: true,
                min_value: 1,
                default_value: 500,
                max_value: 5000,
            },
        ],
        fetch_field_superset: animeRankingFetchFieldSuperset,
        source_snapshot_schema: AnimeRankingSourceSnapshot,
    },
    {
        id: "manga_ranking",
        medium: "manga",
        settings: [
            {
                kind: "string_enum",
                key: "ranking_type",
                label: "Ranking Type",
                required: true,
                values: [
                    "all",
                    "manga",
                    "novels",
                    "oneshots",
                    "doujin",
                    "manhwa",
                    "manhua",
                    "bypopularity",
                    "favorite",
                ],
            },
            {
                kind: "integer",
                key: "entry_limit",
                label: "Entry Limit",
                required: true,
                min_value: 1,
                default_value: 500,
                max_value: 5000,
            },
        ],
        fetch_field_superset: mangaRankingFetchFieldSuperset,
        source_snapshot_schema: MangaRankingSourceSnapshot,
    },
    {
        id: "anime_user_list",
        medium: "anime",
        settings: [
            {
                kind: "text",
                key: "user_name",
                label: "User Name",
                required: true,
            },
        ],
        fetch_field_superset: animeCommonFetchFieldSuperset,
        source_snapshot_schema: AnimeUserListSourceSnapshot,
    },
    {
        id: "manga_user_list",
        medium: "manga",
        settings: [
            {
                kind: "text",
                key: "user_name",
                label: "User Name",
                required: true,
            },
        ],
        fetch_field_superset: mangaCommonFetchFieldSuperset,
        source_snapshot_schema: MangaUserListSourceSnapshot,
    },
    {
        id: "anime_suggestions",
        medium: "anime",
        settings: [
            {
                kind: "integer",
                key: "entry_limit",
                label: "Entry Limit",
                required: true,
                min_value: 1,
                default_value: 100,
                max_value: 5000,
            },
        ],
        fetch_field_superset: animeCommonFetchFieldSuperset,
        source_snapshot_schema: AnimeSuggestionsSourceSnapshot,
    },
];

export const sourceFamilyDefinitions =
    SourceFamilyRegistryEntry.array().parse(sourceFamilies);

export const sourceFamilyDefinitionById = new Map(
    sourceFamilyDefinitions.map(
        (definition) => [definition.id, definition] as const,
    ),
);
