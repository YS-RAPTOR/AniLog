import { z } from "zod";

const openStringEnum = <const T extends readonly string[]>(_values: T) => {
    type KnownValue = T[number];
    type OpenValue = KnownValue | (string & {});

    return z.string() as unknown as z.ZodType<OpenValue>;
};

const closedStringEnum = <const T extends readonly [string, ...string[]]>(
    values: T,
) => z.enum(values);

const closedNumberEnum = <const T extends readonly [number, ...number[]]>(
    values: T,
) =>
    z.union(
        values.map((value) => z.literal(value)) as unknown as [
            z.ZodLiteral<T[number]>,
            ...z.ZodLiteral<T[number]>[],
        ],
    );

export const UrlString = z.url().transform((v) => new URL(v));

export const DatetimeString = z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "Invalid ISO datetime",
    })
    .transform((v) => new Date(v));

export const TimeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const PartialDateString = z
    .string()
    .regex(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/)
    .transform((v) => new Date(v));

export const IntegerString = z
    .string()
    .regex(/^-?\d+$/)
    .transform((v) => Number.parseInt(v, 10));

export const TimestampMsInteger = z
    .number()
    .int()
    .nonnegative()
    .transform((v) => new Date(v));

export const Integer = z.number().int();

export const NullableInteger = Integer.nullable();

export const NullablePartialDateString = PartialDateString.nullable();

export const BoundedMean = z.number().min(0).max(10);

export const genreNameValues = [
    "Action",
    "Adult Cast",
    "Adventure",
    "Anthropomorphic",
    "Avant Garde",
    "Award Winning",
    "Boys Love",
    "CGDCT",
    "Childcare",
    "Combat Sports",
    "Comedy",
    "Crossdressing",
    "Delinquents",
    "Detective",
    "Drama",
    "Ecchi",
    "Educational",
    "Eligible Titles for You Should Read This",
    "Erotica",
    "Fantasy",
    "Gag Humor",
    "Girls Love",
    "Gore",
    "Gourmet",
    "Harem",
    "Hentai",
    "High Stakes Game",
    "Historical",
    "Horror",
    "Idols (Female)",
    "Idols (Male)",
    "Isekai",
    "Iyashikei",
    "Josei",
    "Kids",
    "Love Polygon",
    "Love Status Quo",
    "Magical Sex Shift",
    "Mahou Shoujo",
    "Martial Arts",
    "Mecha",
    "Medical",
    "Memoir",
    "Military",
    "Music",
    "Mystery",
    "Mythology",
    "Organized Crime",
    "Otaku Culture",
    "Parody",
    "Performing Arts",
    "Pets",
    "Psychological",
    "Racing",
    "Reincarnation",
    "Reverse Harem",
    "Romance",
    "Samurai",
    "School",
    "Sci-Fi",
    "Seinen",
    "Shoujo",
    "Shounen",
    "Showbiz",
    "Slice of Life",
    "Space",
    "Sports",
    "Strategy Game",
    "Super Power",
    "Supernatural",
    "Survival",
    "Suspense",
    "Team Sports",
    "Time Travel",
    "Urban Fantasy",
    "Vampire",
    "Video Game",
    "Villainess",
    "Visual Arts",
    "Workplace",
] as const;

export const nsfwKnownValues = ["gray", "white"] as const;

export const weekdayKnownValues = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
] as const;

export const animeRelationTypeValues = [
    "alternative_setting",
    "alternative_version",
    "character",
    "full_story",
    "parent_story",
    "prequel",
    "sequel",
    "side_story",
    "spin_off",
    "summary",
] as const;

export const animeRelationTypeFormattedValues = [
    "Alternative setting",
    "Alternative version",
    "Character",
    "Full story",
    "Parent story",
    "Prequel",
    "Sequel",
    "Side story",
    "Spin-off",
    "Summary",
] as const;

export const mangaRelationTypeValues = [
    "adaptation",
    "alternative_setting",
    "alternative_version",
    "character",
    "parent_story",
    "prequel",
    "sequel",
    "side_story",
    "spin_off",
] as const;

export const mangaRelationTypeFormattedValues = [
    "Adaptation",
    "Alternative setting",
    "Alternative version",
    "Character",
    "Parent story",
    "Prequel",
    "Sequel",
    "Side story",
    "Spin-off",
] as const;

export const authorRoleKnownValues = ["Art", "Story", "Story & Art"] as const;

export const priorityValues = [0, 1, 2] as const;

export const scoreValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const rewatchValueValues = [0, 1, 2, 3, 4, 5] as const;

export const rereadValueValues = [0, 1, 2, 3, 4, 5] as const;

export const animeStatusValues = [
    "currently_airing",
    "finished_airing",
    "not_yet_aired",
] as const;

export const animeListStatusValues = [
    "watching",
    "completed",
    "plan_to_watch",
    "on_hold",
    "dropped",
] as const;

export const animeMediaTypeKnownValues = [
    "tv",
    "ona",
    "ova",
    "movie",
    "special",
    "music",
    "tv_special",
    "cm",
    "pv",
] as const;

export const animeSourceKnownValues = [
    "original",
    "manga",
    "web_manga",
    "light_novel",
    "web_novel",
    "visual_novel",
    "mixed_media",
    "4_koma_manga",
    "book",
    "novel",
    "game",
    "card_game",
    "music",
    "radio",
    "picture_book",
] as const;

export const animeRatingValues = ["g", "pg", "pg_13", "r", "r+", "rx"] as const;

export const animeSeasonValues = [
    "winter",
    "spring",
    "summer",
    "fall",
] as const;

export const mangaStatusValues = [
    "currently_publishing",
    "finished",
    "on_hiatus",
    "discontinued",
    "not_yet_published",
] as const;

export const mangaListStatusValues = [
    "reading",
    "completed",
    "plan_to_read",
    "on_hold",
    "dropped",
] as const;

export const mangaMediaTypeKnownValues = [
    "manga",
    "novel",
    "light_novel",
    "one_shot",
    "doujinshi",
    "manhwa",
    "manhua",
] as const;

export const serializationRoleKnownValues = [] as const;

export const GenreName = openStringEnum(genreNameValues);

export const Nsfw = openStringEnum(nsfwKnownValues);

export const Weekday = openStringEnum(weekdayKnownValues);

export const AnimeRelationType = openStringEnum(animeRelationTypeValues);

export const AnimeRelationTypeFormatted = openStringEnum(
    animeRelationTypeFormattedValues,
);

export const MangaRelationType = openStringEnum(mangaRelationTypeValues);

export const MangaRelationTypeFormatted = openStringEnum(
    mangaRelationTypeFormattedValues,
);

export const AuthorRole = openStringEnum(authorRoleKnownValues);

export const Priority = closedNumberEnum(priorityValues);

export const Score = closedNumberEnum(scoreValues);

export const RewatchValue = closedNumberEnum(rewatchValueValues);

export const RereadValue = closedNumberEnum(rereadValueValues);

export const AnimeStatus = closedStringEnum(animeStatusValues);

export const AnimeListStatus = closedStringEnum(animeListStatusValues);

export const AnimeMediaType = openStringEnum(animeMediaTypeKnownValues);

export const AnimeSource = openStringEnum(animeSourceKnownValues);

export const AnimeRating = closedStringEnum(animeRatingValues);

export const AnimeSeason = closedStringEnum(animeSeasonValues);

export const MangaStatus = closedStringEnum(mangaStatusValues);

export const MangaListStatus = closedStringEnum(mangaListStatusValues);

export const MangaMediaType = openStringEnum(mangaMediaTypeKnownValues);

export const SerializationRole = openStringEnum(serializationRoleKnownValues);

export const AlternativeTitles = z.object({
    en: z.string().optional(),
    ja: z.string().optional(),
    synonyms: z.string().array(),
});

export const MainPicture = z.object({
    large: UrlString,
    medium: UrlString,
});

export const Picture = z.object({
    large: UrlString,
    medium: UrlString,
});

export const Genre = z.object({
    id: Integer,
    name: GenreName,
});

export const Ranking = z.object({
    previous_rank: Integer,
    rank: Integer,
});

export const MediaReference = z.object({
    id: Integer,
    main_picture: MainPicture,
    title: z.string(),
});

export const Recommendation = z.object({
    node: MediaReference,
    num_recommendations: Integer,
});

export const AnimeBroadcast = z.object({
    day_of_the_week: Weekday,
    start_time: TimeString,
});

export const AnimeStudio = z.object({
    id: Integer,
    name: z.string(),
});

export const AnimeStartSeason = z.object({
    season: AnimeSeason,
    year: Integer,
});

export const AnimeMyListStatus = z.object({
    comments: z.string(),
    finish_date: NullablePartialDateString.default(null),
    is_rewatching: z.boolean(),
    num_episodes_watched: Integer,
    num_times_rewatched: Integer,
    priority: Priority,
    rewatch_value: RewatchValue,
    score: Score,
    start_date: NullablePartialDateString.default(null),
    status: AnimeListStatus,
    tags: z.string().array(),
    updated_at: DatetimeString,
});

export const MangaAuthorNode = z.object({
    first_name: z.string(),
    id: Integer,
    last_name: z.string(),
});

export const MangaAuthor = z.object({
    node: MangaAuthorNode,
    role: AuthorRole,
});

export const MangaMyListStatus = z.object({
    comments: z.string(),
    finish_date: NullablePartialDateString.default(null),
    is_rereading: z.boolean(),
    num_chapters_read: Integer,
    num_times_reread: Integer,
    num_volumes_read: Integer,
    priority: Priority,
    reread_value: RereadValue,
    score: Score,
    start_date: NullablePartialDateString.default(null),
    status: MangaListStatus,
    tags: z.string().array(),
    updated_at: DatetimeString,
});

export const AnimeReference = MediaReference;

export const RelatedAnimeNode = AnimeReference.extend({
    average_episode_duration: Integer,
    broadcast: AnimeBroadcast,
    media_type: AnimeMediaType,
    my_list_status: AnimeMyListStatus,
    num_episodes: NullableInteger.default(null),
    rating: AnimeRating,
    source: AnimeSource,
    start_season: AnimeStartSeason,
    status: AnimeStatus,
    studios: AnimeStudio.array(),
});

export const RelatedAnimeReference = z.object({
    node: AnimeReference,
    relation_type: AnimeRelationType,
    relation_type_formatted: AnimeRelationTypeFormatted,
});

export const RelatedAnime = z.object({
    node: RelatedAnimeNode,
    relation_type: AnimeRelationType,
    relation_type_formatted: AnimeRelationTypeFormatted,
});

export const MangaReference = MediaReference;

export const RelatedMangaNode = MangaReference.extend({
    authors: MangaAuthor.array(),
    media_type: MangaMediaType,
    my_list_status: MangaMyListStatus,
    num_chapters: NullableInteger.default(null),
    num_volumes: NullableInteger.default(null),
    status: MangaStatus,
});

export const RelatedMangaReference = z.object({
    node: MangaReference,
    relation_type: MangaRelationType,
    relation_type_formatted: MangaRelationTypeFormatted,
});

export const RelatedManga = z.object({
    node: RelatedMangaNode,
    relation_type: MangaRelationType,
    relation_type_formatted: MangaRelationTypeFormatted,
});

export const AnimeOpeningTheme = z.object({
    anime_id: Integer,
    id: Integer,
    text: z.string(),
});

export const AnimeEndingTheme = z.object({
    anime_id: Integer,
    id: Integer,
    text: z.string(),
});

export const AnimeStatisticsStatus = z.object({
    completed: IntegerString,
    dropped: IntegerString,
    on_hold: IntegerString,
    plan_to_watch: IntegerString,
    watching: IntegerString,
});

export const AnimeStatistics = z.object({
    num_list_users: Integer,
    status: AnimeStatisticsStatus,
});

export const AnimeVideo = z.object({
    created_at: TimestampMsInteger,
    id: Integer,
    thumbnail: UrlString,
    title: z.string(),
    updated_at: TimestampMsInteger,
    url: UrlString,
});

export const SerializationNode = z.object({
    id: Integer,
    name: z.string(),
});

export const Serialization = z.object({
    node: SerializationNode,
    role: SerializationRole,
});

export const Anime = RelatedAnimeNode.extend({
    alternative_titles: AlternativeTitles,
    created_at: DatetimeString,
    end_date: NullablePartialDateString.default(null),
    genres: Genre.array(),
    mean: BoundedMean,
    nsfw: Nsfw,
    num_list_users: Integer,
    num_scoring_users: Integer,
    popularity: Integer,
    rank: Integer,
    synopsis: z.string(),
    updated_at: DatetimeString,
});

export const AnimeRankingSpecific = z.object({
    ranking: Ranking,
});

export const AnimeRanking = Anime.extend(AnimeRankingSpecific.shape);

export const AnimeDetailsSpecific = z.object({
    background: z.string(),
    ending_themes: AnimeEndingTheme.array(),
    opening_themes: AnimeOpeningTheme.array(),
    pictures: Picture.array(),
    recommendations: Recommendation.array(),
    related_anime: RelatedAnimeReference.array(),
    related_manga: RelatedManga.array(),
    statistics: AnimeStatistics,
    videos: AnimeVideo.array(),
});

export const AnimeDetails = Anime.extend(AnimeDetailsSpecific.shape);

export const Manga = RelatedMangaNode.extend({
    alternative_titles: AlternativeTitles,
    created_at: DatetimeString,
    end_date: NullablePartialDateString.default(null),
    genres: Genre.array(),
    mean: BoundedMean,
    nsfw: Nsfw,
    num_list_users: Integer,
    num_scoring_users: Integer,
    popularity: Integer,
    rank: Integer,
    start_date: PartialDateString,
    synopsis: z.string(),
    updated_at: DatetimeString,
});

export const MangaRankingSpecific = z.object({
    ranking: Ranking,
});

export const MangaRanking = Manga.extend(MangaRankingSpecific.shape);

export const MangaDetailsSpecific = z.object({
    background: z.string(),
    pictures: Picture.array(),
    recommendations: Recommendation.array(),
    related_anime: RelatedAnime.array(),
    related_manga: RelatedMangaReference.array(),
    serialization: Serialization.array(),
});

export const MangaDetails = Manga.extend(MangaDetailsSpecific.shape);
