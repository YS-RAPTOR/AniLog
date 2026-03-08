import {
    animeListStatusValues,
    animeMediaTypeKnownValues,
    animeSeasonValues,
    animeStatusValues,
    mangaListStatusValues,
    mangaMediaTypeKnownValues,
    mangaStatusValues,
    weekdayKnownValues,
} from "@/lib/mal/api/schema";
import {
    animeListStatusEnum,
    animeMediaTypeEnum,
    animeRatingEnum,
    animeSeasonEnum,
    animeSourceEnum,
    animeStatusEnum,
    authorRoleEnum,
    genreNameEnum,
    mangaListStatusEnum,
    mangaMediaTypeEnum,
    mangaStatusEnum,
    nsfwEnum,
    priorityEnum,
    rereadValueEnum,
    rewatchValueEnum,
    weekdayEnum,
} from "@/lib/mal/list/expression/enum-descriptors";
import {
    arrayOf,
    nullable,
    scalarComparableType,
    scalar,
    union,
} from "@/lib/mal/list/expression/descriptors";
import { ValueExpression as AstValueExpression } from "@/lib/mal/list/expression/ast";
import { FieldDefinition } from "@/lib/mal/list/schema/fields";
import type { infer as ZodInfer } from "zod";

type SourceAvailability = ZodInfer<
    typeof FieldDefinition
>["source_availability"];
type ValueExpr = ZodInfer<typeof AstValueExpression>;

const animeSourceAvailability: SourceAvailability = [
    "anime_search",
    "anime_seasonal",
    "anime_ranking",
    "anime_user_list",
    "anime_suggestions",
];

const mangaSourceAvailability: SourceAvailability = [
    "manga_search",
    "manga_ranking",
    "manga_user_list",
];

const fieldRef = (key: string) => ({
    kind: "field_ref" as const,
    scope: "item",
    field_key: key,
});

const literal = (
    value: string | number | boolean | null | Date,
): ValueExpr => ({
    kind: "literal" as const,
    value,
});

const fn = (function_id: string, arguments_: ValueExpr[]): ValueExpr => ({
    kind: "function_expression" as const,
    function_id,
    arguments: arguments_,
});

const arrayExpression = (items: ValueExpr[]): ValueExpr => ({
    kind: "array_expression" as const,
    items,
});

const scalarNumberExpression = (expression: ValueExpr) => ({
    expression,
    type: nullable(scalar("number")),
});

const scalarStringExpression = (expression: ValueExpr) => ({
    expression,
    type: nullable(scalar("string")),
});

const orderedValue = (key: string, orderedValues: string[]) =>
    fn("match", [
        arrayExpression(
            orderedValues.map((value) =>
                fn("equals", [fieldRef(key), literal(value)]),
            ),
        ),
        arrayExpression(orderedValues.map((_, index) => literal(index))),
        literal(orderedValues.length),
    ]);

const orderedSorting = (
    key: string,
    direction: "asc" | "desc",
    orderedValues: string[],
) => [
    {
        id: key,
        expression: scalarNumberExpression(orderedValue(key, orderedValues)),
        direction,
    },
];

const orderedGrouping = (
    key: string,
    direction: "asc" | "desc",
    orderedValues: string[],
) => ({
    id: key,
    expression: {
        expression: fieldRef(key),
        type: nullable(scalarComparableType),
    },
    sorting: orderedSorting(key, direction, orderedValues),
});

const bucketGrouping = (
    id: string,
    conditions: ValueExpr[],
    labels: string[],
    fallbackLabel: string,
) => ({
    id,
    expression: scalarStringExpression(
        fn("match", [
            arrayExpression(conditions),
            arrayExpression(labels.map((label) => literal(label))),
            literal(fallbackLabel),
        ]),
    ),
    sorting: [
        {
            id,
            expression: scalarNumberExpression(
                fn("match", [
                    arrayExpression(conditions),
                    arrayExpression(labels.map((_, index) => literal(index))),
                    literal(labels.length),
                ]),
            ),
            direction: "asc" as const,
        },
    ],
});

const durationMinutes = (key: string) =>
    fn("divide", [fieldRef(key), literal(60)]);

const defaultSorting = (key: string, direction: "asc" | "desc") => [
    {
        id: key,
        expression: {
            expression: fieldRef(key),
            type: nullable(scalarComparableType),
        },
        direction,
    },
];

const defaultGrouping = (key: string, direction: "asc" | "desc") => ({
    id: key,
    expression: {
        expression: fieldRef(key),
        type: nullable(
            union([
                ...scalarComparableType.options,
                arrayOf(scalarComparableType),
            ]),
        ),
    },
    sorting: direction,
});

const fields: ZodInfer<typeof FieldDefinition>[] = [
    {
        key: "id",
        label: "ID",
        medium: "anime",
        source_path: "id",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("id", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "title",
        label: "Title",
        medium: "anime",
        source_path: "title",
        type: scalar("string"),
        defaults: {
            sorting: defaultSorting("title", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "main_picture.large",
        label: "Large Image",
        medium: "anime",
        source_path: "main_picture.large",
        type: scalar("url"),
        defaults: {},
        source_availability: animeSourceAvailability,
    },
    {
        key: "main_picture.medium",
        label: "Image",
        medium: "anime",
        source_path: "main_picture.medium",
        type: scalar("url"),
        defaults: {},
        source_availability: animeSourceAvailability,
    },
    {
        key: "average_episode_duration",
        label: "Average Episode Duration",
        medium: "anime",
        source_path: "average_episode_duration",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "average_episode_duration_bucket",
                [
                    fn("lt", [
                        durationMinutes("average_episode_duration"),
                        literal(18),
                    ]),
                ],
                ["< 18 min"],
                "18+ min",
            ),
            sorting: defaultSorting("average_episode_duration", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "broadcast.day_of_the_week",
        label: "Broadcast Day of the Week",
        medium: "anime",
        source_path: "broadcast.day_of_the_week",
        type: weekdayEnum,
        defaults: {
            grouping: orderedGrouping("broadcast.day_of_the_week", "asc", [
                ...weekdayKnownValues,
            ]),
            sorting: orderedSorting("broadcast.day_of_the_week", "asc", [
                ...weekdayKnownValues,
            ]),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "broadcast.start_time",
        label: "Broadcast Time",
        medium: "anime",
        source_path: "broadcast.start_time",
        type: scalar("string"),
        defaults: {
            grouping: defaultGrouping("broadcast.start_time", "asc"),
            sorting: defaultSorting("broadcast.start_time", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "media_type",
        label: "Media Type",
        medium: "anime",
        source_path: "media_type",
        type: animeMediaTypeEnum,
        defaults: {
            grouping: orderedGrouping("media_type", "asc", [
                ...animeMediaTypeKnownValues,
            ]),
            sorting: orderedSorting("media_type", "asc", [
                ...animeMediaTypeKnownValues,
            ]),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.comments",
        label: "My List Comments",
        medium: "anime",
        source_path: "my_list_status.comments",
        type: scalar("string"),
        defaults: {},
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.finish_date",
        label: "My List Completed Date",
        medium: "anime",
        source_path: "my_list_status.finish_date",
        type: nullable(scalar("date")),
        defaults: {
            sorting: defaultSorting("my_list_status.finish_date", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.is_rewatching",
        label: "Is Rewatching",
        medium: "anime",
        source_path: "my_list_status.is_rewatching",
        type: scalar("boolean"),
        defaults: {
            grouping: defaultGrouping("my_list_status.is_rewatching", "desc"),
            sorting: defaultSorting("my_list_status.is_rewatching", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.num_episodes_watched",
        label: "Episodes Watched",
        medium: "anime",
        source_path: "my_list_status.num_episodes_watched",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping(
                "my_list_status.num_episodes_watched",
                "desc",
            ),
            sorting: defaultSorting(
                "my_list_status.num_episodes_watched",
                "desc",
            ),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.num_times_rewatched",
        label: "Times Rewatched",
        medium: "anime",
        source_path: "my_list_status.num_times_rewatched",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping(
                "my_list_status.num_times_rewatched",
                "desc",
            ),
            sorting: defaultSorting(
                "my_list_status.num_times_rewatched",
                "desc",
            ),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.priority",
        label: "My List Priority",
        medium: "anime",
        source_path: "my_list_status.priority",
        type: priorityEnum,
        defaults: {
            grouping: defaultGrouping("my_list_status.priority", "desc"),
            sorting: defaultSorting("my_list_status.priority", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.rewatch_value",
        label: "Rewatch Value",
        medium: "anime",
        source_path: "my_list_status.rewatch_value",
        type: rewatchValueEnum,
        defaults: {
            grouping: defaultGrouping("my_list_status.rewatch_value", "desc"),
            sorting: defaultSorting("my_list_status.rewatch_value", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.score",
        label: "My List Score",
        medium: "anime",
        source_path: "my_list_status.score",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping("my_list_status.score", "desc"),
            sorting: defaultSorting("my_list_status.score", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.start_date",
        label: "My List Start Watching Date",
        medium: "anime",
        source_path: "my_list_status.start_date",
        type: nullable(scalar("date")),
        defaults: {
            sorting: defaultSorting("my_list_status.start_date", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.status",
        label: "My List Status",
        medium: "anime",
        source_path: "my_list_status.status",
        type: animeListStatusEnum,
        defaults: {
            grouping: orderedGrouping("my_list_status.status", "asc", [
                ...animeListStatusValues,
            ]),
            sorting: orderedSorting("my_list_status.status", "asc", [
                ...animeListStatusValues,
            ]),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.tags",
        label: "My List Tags",
        medium: "anime",
        source_path: "my_list_status.tags",
        type: arrayOf(scalar("string")),
        defaults: {
            grouping: defaultGrouping("my_list_status.tags", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "my_list_status.updated_at",
        label: "My List Last Updated Date",
        medium: "anime",
        source_path: "my_list_status.updated_at",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("my_list_status.updated_at", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "num_episodes",
        label: "Episode Count",
        medium: "anime",
        source_path: "num_episodes",
        type: nullable(scalar("number")),
        defaults: {
            grouping: defaultGrouping("num_episodes", "desc"),
            sorting: defaultSorting("num_episodes", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "rating",
        label: "Age Rating",
        medium: "anime",
        source_path: "rating",
        type: animeRatingEnum,
        defaults: {
            grouping: defaultGrouping("rating", "asc"),
            sorting: defaultSorting("rating", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "source",
        label: "Source Material",
        medium: "anime",
        source_path: "source",
        type: animeSourceEnum,
        defaults: {
            grouping: defaultGrouping("source", "asc"),
            sorting: defaultSorting("source", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "start_season.season",
        label: "Start Season",
        medium: "anime",
        source_path: "start_season.season",
        type: animeSeasonEnum,
        defaults: {
            grouping: orderedGrouping("start_season.season", "asc", [
                ...animeSeasonValues,
            ]),
            sorting: orderedSorting("start_season.season", "asc", [
                ...animeSeasonValues,
            ]),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "start_season.year",
        label: "Start Year",
        medium: "anime",
        source_path: "start_season.year",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping("start_season.year", "desc"),
            sorting: defaultSorting("start_season.year", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "status",
        label: "Release Status",
        medium: "anime",
        source_path: "status",
        type: animeStatusEnum,
        defaults: {
            grouping: orderedGrouping("status", "asc", [...animeStatusValues]),
            sorting: orderedSorting("status", "asc", [...animeStatusValues]),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "studios[].id",
        label: "Studio IDs",
        medium: "anime",
        source_path: "studios[].id",
        type: arrayOf(scalar("number")),
        defaults: {
            grouping: defaultGrouping("studios[].id", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "studios[].name",
        label: "Studios",
        medium: "anime",
        source_path: "studios[].name",
        type: arrayOf(scalar("string")),
        defaults: {
            grouping: defaultGrouping("studios[].name", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "alternative_titles.en",
        label: "English Title",
        medium: "anime",
        source_path: "alternative_titles.en",
        type: scalar("string"),
        defaults: {
            sorting: defaultSorting("alternative_titles.en", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "alternative_titles.ja",
        label: "Japanese Title",
        medium: "anime",
        source_path: "alternative_titles.ja",
        type: scalar("string"),
        defaults: {
            sorting: defaultSorting("alternative_titles.ja", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "alternative_titles.synonyms",
        label: "Title Synonyms",
        medium: "anime",
        source_path: "alternative_titles.synonyms",
        type: arrayOf(scalar("string")),
        defaults: {},
        source_availability: animeSourceAvailability,
    },
    {
        key: "created_at",
        label: "Created Date",
        medium: "anime",
        source_path: "created_at",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("created_at", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "end_date",
        label: "End Date",
        medium: "anime",
        source_path: "end_date",
        type: nullable(scalar("date")),
        defaults: {
            sorting: defaultSorting("end_date", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "genres[].id",
        label: "Genre IDs",
        medium: "anime",
        source_path: "genres[].id",
        type: arrayOf(scalar("number")),
        defaults: {
            grouping: defaultGrouping("genres[].id", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "genres[].name",
        label: "Genres",
        medium: "anime",
        source_path: "genres[].name",
        type: arrayOf(genreNameEnum),
        defaults: {
            grouping: defaultGrouping("genres[].name", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "mean",
        label: "Mean Score",
        medium: "anime",
        source_path: "mean",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "mean_bucket",
                [
                    fn("lt", [fieldRef("mean"), literal(1)]),
                    fn("lt", [fieldRef("mean"), literal(2)]),
                    fn("lt", [fieldRef("mean"), literal(3)]),
                    fn("lt", [fieldRef("mean"), literal(4)]),
                    fn("lt", [fieldRef("mean"), literal(5)]),
                    fn("lt", [fieldRef("mean"), literal(6)]),
                    fn("lt", [fieldRef("mean"), literal(7)]),
                    fn("lt", [fieldRef("mean"), literal(8)]),
                    fn("lt", [fieldRef("mean"), literal(9)]),
                    fn("lt", [fieldRef("mean"), literal(10)]),
                ],
                [
                    "0-1",
                    "1-2",
                    "2-3",
                    "3-4",
                    "4-5",
                    "5-6",
                    "6-7",
                    "7-8",
                    "8-9",
                    "9-10",
                ],
                "Unknown",
            ),
            sorting: defaultSorting("mean", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "nsfw",
        label: "NSFW Classification",
        medium: "anime",
        source_path: "nsfw",
        type: nsfwEnum,
        defaults: {
            grouping: defaultGrouping("nsfw", "asc"),
            sorting: defaultSorting("nsfw", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "num_list_users",
        label: "No of Users with this Anime on their List",
        medium: "anime",
        source_path: "num_list_users",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "num_list_users_bucket",
                [
                    fn("lt", [fieldRef("num_list_users"), literal(1000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(10000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(50000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(100000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(250000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(500000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(750000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(1000000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(1500000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(2000000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(2500000)]),
                ],
                [
                    "< 1,000",
                    "1,000 - 9,999",
                    "10,000 - 49,999",
                    "50,000 - 99,999",
                    "100,000 - 249,999",
                    "250,000 - 499,999",
                    "500,000 - 749,999",
                    "750,000 - 999,999",
                    "1,000,000 - 1,499,999",
                    "1,500,000 - 1,999,999",
                    "2,000,000 - 2,499,999",
                ],
                "2,500,000+",
            ),
            sorting: defaultSorting("num_list_users", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "num_scoring_users",
        label: "No of Users Who Scored This Anime",
        medium: "anime",
        source_path: "num_scoring_users",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "num_scoring_users_bucket",
                [
                    fn("lt", [fieldRef("num_scoring_users"), literal(1000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(10000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(50000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(100000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(250000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(500000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(750000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(1000000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(1500000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(2000000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(2500000)]),
                ],
                [
                    "< 1,000",
                    "1,000 - 9,999",
                    "10,000 - 49,999",
                    "50,000 - 99,999",
                    "100,000 - 249,999",
                    "250,000 - 499,999",
                    "500,000 - 749,999",
                    "750,000 - 999,999",
                    "1,000,000 - 1,499,999",
                    "1,500,000 - 1,999,999",
                    "2,000,000 - 2,499,999",
                ],
                "2,500,000+",
            ),
            sorting: defaultSorting("num_scoring_users", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "popularity",
        label: "Popularity",
        medium: "anime",
        source_path: "popularity",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("popularity", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "rank",
        label: "Rank",
        medium: "anime",
        source_path: "rank",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("rank", "asc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "synopsis",
        label: "Synopsis",
        medium: "anime",
        source_path: "synopsis",
        type: scalar("string"),
        defaults: {},
        source_availability: animeSourceAvailability,
    },
    {
        key: "updated_at",
        label: "Last Updated Date",
        medium: "anime",
        source_path: "updated_at",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("updated_at", "desc"),
        },
        source_availability: animeSourceAvailability,
    },
    {
        key: "ranking.previous_rank",
        label: "Previous Ranking Position",
        medium: "anime",
        source_path: "ranking.previous_rank",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("ranking.previous_rank", "asc"),
        },
        source_availability: ["anime_ranking"],
    },
    {
        key: "ranking.rank",
        label: "Ranking Position",
        medium: "anime",
        source_path: "ranking.rank",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("ranking.rank", "asc"),
        },
        source_availability: ["anime_ranking"],
    },
    {
        key: "id",
        label: "ID",
        medium: "manga",
        source_path: "id",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping("id", "asc"),
            sorting: defaultSorting("id", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "title",
        label: "Title",
        medium: "manga",
        source_path: "title",
        type: scalar("string"),
        defaults: {
            grouping: defaultGrouping("title", "asc"),
            sorting: defaultSorting("title", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "main_picture.large",
        label: "Large Image",
        medium: "manga",
        source_path: "main_picture.large",
        type: scalar("url"),
        defaults: {},
        source_availability: mangaSourceAvailability,
    },
    {
        key: "main_picture.medium",
        label: "Image",
        medium: "manga",
        source_path: "main_picture.medium",
        type: scalar("url"),
        defaults: {},
        source_availability: mangaSourceAvailability,
    },
    {
        key: "authors[].node.first_name",
        label: "Author First Names",
        medium: "manga",
        source_path: "authors[].node.first_name",
        type: arrayOf(scalar("string")),
        defaults: {
            grouping: defaultGrouping("authors[].node.first_name", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "authors[].node.id",
        label: "Author IDs",
        medium: "manga",
        source_path: "authors[].node.id",
        type: arrayOf(scalar("number")),
        defaults: {
            grouping: defaultGrouping("authors[].node.id", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "authors[].node.last_name",
        label: "Author Last Names",
        medium: "manga",
        source_path: "authors[].node.last_name",
        type: arrayOf(scalar("string")),
        defaults: {
            grouping: defaultGrouping("authors[].node.last_name", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "authors[].role",
        label: "Author Roles",
        medium: "manga",
        source_path: "authors[].role",
        type: arrayOf(authorRoleEnum),
        defaults: {
            grouping: defaultGrouping("authors[].role", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "media_type",
        label: "Media Type",
        medium: "manga",
        source_path: "media_type",
        type: mangaMediaTypeEnum,
        defaults: {
            grouping: orderedGrouping("media_type", "asc", [
                ...mangaMediaTypeKnownValues,
            ]),
            sorting: orderedSorting("media_type", "asc", [
                ...mangaMediaTypeKnownValues,
            ]),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.comments",
        label: "My List Comments",
        medium: "manga",
        source_path: "my_list_status.comments",
        type: scalar("string"),
        defaults: {},
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.finish_date",
        label: "My List Completed Date",
        medium: "manga",
        source_path: "my_list_status.finish_date",
        type: nullable(scalar("date")),
        defaults: {
            sorting: defaultSorting("my_list_status.finish_date", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.is_rereading",
        label: "Is Rereading",
        medium: "manga",
        source_path: "my_list_status.is_rereading",
        type: scalar("boolean"),
        defaults: {
            grouping: defaultGrouping("my_list_status.is_rereading", "desc"),
            sorting: defaultSorting("my_list_status.is_rereading", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.num_chapters_read",
        label: "Chapters Read",
        medium: "manga",
        source_path: "my_list_status.num_chapters_read",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping(
                "my_list_status.num_chapters_read",
                "desc",
            ),
            sorting: defaultSorting("my_list_status.num_chapters_read", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.num_times_reread",
        label: "Times Reread",
        medium: "manga",
        source_path: "my_list_status.num_times_reread",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping(
                "my_list_status.num_times_reread",
                "desc",
            ),
            sorting: defaultSorting("my_list_status.num_times_reread", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.num_volumes_read",
        label: "Volumes Read",
        medium: "manga",
        source_path: "my_list_status.num_volumes_read",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping(
                "my_list_status.num_volumes_read",
                "desc",
            ),
            sorting: defaultSorting("my_list_status.num_volumes_read", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.priority",
        label: "My List Priority",
        medium: "manga",
        source_path: "my_list_status.priority",
        type: priorityEnum,
        defaults: {
            grouping: defaultGrouping("my_list_status.priority", "desc"),
            sorting: defaultSorting("my_list_status.priority", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.reread_value",
        label: "Reread Value",
        medium: "manga",
        source_path: "my_list_status.reread_value",
        type: rereadValueEnum,
        defaults: {
            grouping: defaultGrouping("my_list_status.reread_value", "desc"),
            sorting: defaultSorting("my_list_status.reread_value", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.score",
        label: "My List Score",
        medium: "manga",
        source_path: "my_list_status.score",
        type: scalar("number"),
        defaults: {
            grouping: defaultGrouping("my_list_status.score", "desc"),
            sorting: defaultSorting("my_list_status.score", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.start_date",
        label: "My List Start Reading Date",
        medium: "manga",
        source_path: "my_list_status.start_date",
        type: nullable(scalar("date")),
        defaults: {
            grouping: defaultGrouping("my_list_status.start_date", "desc"),
            sorting: defaultSorting("my_list_status.start_date", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.status",
        label: "My List Status",
        medium: "manga",
        source_path: "my_list_status.status",
        type: mangaListStatusEnum,
        defaults: {
            grouping: orderedGrouping("my_list_status.status", "asc", [
                ...mangaListStatusValues,
            ]),
            sorting: orderedSorting("my_list_status.status", "asc", [
                ...mangaListStatusValues,
            ]),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.tags",
        label: "My List Tags",
        medium: "manga",
        source_path: "my_list_status.tags",
        type: arrayOf(scalar("string")),
        defaults: {
            grouping: defaultGrouping("my_list_status.tags", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "my_list_status.updated_at",
        label: "My List Last Updated Date",
        medium: "manga",
        source_path: "my_list_status.updated_at",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("my_list_status.updated_at", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "num_chapters",
        label: "Chapter Count",
        medium: "manga",
        source_path: "num_chapters",
        type: nullable(scalar("number")),
        defaults: {
            grouping: defaultGrouping("num_chapters", "desc"),
            sorting: defaultSorting("num_chapters", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "num_volumes",
        label: "Volume Count",
        medium: "manga",
        source_path: "num_volumes",
        type: nullable(scalar("number")),
        defaults: {
            grouping: defaultGrouping("num_volumes", "desc"),
            sorting: defaultSorting("num_volumes", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "status",
        label: "Publication Status",
        medium: "manga",
        source_path: "status",
        type: mangaStatusEnum,
        defaults: {
            grouping: orderedGrouping("status", "asc", [...mangaStatusValues]),
            sorting: orderedSorting("status", "asc", [...mangaStatusValues]),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "alternative_titles.en",
        label: "English Title",
        medium: "manga",
        source_path: "alternative_titles.en",
        type: scalar("string"),
        defaults: {
            sorting: defaultSorting("alternative_titles.en", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "alternative_titles.ja",
        label: "Japanese Title",
        medium: "manga",
        source_path: "alternative_titles.ja",
        type: scalar("string"),
        defaults: {
            sorting: defaultSorting("alternative_titles.ja", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "alternative_titles.synonyms",
        label: "Title Synonyms",
        medium: "manga",
        source_path: "alternative_titles.synonyms",
        type: arrayOf(scalar("string")),
        defaults: {
            grouping: defaultGrouping("alternative_titles.synonyms", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "created_at",
        label: "Created Date",
        medium: "manga",
        source_path: "created_at",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("created_at", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "end_date",
        label: "End Date",
        medium: "manga",
        source_path: "end_date",
        type: nullable(scalar("date")),
        defaults: {
            sorting: defaultSorting("end_date", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "genres[].id",
        label: "Genre IDs",
        medium: "manga",
        source_path: "genres[].id",
        type: arrayOf(scalar("number")),
        defaults: {
            grouping: defaultGrouping("genres[].id", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "genres[].name",
        label: "Genres",
        medium: "manga",
        source_path: "genres[].name",
        type: arrayOf(genreNameEnum),
        defaults: {
            grouping: defaultGrouping("genres[].name", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "mean",
        label: "Mean Score",
        medium: "manga",
        source_path: "mean",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "mean_bucket",
                [
                    fn("lt", [fieldRef("mean"), literal(1)]),
                    fn("lt", [fieldRef("mean"), literal(2)]),
                    fn("lt", [fieldRef("mean"), literal(3)]),
                    fn("lt", [fieldRef("mean"), literal(4)]),
                    fn("lt", [fieldRef("mean"), literal(5)]),
                    fn("lt", [fieldRef("mean"), literal(6)]),
                    fn("lt", [fieldRef("mean"), literal(7)]),
                    fn("lt", [fieldRef("mean"), literal(8)]),
                    fn("lt", [fieldRef("mean"), literal(9)]),
                    fn("lt", [fieldRef("mean"), literal(10)]),
                ],
                [
                    "0-1",
                    "1-2",
                    "2-3",
                    "3-4",
                    "4-5",
                    "5-6",
                    "6-7",
                    "7-8",
                    "8-9",
                    "9-10",
                ],
                "10+",
            ),
            sorting: defaultSorting("mean", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "nsfw",
        label: "NSFW Classification",
        medium: "manga",
        source_path: "nsfw",
        type: nsfwEnum,
        defaults: {
            grouping: defaultGrouping("nsfw", "asc"),
            sorting: defaultSorting("nsfw", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "num_list_users",
        label: "No of Users with this Manga on their List",
        medium: "manga",
        source_path: "num_list_users",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "num_list_users_bucket",
                [
                    fn("lt", [fieldRef("num_list_users"), literal(1000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(10000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(50000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(100000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(250000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(500000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(750000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(1000000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(1500000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(2000000)]),
                    fn("lt", [fieldRef("num_list_users"), literal(2500000)]),
                ],
                [
                    "< 1,000",
                    "1,000 - 9,999",
                    "10,000 - 49,999",
                    "50,000 - 99,999",
                    "100,000 - 249,999",
                    "250,000 - 499,999",
                    "500,000 - 749,999",
                    "750,000 - 999,999",
                    "1,000,000 - 1,499,999",
                    "1,500,000 - 1,999,999",
                    "2,000,000 - 2,499,999",
                ],
                "2,500,000+",
            ),
            sorting: defaultSorting("num_list_users", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "num_scoring_users",
        label: "No of Users Who Scored This Manga",
        medium: "manga",
        source_path: "num_scoring_users",
        type: scalar("number"),
        defaults: {
            grouping: bucketGrouping(
                "num_scoring_users_bucket",
                [
                    fn("lt", [fieldRef("num_scoring_users"), literal(1000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(10000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(50000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(100000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(250000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(500000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(750000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(1000000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(1500000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(2000000)]),
                    fn("lt", [fieldRef("num_scoring_users"), literal(2500000)]),
                ],
                [
                    "< 1,000",
                    "1,000 - 9,999",
                    "10,000 - 49,999",
                    "50,000 - 99,999",
                    "100,000 - 249,999",
                    "250,000 - 499,999",
                    "500,000 - 749,999",
                    "750,000 - 999,999",
                    "1,000,000 - 1,499,999",
                    "1,500,000 - 1,999,999",
                    "2,000,000 - 2,499,999",
                ],
                "2,500,000+",
            ),
            sorting: defaultSorting("num_scoring_users", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "popularity",
        label: "Popularity",
        medium: "manga",
        source_path: "popularity",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("popularity", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "rank",
        label: "Rank",
        medium: "manga",
        source_path: "rank",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("rank", "asc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "start_date",
        label: "Start Date",
        medium: "manga",
        source_path: "start_date",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("start_date", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "synopsis",
        label: "Synopsis",
        medium: "manga",
        source_path: "synopsis",
        type: scalar("string"),
        defaults: {},
        source_availability: mangaSourceAvailability,
    },
    {
        key: "updated_at",
        label: "Last Updated Date",
        medium: "manga",
        source_path: "updated_at",
        type: scalar("date"),
        defaults: {
            sorting: defaultSorting("updated_at", "desc"),
        },
        source_availability: mangaSourceAvailability,
    },
    {
        key: "ranking.previous_rank",
        label: "Previous Ranking Position",
        medium: "manga",
        source_path: "ranking.previous_rank",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("ranking.previous_rank", "asc"),
        },
        source_availability: ["manga_ranking"],
    },
    {
        key: "ranking.rank",
        label: "Ranking Position",
        medium: "manga",
        source_path: "ranking.rank",
        type: scalar("number"),
        defaults: {
            sorting: defaultSorting("ranking.rank", "asc"),
        },
        source_availability: ["manga_ranking"],
    },
];

export const fieldDefinitions = FieldDefinition.array().parse(fields);

export const fieldDefinitionsByKey = new Map(
    fieldDefinitions.map((definition) => [definition.key, definition] as const),
);

export const animeFieldDefinitions = fieldDefinitions.filter(
    (definition) => definition.medium === "anime",
);

export const mangaFieldDefinitions = fieldDefinitions.filter(
    (definition) => definition.medium === "manga",
);
