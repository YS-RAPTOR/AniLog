# Common Anime Fields

Generated from `.agents/skills/myanimelist/endpoints/*.md` anime endpoints.
Common fields are intersected across GET anime endpoints; unique fields are computed across all included anime endpoints.

Endpoints included: 8

## Common Fields Across Anime Endpoints

- `alternative_titles`
- `alternative_titles.en`
- `alternative_titles.ja`
- `alternative_titles.synonyms`
- `alternative_titles.synonyms[]`
- `average_episode_duration`
- `broadcast`
- `broadcast.day_of_the_week`
- `broadcast.start_time`
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
- `my_list_status.is_rewatching`
- `my_list_status.num_episodes_watched`
- `my_list_status.num_times_rewatched`
- `my_list_status.priority`
- `my_list_status.rewatch_value`
- `my_list_status.score`
- `my_list_status.start_date`
- `my_list_status.status`
- `my_list_status.tags`
- `my_list_status.tags[]`
- `my_list_status.updated_at`
- `nsfw`
- `num_episodes`
- `num_list_users`
- `num_scoring_users`
- `popularity`
- `rank`
- `rating`
- `source`
- `start_date`
- `start_season`
- `start_season.season`
- `start_season.year`
- `status`
- `studios`
- `studios[]`
- `studios[].id`
- `studios[].name`
- `synopsis`
- `title`
- `updated_at`

## Unique Fields By Endpoint

### DELETE /anime/{anime_id}/my_list_status

- _(none)_

### GET /anime

- _(none)_

### GET /anime/ranking

- `ranking`
- `ranking.previous_rank`
- `ranking.rank`

### GET /anime/season/{year}/{season}

- _(none)_

### GET /anime/suggestions

- _(none)_

### GET /anime/{anime_id}

- `background`
- `ending_themes`
- `ending_themes[]`
- `ending_themes[].anime_id`
- `ending_themes[].id`
- `ending_themes[].text`
- `opening_themes`
- `opening_themes[]`
- `opening_themes[].anime_id`
- `opening_themes[].id`
- `opening_themes[].text`
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
- `related_anime[].node.id`
- `related_anime[].node.main_picture`
- `related_anime[].node.main_picture.large`
- `related_anime[].node.main_picture.medium`
- `related_anime[].node.title`
- `related_anime[].relation_type`
- `related_anime[].relation_type_formatted`
- `related_manga`
- `related_manga[]`
- `related_manga[].node`
- `related_manga[].node.authors`
- `related_manga[].node.authors[]`
- `related_manga[].node.authors[].node`
- `related_manga[].node.authors[].node.first_name`
- `related_manga[].node.authors[].node.id`
- `related_manga[].node.authors[].node.last_name`
- `related_manga[].node.authors[].role`
- `related_manga[].node.media_type`
- `related_manga[].node.my_list_status`
- `related_manga[].node.my_list_status.comments`
- `related_manga[].node.my_list_status.finish_date`
- `related_manga[].node.my_list_status.is_rereading`
- `related_manga[].node.my_list_status.num_chapters_read`
- `related_manga[].node.my_list_status.num_times_reread`
- `related_manga[].node.my_list_status.num_volumes_read`
- `related_manga[].node.my_list_status.priority`
- `related_manga[].node.my_list_status.reread_value`
- `related_manga[].node.my_list_status.score`
- `related_manga[].node.my_list_status.start_date`
- `related_manga[].node.my_list_status.status`
- `related_manga[].node.my_list_status.tags`
- `related_manga[].node.my_list_status.tags[]`
- `related_manga[].node.my_list_status.updated_at`
- `related_manga[].node.num_chapters`
- `related_manga[].node.num_volumes`
- `related_manga[].node.status`
- `related_manga[].relation_type`
- `related_manga[].relation_type_formatted`
- `statistics`
- `statistics.num_list_users`
- `statistics.status`
- `statistics.status.completed`
- `statistics.status.dropped`
- `statistics.status.on_hold`
- `statistics.status.plan_to_watch`
- `statistics.status.watching`
- `videos`
- `videos[]`
- `videos[].created_at`
- `videos[].id`
- `videos[].thumbnail`
- `videos[].title`
- `videos[].updated_at`
- `videos[].url`

### GET /users/{user_name}/animelist

- _(none)_

### PATCH /anime/{anime_id}/my_list_status

- _(none)_
