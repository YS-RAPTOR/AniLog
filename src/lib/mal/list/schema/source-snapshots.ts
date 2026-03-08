import { z } from "zod";

import {
    Anime,
    AnimeRanking,
    Integer,
    Manga,
    MangaRanking,
} from "@/lib/mal/api/schema";
import {
    Medium,
    NonEmptyString,
    SnapshotVersion,
} from "@/lib/mal/list/common";
import { SourceFamily } from "./source-config";

const SourceRefreshState = z.enum(["idle", "refreshing", "ok", "error"]);

const SourceSnapshotMetadata = z.object({
    version: SnapshotVersion,
    source_key: NonEmptyString,
    source_family: SourceFamily,
    medium: Medium,
    fetched_at: z.date(),
    entry_count: Integer.nonnegative(),
    refresh_state: SourceRefreshState,
    error: z.string().nullable(),
});

export const AnimeSearchSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("anime_search"),
        medium: z.literal("anime"),
    }),
    entries: Anime.array(),
});

export const MangaSearchSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("manga_search"),
        medium: z.literal("manga"),
    }),
    entries: Manga.array(),
});

export const AnimeSeasonalSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("anime_seasonal"),
        medium: z.literal("anime"),
    }),
    entries: Anime.array(),
});

export const AnimeRankingSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("anime_ranking"),
        medium: z.literal("anime"),
    }),
    entries: AnimeRanking.array(),
});

export const MangaRankingSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("manga_ranking"),
        medium: z.literal("manga"),
    }),
    entries: MangaRanking.array(),
});

export const AnimeUserListSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("anime_user_list"),
        medium: z.literal("anime"),
    }),
    entries: Anime.array(),
});

export const MangaUserListSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("manga_user_list"),
        medium: z.literal("manga"),
    }),
    entries: Manga.array(),
});

export const AnimeSuggestionsSourceSnapshot = z.object({
    metadata: SourceSnapshotMetadata.extend({
        source_family: z.literal("anime_suggestions"),
        medium: z.literal("anime"),
    }),
    entries: Anime.array(),
});

export const SourceSnapshot = z.union([
    AnimeSearchSourceSnapshot,
    MangaSearchSourceSnapshot,
    AnimeSeasonalSourceSnapshot,
    AnimeRankingSourceSnapshot,
    MangaRankingSourceSnapshot,
    AnimeUserListSourceSnapshot,
    MangaUserListSourceSnapshot,
    AnimeSuggestionsSourceSnapshot,
]);
