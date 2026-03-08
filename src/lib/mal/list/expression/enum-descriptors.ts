import {
    animeListStatusValues,
    animeMediaTypeKnownValues,
    animeRatingValues,
    animeRelationTypeFormattedValues,
    animeRelationTypeValues,
    animeSeasonValues,
    animeSourceKnownValues,
    animeStatusValues,
    authorRoleKnownValues,
    genreNameValues,
    mangaListStatusValues,
    mangaMediaTypeKnownValues,
    mangaRelationTypeFormattedValues,
    mangaRelationTypeValues,
    mangaStatusValues,
    nsfwKnownValues,
    priorityValues,
    rereadValueValues,
    rewatchValueValues,
    scoreValues,
    serializationRoleKnownValues,
    weekdayKnownValues,
} from "@/lib/mal/api/schema";

export const genreNameEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...genreNameValues],
};
export const nsfwEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...nsfwKnownValues],
};
export const weekdayEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...weekdayKnownValues],
};
export const animeRelationTypeEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...animeRelationTypeValues],
};
export const animeRelationTypeFormattedEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...animeRelationTypeFormattedValues],
};
export const mangaRelationTypeEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...mangaRelationTypeValues],
};
export const mangaRelationTypeFormattedEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...mangaRelationTypeFormattedValues],
};
export const authorRoleEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...authorRoleKnownValues],
};
export const priorityEnum = {
    kind: "enum" as const,
    type: "number" as const,
    open: false,
    values: [...priorityValues],
};
export const scoreEnum = {
    kind: "enum" as const,
    type: "number" as const,
    open: false,
    values: [...scoreValues],
};
export const rewatchValueEnum = {
    kind: "enum" as const,
    type: "number" as const,
    open: false,
    values: [...rewatchValueValues],
};
export const rereadValueEnum = {
    kind: "enum" as const,
    type: "number" as const,
    open: false,
    values: [...rereadValueValues],
};
export const animeStatusEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: false,
    values: [...animeStatusValues],
};
export const animeListStatusEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: false,
    values: [...animeListStatusValues],
};
export const animeMediaTypeEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...animeMediaTypeKnownValues],
};
export const animeSourceEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...animeSourceKnownValues],
};
export const animeRatingEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: false,
    values: [...animeRatingValues],
};
export const animeSeasonEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: false,
    values: [...animeSeasonValues],
};
export const mangaStatusEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: false,
    values: [...mangaStatusValues],
};
export const mangaListStatusEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: false,
    values: [...mangaListStatusValues],
};
export const mangaMediaTypeEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...mangaMediaTypeKnownValues],
};
export const serializationRoleEnum = {
    kind: "enum" as const,
    type: "string" as const,
    open: true,
    values: [...serializationRoleKnownValues],
};
export const stringEnums = [
    genreNameEnum,
    nsfwEnum,
    weekdayEnum,
    animeRelationTypeEnum,
    animeRelationTypeFormattedEnum,
    mangaRelationTypeEnum,
    mangaRelationTypeFormattedEnum,
    authorRoleEnum,
    animeStatusEnum,
    animeListStatusEnum,
    animeMediaTypeEnum,
    animeSourceEnum,
    animeRatingEnum,
    animeSeasonEnum,
    mangaStatusEnum,
    mangaListStatusEnum,
    mangaMediaTypeEnum,
    serializationRoleEnum,
];

export const numberEnums = [
    priorityEnum,
    scoreEnum,
    rewatchValueEnum,
    rereadValueEnum,
];

export const allEnums = [...stringEnums, ...numberEnums];
