---
name: myanimelist
description: Expert operational guide for MyAnimeList v2 API endpoints, auth, parameters, and safe list management
compatibility: opencode
metadata:
  api: myanimelist-v2
  audience: integrators
  scope: anime-manga-user-forum
---
## What I do
- Provide full endpoint map for anime, manga, user lists, forum, and user profile
- Explain auth modes and when OAuth vs client ID is required
- Specify parameter defaults, limits, enums, and safe patterns
- Show paging strategy and fields selection to avoid missing data
- Offer copy-pasteable request templates and guardrails for write operations

## When to use me
Use this skill whenever you need to search, list, rank, or update anime/manga data or user lists via the MyAnimeList v2 API.

## Base URL and versioning
- Base URL: `https://api.myanimelist.net/v2`
- Versioning: major version in the URL; backward-incompatible changes bump version.

## Authentication
### OAuth (user-required)
- Flow: implicit OAuth2
- Authorization URL: `https://myanimelist.net/v1/oauth2/authorize`
- Scope: `write:users`
- Use OAuth for:
  - Any endpoint that updates user lists
  - User-specific suggestions
  - Access to `@me` list endpoints and user information

### Client ID (no user login)
- Header: `X-MAL-CLIENT-ID: <client_id>`
- Use for public read-only endpoints when user context is not required.

## Common response formats
### List / Pagination
```
{
  "data": [ ... ],
  "paging": {
    "previous": "https://xxx",
    "next": "https://xxx"
  }
}
```
- Use `paging.next` to continue pagination. It is a full URL.

### Error format
```
{
  "error": "invalid_token",
  "message": "token is invalid"
}
```

### Date / Time formats
- date-time: `2015-03-02T06:03:11+00:00`
- date: `2017-10-23` or `2017-10` or `2017`
- time: `01:35`

## Common parameters
### List pagination
- `limit`
- `offset`

### Fields selection
- Default responses are minimal.
- Use `fields` to request needed data.
- Example: `fields=synopsis,my_list_status{priority,comments}`

### NSFW
- Some endpoints exclude NSFW by default.
- Use `nsfw=true` or `nsfw=false`.

## Common status codes
- 400 Bad Request: invalid parameters
- 401 Unauthorized: invalid/expired token
- 403 Forbidden: DoS detected, etc.
- 404 Not Found: resource missing

## Endpoint map and details

### Anime
#### Search anime list
- `GET /anime`
- Auth: OAuth or Client ID
- Query:
  - `q` (string) search term
  - `limit` (int, default 100, max 100)
  - `offset` (int, default 0)
  - `fields` (string)

#### Anime details
- `GET /anime/{anime_id}`
- Auth: OAuth or Client ID
- Query:
  - `fields` (string)

#### Anime ranking
- `GET /anime/ranking`
- Auth: OAuth or Client ID
- Query:
  - `ranking_type` (required):
    - `all`, `airing`, `upcoming`, `tv`, `ova`, `movie`, `special`, `bypopularity`, `favorite`
  - `limit` (int, default 100, max 500)
  - `offset` (int, default 0)
  - `fields` (string)

#### Seasonal anime
- `GET /anime/season/{year}/{season}`
- Auth: OAuth or Client ID
- Path:
  - `year` (int)
  - `season` (string): `winter|spring|summer|fall`
- Query:
  - `sort` (string): `anime_score` or `anime_num_list_users` (descending)
  - `limit` (int, default 100, max 500)
  - `offset` (int, default 0)
  - `fields` (string)

#### Suggested anime (authorized user)
- `GET /anime/suggestions`
- Auth: OAuth only (`write:users`)
- Query:
  - `limit` (int, default 100, max 100)
  - `offset` (int, default 0)
  - `fields` (string)

### User anime list
#### Update my anime list status
- `PUT /anime/{anime_id}/my_list_status`
- Auth: OAuth only (`write:users`)
- Body (application/x-www-form-urlencoded), all optional:
  - `status`: `watching|completed|on_hold|dropped|plan_to_watch`
  - `is_rewatching` (boolean)
  - `score` (int 0-10)
  - `num_watched_episodes` (int)
  - `priority` (int 0-2)
  - `num_times_rewatched` (int)
  - `rewatch_value` (int 0-5)
  - `tags` (string)
  - `comments` (string)
- Behavior: updates only provided fields.

#### Delete my anime list item
- `DELETE /anime/{anime_id}/my_list_status`
- Auth: OAuth only (`write:users`)
- Notes: returns 404 if item does not exist; handle retries carefully.

#### Get user anime list
- `GET /users/{user_name}/animelist`
- Auth: OAuth or Client ID
- Path:
  - `user_name` string or `@me`
- Query:
  - `status`: `watching|completed|on_hold|dropped|plan_to_watch`
  - `sort`: `list_score|list_updated_at|anime_title|anime_start_date|anime_id`
  - `limit` (int, default 100, max 1000)
  - `offset` (int, default 0)
  - `fields` (string)

### Forum
#### Get forum boards
- `GET /forum/boards`
- Auth: OAuth or Client ID

#### Get forum topic detail
- `GET /forum/topic/{topic_id}`
- Auth: OAuth or Client ID
- Query:
  - `limit` (int <= 100, default 100)
  - `offset` (int, default 0)

#### Get forum topics
- `GET /forum/topics`
- Auth: OAuth or Client ID
- Query:
  - `board_id` (int)
  - `subboard_id` (int)
  - `limit` (int <= 100, default 100)
  - `offset` (int, default 0)
  - `sort` (string, only `recent`)
  - `q` (string)
  - `topic_user_name` (string)
  - `user_name` (string)

### Manga
#### Search manga list
- `GET /manga`
- Auth: OAuth or Client ID
- Query:
  - `q` (string)
  - `limit` (int, default 100, max 100)
  - `offset` (int, default 0)
  - `fields` (string)

#### Manga details
- `GET /manga/{manga_id}`
- Auth: OAuth or Client ID
- Query:
  - `fields` (string)

#### Manga ranking
- `GET /manga/ranking`
- Auth: OAuth or Client ID
- Query:
  - `ranking_type` (required):
    - `all`, `manga`, `novels`, `oneshots`, `doujin`, `manhwa`, `manhua`, `bypopularity`, `favorite`
  - `limit` (int, default 100, max 500)
  - `offset` (int, default 0)
  - `fields` (string)

### User manga list
#### Update my manga list status
- `PUT /manga/{manga_id}/my_list_status`
- Auth: OAuth only (`write:users`)
- Body (application/x-www-form-urlencoded), all optional:
  - `status`: `reading|completed|on_hold|dropped|plan_to_read`
  - `is_rereading` (boolean)
  - `score` (int 0-10)
  - `num_volumes_read` (int)
  - `num_chapters_read` (int)
  - `priority` (int 0-2)
  - `num_times_reread` (int)
  - `reread_value` (int 0-5)
  - `tags` (string)
  - `comments` (string)
- Behavior: updates only provided fields.

#### Delete my manga list item
- `DELETE /manga/{manga_id}/my_list_status`
- Auth: OAuth only (`write:users`)
- Notes: returns 404 if item does not exist.

#### Get user manga list
- `GET /users/{user_name}/mangalist`
- Auth: OAuth or Client ID
- Path:
  - `user_name` string or `@me`
- Query:
  - `status`: `reading|completed|on_hold|dropped|plan_to_read`
  - `sort`: `list_score|list_updated_at|manga_title|manga_start_date|manga_id`
  - `limit` (int, default 100, max 1000)
  - `offset` (int, default 0)
  - `fields` (string)

### User
#### Get my user information
- `GET /users/{user_name}`
- Auth: OAuth only (`write:users`)
- Path:
  - `user_name` must be `@me`
- Query:
  - `fields` (string)

## Response fields per endpoint
Field lists are stored per endpoint in `.agents/skills/myanimelist/endpoints/`. Each file contains dot-notation field paths (arrays use `[]`).

Index:
- `.agents/skills/myanimelist/endpoints/INDEX.md`

## Expert usage patterns

### Choose auth mode
- If no user context and no writes: use Client ID.
- If any `@me`, list updates, or suggestions: use OAuth.

### Fields strategy
- Start with minimal: `fields=id,title,main_picture,mean`
- Expand incrementally to avoid payload bloat.
- Nested fields use `{}` syntax (e.g., `my_list_status{status,score}`).

### Pagination strategy
- Prefer `paging.next` as the canonical next URL.
- Stop when `paging.next` is absent.

### Safe write updates
- Only send fields you intend to change.
- Avoid repeated DELETE retries if 404 occurs.

## Request templates

**Search anime (client ID):**
```
curl 'https://api.myanimelist.net/v2/anime?q=one&limit=4' \
  -H 'X-MAL-CLIENT-ID: YOUR_CLIENT_ID'
```

**Anime details (OAuth or client ID):**
```
curl 'https://api.myanimelist.net/v2/anime/30230?fields=id,title,mean,synopsis' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Anime ranking:**
```
curl 'https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=4' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Seasonal anime:**
```
curl 'https://api.myanimelist.net/v2/anime/season/2017/summer?limit=4' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Update anime list status:**
```
curl 'https://api.myanimelist.net/v2/anime/17074/my_list_status' \
  -X PUT \
  -d status=completed \
  -d score=8 \
  -d num_watched_episodes=3 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Delete anime list item:**
```
curl 'https://api.myanimelist.net/v2/anime/21/my_list_status' \
  -X DELETE \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Get own animelist with list status:**
```
curl 'https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status&limit=4' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Search manga:**
```
curl 'https://api.myanimelist.net/v2/manga?q=berserk' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Update manga list status:**
```
curl 'https://api.myanimelist.net/v2/manga/2/my_list_status' \
  -X PUT \
  -d status=completed \
  -d score=8 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Get forum boards:**
```
curl 'https://api.myanimelist.net/v2/forum/boards' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Get forum topic detail:**
```
curl 'https://api.myanimelist.net/v2/forum/topic/481' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Guardrails and pitfalls
- 401 means token invalid or expired.
- 404 on delete means item missing; do not treat as fatal if desired state is "not present".
- `fields` is required for most non-default data; missing fields are expected.
- Respect documented limits: list endpoints max 100 or 1000 as specified; ranking/seasonal max 500.
