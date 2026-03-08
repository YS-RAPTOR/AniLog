# Common Manga Fields

Generated from `.agents/skills/myanimelist/endpoints/*.md` manga endpoints.
Common fields are intersected across GET manga endpoints; unique fields are computed across all included manga endpoints.

Endpoints included: 6

## Common Fields Across Manga Endpoints

- `alternative_titles`
- `alternative_titles.en`
- `alternative_titles.ja`
- `alternative_titles.synonyms`
- `alternative_titles.synonyms[]`
- `authors`
- `authors[]`
- `authors[].node`
- `authors[].node.first_name`
- `authors[].node.id`
- `authors[].node.last_name`
- `authors[].role`
- `created_at`
- `end_date`
- `genres`
- `genres[]`
- `genres[].id`
- `genres[].name`
- `id`
- `main_picture`
- `main_picture.large`
- `main_picture.medium`
- `mean`
- `media_type`
- `my_list_status`
- `my_list_status.comments`
- `my_list_status.finish_date`
- `my_list_status.is_rereading`
- `my_list_status.num_chapters_read`
- `my_list_status.num_times_reread`
- `my_list_status.num_volumes_read`
- `my_list_status.priority`
- `my_list_status.reread_value`
- `my_list_status.score`
- `my_list_status.start_date`
- `my_list_status.status`
- `my_list_status.tags`
- `my_list_status.tags[]`
- `my_list_status.updated_at`
- `nsfw`
- `num_chapters`
- `num_list_users`
- `num_scoring_users`
- `num_volumes`
- `popularity`
- `rank`
- `start_date`
- `status`
- `synopsis`
- `title`
- `updated_at`

## Unique Fields By Endpoint

### DELETE /manga/{manga_id}/my_list_status

- _(none)_

### GET /manga

- _(none)_

### GET /manga/ranking

- `ranking`
- `ranking.previous_rank`
- `ranking.rank`

### GET /manga/{manga_id}

- `background`
- `pictures`
- `pictures[]`
- `pictures[].large`
- `pictures[].medium`
- `recommendations`
- `recommendations[]`
- `recommendations[].node`
- `recommendations[].node.id`
- `recommendations[].node.main_picture`
- `recommendations[].node.main_picture.large`
- `recommendations[].node.main_picture.medium`
- `recommendations[].node.title`
- `recommendations[].num_recommendations`
- `related_anime`
- `related_anime[]`
- `related_anime[].node`
- `related_anime[].node.average_episode_duration`
- `related_anime[].node.broadcast`
- `related_anime[].node.broadcast.day_of_the_week`
- `related_anime[].node.broadcast.start_time`
- `related_anime[].node.media_type`
- `related_anime[].node.my_list_status`
- `related_anime[].node.my_list_status.comments`
- `related_anime[].node.my_list_status.finish_date`
- `related_anime[].node.my_list_status.is_rewatching`
- `related_anime[].node.my_list_status.num_episodes_watched`
- `related_anime[].node.my_list_status.num_times_rewatched`
- `related_anime[].node.my_list_status.priority`
- `related_anime[].node.my_list_status.rewatch_value`
- `related_anime[].node.my_list_status.score`
- `related_anime[].node.my_list_status.start_date`
- `related_anime[].node.my_list_status.status`
- `related_anime[].node.my_list_status.tags`
- `related_anime[].node.my_list_status.tags[]`
- `related_anime[].node.my_list_status.updated_at`
- `related_anime[].node.num_episodes`
- `related_anime[].node.rating`
- `related_anime[].node.source`
- `related_anime[].node.start_season`
- `related_anime[].node.start_season.season`
- `related_anime[].node.start_season.year`
- `related_anime[].node.status`
- `related_anime[].node.studios`
- `related_anime[].node.studios[]`
- `related_anime[].node.studios[].id`
- `related_anime[].node.studios[].name`
- `related_anime[].relation_type`
- `related_anime[].relation_type_formatted`
- `related_manga`
- `related_manga[]`
- `related_manga[].node`
- `related_manga[].node.id`
- `related_manga[].node.main_picture`
- `related_manga[].node.main_picture.large`
- `related_manga[].node.main_picture.medium`
- `related_manga[].node.title`
- `related_manga[].relation_type`
- `related_manga[].relation_type_formatted`
- `serialization`
- `serialization[]`
- `serialization[].node`
- `serialization[].node.id`
- `serialization[].node.name`
- `serialization[].role`

### GET /users/{user_name}/mangalist

- _(none)_

### PATCH /manga/{manga_id}/my_list_status

- _(none)_
