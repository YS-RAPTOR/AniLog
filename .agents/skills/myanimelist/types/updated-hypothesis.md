# Updated Hypothesis

Field type hypotheses revised using local MAL docs, official MAL doc websites, plus website filters, rankings, seasonal pages, and sample detail pages.
The goal is still general typing, but official-doc-backed constraints let us tighten several categorical, range, and date assumptions.

## Docs Inspected

- `.agents/skills/myanimelist/SKILL.md`
- `.agents/skills/myanimelist/endpoints/get__anime__anime_id.md`
- `.agents/skills/myanimelist/endpoints/get__manga__manga_id.md`
- `.agents/skills/myanimelist/endpoints/get__anime__ranking.md`
- `.agents/skills/myanimelist/endpoints/get__manga__ranking.md`
- `.agents/skills/myanimelist/endpoints/get__anime__season__year__season.md`
- `.agents/skills/myanimelist/endpoints/get__users__user_name__animelist.md`
- `.agents/skills/myanimelist/endpoints/get__users__user_name__mangalist.md`
- `.agents/skills/myanimelist/endpoints/patch__anime__anime_id__my_list_status.md`
- `.agents/skills/myanimelist/endpoints/patch__manga__manga_id__my_list_status.md`

## Official Doc Websites Inspected

- `https://myanimelist.net/apiconfig/references/api/v2`
- `https://myanimelist.net/apiconfig/references/authorization`

## Pages Inspected

- `https://myanimelist.net/anime.php`
- `https://myanimelist.net/manga.php`
- `https://myanimelist.net/topanime.php`
- `https://myanimelist.net/topmanga.php`
- `https://myanimelist.net/anime/season`
- `https://myanimelist.net/manga/adapted`
- `https://myanimelist.net/anime/52991/Sousou_no_Frieren`
- `https://myanimelist.net/manga/2/Berserk`

## Official Docs-Derived Constraints

| Family | Doc Evidence |
| --- | --- |
| `datetime` fields | `date-time: 2015-03-02T06:03:11+00:00` |
| `partial_date` fields | `date: 2017-10-23` or `2017-10` or `2017` |
| `time` fields | `time: 01:35` |
| `start_season.season` | `winter|spring|summer|fall` |
| `anime my_list_status.status` | `watching|completed|on_hold|dropped|plan_to_watch` |
| `manga my_list_status.status` | `reading|completed|on_hold|dropped|plan_to_read` |
| `score` | `int 0-10` |
| `priority` | `int 0-2` |
| `rewatch_value` / `reread_value` | `int 0-5` |
| booleans | `is_rewatching` and `is_rereading` are documented as boolean |

## Website-Derived Value Families

| Family | Observed Website Values |
| --- | --- |
| `anime.media_type` | `TV`, `OVA`, `Movie`, `Special`, `ONA`, `Music`, `CM`, `PV`, `TV Special` |
| `manga.media_type` | `Manga`, `One-shot`, `Doujinshi`, `Light Novel`, `Novel`, `Manhwa`, `Manhua` |
| `anime.rating` | `G`, `PG`, `PG-13`, `R`, `R+`, `Rx` |
| `anime.status` | `Finished Airing`, `Currently Airing`, `Not yet aired` |
| `manga.status` | `Finished Publishing`, `Publishing`, `On Hiatus`, `Discontinued`, `Not yet published` |
| `anime.my_list_status.status` | `Watching`, `Completed`, `On-Hold`, `Dropped`, `Plan to Watch` |
| `manga.my_list_status.status` | `Reading`, `Completed`, `On-Hold`, `Dropped`, `Plan to Read` |
| `start_season.season` | `Winter`, `Spring`, `Summer`, `Fall` |
| `relation_type_formatted` examples | `Sequel`, `Adaptation`, `Side Story`, `Other`, `Spin-Off` |

## Changes From `hypothesis.md`

| Field | Previous | Updated | Why |
| --- | --- | --- | --- |
| `end_date` | `date_string` | `nullable<partial_date_string>` | Official MAL API docs define date values as partial dates, and website detail pages show open-ended ongoing values such as `?`. |
| `genres[].name` | `string` | `enum_string` | Website filters expose MAL-controlled genre, theme, explicit-genre, and demographic labels. |
| `media_type` | `enum_string` | `closed_enum_string` | Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua. |
| `my_list_status.priority` | `enum_number` | `closed_enum_number` | Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates. |
| `my_list_status.reread_value` | `enum_number` | `closed_enum_number` | Official MAL API docs define manga reread value as `int 0-5`. |
| `my_list_status.rewatch_value` | `enum_number` | `closed_enum_number` | Official MAL API docs define anime rewatch value as `int 0-5`. |
| `my_list_status.score` | `enum_number` | `closed_enum_number` | Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets. |
| `my_list_status.status` | `enum_string` | `closed_enum_string` | Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`). |
| `num_chapters` | `integer` | `nullable<integer>` | Manga detail and adapted pages can show unknown chapter totals as '? chp' or 'Unknown'. |
| `num_episodes` | `integer` | `nullable<integer>` | Seasonal anime entries can show unknown episode totals as '? eps'. |
| `num_volumes` | `integer` | `nullable<integer>` | Top manga, detail, and adapted pages can show unknown volume totals as '? vol' or 'Unknown'. |
| `rating` | `enum_string` | `closed_enum_string` | Anime search and detail pages show G, PG, PG-13, R, R+, and Rx. |
| `related_anime[].node.media_type` | `enum_string` | `closed_enum_string` | Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua. |
| `related_anime[].node.my_list_status.priority` | `enum_number` | `closed_enum_number` | Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates. |
| `related_anime[].node.my_list_status.rewatch_value` | `enum_number` | `closed_enum_number` | Official MAL API docs define anime rewatch value as `int 0-5`. |
| `related_anime[].node.my_list_status.score` | `enum_number` | `closed_enum_number` | Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets. |
| `related_anime[].node.my_list_status.status` | `enum_string` | `closed_enum_string` | Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`). |
| `related_anime[].node.num_episodes` | `integer` | `nullable<integer>` | Seasonal anime entries can show unknown episode totals as '? eps'. |
| `related_anime[].node.rating` | `enum_string` | `closed_enum_string` | Anime search and detail pages show G, PG, PG-13, R, R+, and Rx. |
| `related_anime[].node.start_season.season` | `enum_string` | `closed_enum_string` | Official MAL API docs define seasonal values as `winter|spring|summer|fall`, which aligns with website seasonal navigation. |
| `related_anime[].node.status` | `enum_string` | `closed_enum_string` | Website filters show domain-specific closed status sets for anime and manga entries. |
| `related_manga[].node.media_type` | `enum_string` | `closed_enum_string` | Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua. |
| `related_manga[].node.my_list_status.priority` | `enum_number` | `closed_enum_number` | Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates. |
| `related_manga[].node.my_list_status.reread_value` | `enum_number` | `closed_enum_number` | Official MAL API docs define manga reread value as `int 0-5`. |
| `related_manga[].node.my_list_status.score` | `enum_number` | `closed_enum_number` | Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets. |
| `related_manga[].node.my_list_status.status` | `enum_string` | `closed_enum_string` | Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`). |
| `related_manga[].node.num_chapters` | `integer` | `nullable<integer>` | Manga detail and adapted pages can show unknown chapter totals as '? chp' or 'Unknown'. |
| `related_manga[].node.num_volumes` | `integer` | `nullable<integer>` | Top manga, detail, and adapted pages can show unknown volume totals as '? vol' or 'Unknown'. |
| `related_manga[].node.status` | `enum_string` | `closed_enum_string` | Website filters show domain-specific closed status sets for anime and manga entries. |
| `start_date` | `date_string` | `partial_date_string` | Official MAL API docs define date values as `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`, so series dates are modeled as partial dates. |
| `start_season.season` | `enum_string` | `closed_enum_string` | Official MAL API docs define seasonal values as `winter|spring|summer|fall`, which aligns with website seasonal navigation. |
| `status` | `enum_string` | `closed_enum_string` | Website filters show domain-specific closed status sets; anime uses Finished Airing/Currently Airing/Not yet aired, manga uses Finished Publishing/Publishing/On Hiatus/Discontinued/Not yet published. |

## Shared Anime + Manga Fields

| Field | Updated Hypothesis | Evidence Notes |
| --- | --- | --- |
| `alternative_titles` | `object` |  |
| `alternative_titles.en` | `string` |  |
| `alternative_titles.ja` | `string` |  |
| `alternative_titles.synonyms` | `array<string>` |  |
| `alternative_titles.synonyms[]` | `string` |  |
| `background` | `string` |  |
| `created_at` | `datetime_string` |  |
| `end_date` | `nullable<partial_date_string>` | Official MAL API docs define date values as partial dates, and website detail pages show open-ended ongoing values such as `?`. |
| `genres` | `array<object>` |  |
| `genres[]` | `object` |  |
| `genres[].id` | `integer` |  |
| `genres[].name` | `enum_string` | Website filters expose MAL-controlled genre, theme, explicit-genre, and demographic labels. |
| `id` | `integer` |  |
| `main_picture` | `object` |  |
| `main_picture.large` | `url_string` |  |
| `main_picture.medium` | `url_string` |  |
| `mean` | `bounded_number` |  |
| `media_type` | `closed_enum_string` | Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua. |
| `my_list_status` | `object` |  |
| `my_list_status.comments` | `string` |  |
| `my_list_status.finish_date` | `date_string` |  |
| `my_list_status.priority` | `closed_enum_number` | Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates. |
| `my_list_status.score` | `closed_enum_number` | Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets. |
| `my_list_status.start_date` | `date_string` |  |
| `my_list_status.status` | `closed_enum_string` | Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`). |
| `my_list_status.tags` | `array<string>` |  |
| `my_list_status.tags[]` | `string` |  |
| `my_list_status.updated_at` | `datetime_string` |  |
| `nsfw` | `enum_string` |  |
| `num_list_users` | `integer` |  |
| `num_scoring_users` | `integer` |  |
| `pictures` | `array<object>` |  |
| `pictures[]` | `object` |  |
| `pictures[].large` | `url_string` |  |
| `pictures[].medium` | `url_string` |  |
| `popularity` | `integer` |  |
| `rank` | `integer` |  |
| `ranking` | `object` |  |
| `ranking.previous_rank` | `integer` |  |
| `ranking.rank` | `integer` |  |
| `recommendations` | `array<object>` |  |
| `recommendations[]` | `object` |  |
| `recommendations[].node` | `object` |  |
| `recommendations[].node.id` | `integer` |  |
| `recommendations[].node.main_picture` | `object` |  |
| `recommendations[].node.main_picture.large` | `url_string` |  |
| `recommendations[].node.main_picture.medium` | `url_string` |  |
| `recommendations[].node.title` | `string` |  |
| `recommendations[].num_recommendations` | `integer` |  |
| `related_anime` | `array<object>` |  |
| `related_anime[]` | `object` |  |
| `related_anime[].node` | `object` |  |
| `related_anime[].relation_type` | `enum_string` | Detail pages show labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off; this set is likely incomplete. |
| `related_anime[].relation_type_formatted` | `enum_string` | Detail pages show formatted relation labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off. |
| `related_manga` | `array<object>` |  |
| `related_manga[]` | `object` |  |
| `related_manga[].node` | `object` |  |
| `related_manga[].relation_type` | `enum_string` | Detail pages show labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off; this set is likely incomplete. |
| `related_manga[].relation_type_formatted` | `enum_string` | Detail pages show formatted relation labels such as Sequel, Adaptation, Side Story, Other, and Spin-Off. |
| `start_date` | `partial_date_string` | Official MAL API docs define date values as `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`, so series dates are modeled as partial dates. |
| `status` | `closed_enum_string` | Website filters show domain-specific closed status sets; anime uses Finished Airing/Currently Airing/Not yet aired, manga uses Finished Publishing/Publishing/On Hiatus/Discontinued/Not yet published. |
| `synopsis` | `string` |  |
| `title` | `string` |  |
| `updated_at` | `datetime_string` |  |

## Anime-Only Fields

| Field | Updated Hypothesis | Evidence Notes |
| --- | --- | --- |
| `average_episode_duration` | `integer` |  |
| `broadcast` | `object` |  |
| `broadcast.day_of_the_week` | `enum_string` | Anime detail pages render weekday labels such as Fridays. |
| `broadcast.start_time` | `time_string` | Official MAL API docs define time values like `01:35`, and anime detail pages render 24-hour broadcast times such as `23:00`. |
| `ending_themes` | `array<object>` |  |
| `ending_themes[]` | `object` |  |
| `ending_themes[].anime_id` | `integer` |  |
| `ending_themes[].id` | `integer` |  |
| `ending_themes[].text` | `string` |  |
| `my_list_status.is_rewatching` | `boolean` |  |
| `my_list_status.num_episodes_watched` | `integer` |  |
| `my_list_status.num_times_rewatched` | `integer` |  |
| `my_list_status.rewatch_value` | `closed_enum_number` | Official MAL API docs define anime rewatch value as `int 0-5`. |
| `num_episodes` | `nullable<integer>` | Seasonal anime entries can show unknown episode totals as '? eps'. |
| `opening_themes` | `array<object>` |  |
| `opening_themes[]` | `object` |  |
| `opening_themes[].anime_id` | `integer` |  |
| `opening_themes[].id` | `integer` |  |
| `opening_themes[].text` | `string` |  |
| `rating` | `closed_enum_string` | Anime search and detail pages show G, PG, PG-13, R, R+, and Rx. |
| `related_anime[].node.id` | `integer` |  |
| `related_anime[].node.main_picture` | `object` |  |
| `related_anime[].node.main_picture.large` | `url_string` |  |
| `related_anime[].node.main_picture.medium` | `url_string` |  |
| `related_anime[].node.title` | `string` |  |
| `related_manga[].node.authors` | `array<object>` |  |
| `related_manga[].node.authors[]` | `object` |  |
| `related_manga[].node.authors[].node` | `object` |  |
| `related_manga[].node.authors[].node.first_name` | `string` |  |
| `related_manga[].node.authors[].node.id` | `integer` |  |
| `related_manga[].node.authors[].node.last_name` | `string` |  |
| `related_manga[].node.authors[].role` | `enum_string` |  |
| `related_manga[].node.media_type` | `closed_enum_string` | Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua. |
| `related_manga[].node.my_list_status` | `object` |  |
| `related_manga[].node.my_list_status.comments` | `string` |  |
| `related_manga[].node.my_list_status.finish_date` | `date_string` |  |
| `related_manga[].node.my_list_status.is_rereading` | `boolean` |  |
| `related_manga[].node.my_list_status.num_chapters_read` | `integer` |  |
| `related_manga[].node.my_list_status.num_times_reread` | `integer` |  |
| `related_manga[].node.my_list_status.num_volumes_read` | `integer` |  |
| `related_manga[].node.my_list_status.priority` | `closed_enum_number` | Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates. |
| `related_manga[].node.my_list_status.reread_value` | `closed_enum_number` | Official MAL API docs define manga reread value as `int 0-5`. |
| `related_manga[].node.my_list_status.score` | `closed_enum_number` | Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets. |
| `related_manga[].node.my_list_status.start_date` | `date_string` |  |
| `related_manga[].node.my_list_status.status` | `closed_enum_string` | Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`). |
| `related_manga[].node.my_list_status.tags` | `array<string>` |  |
| `related_manga[].node.my_list_status.tags[]` | `string` |  |
| `related_manga[].node.my_list_status.updated_at` | `datetime_string` |  |
| `related_manga[].node.num_chapters` | `nullable<integer>` | Manga detail and adapted pages can show unknown chapter totals as '? chp' or 'Unknown'. |
| `related_manga[].node.num_volumes` | `nullable<integer>` | Top manga, detail, and adapted pages can show unknown volume totals as '? vol' or 'Unknown'. |
| `related_manga[].node.status` | `closed_enum_string` | Website filters show domain-specific closed status sets for anime and manga entries. |
| `source` | `enum_string` | Observed source labels on website pages include Manga, Light novel, and Novel. |
| `start_season` | `object` |  |
| `start_season.season` | `closed_enum_string` | Official MAL API docs define seasonal values as `winter|spring|summer|fall`, which aligns with website seasonal navigation. |
| `start_season.year` | `integer` |  |
| `statistics` | `object` |  |
| `statistics.num_list_users` | `integer` |  |
| `statistics.status` | `object` |  |
| `statistics.status.completed` | `integer` |  |
| `statistics.status.dropped` | `integer` |  |
| `statistics.status.on_hold` | `integer` |  |
| `statistics.status.plan_to_watch` | `integer` |  |
| `statistics.status.watching` | `integer` |  |
| `studios` | `array<object>` |  |
| `studios[]` | `object` |  |
| `studios[].id` | `integer` |  |
| `studios[].name` | `string` |  |
| `videos` | `array<object>` |  |
| `videos[]` | `object` |  |
| `videos[].created_at` | `datetime_string` |  |
| `videos[].id` | `integer` |  |
| `videos[].thumbnail` | `url_string` |  |
| `videos[].title` | `string` |  |
| `videos[].updated_at` | `datetime_string` |  |
| `videos[].url` | `url_string` |  |

## Manga-Only Fields

| Field | Updated Hypothesis | Evidence Notes |
| --- | --- | --- |
| `authors` | `array<object>` |  |
| `authors[]` | `object` |  |
| `authors[].node` | `object` |  |
| `authors[].node.first_name` | `string` |  |
| `authors[].node.id` | `integer` |  |
| `authors[].node.last_name` | `string` |  |
| `authors[].role` | `enum_string` | Manga detail pages show controlled author-role labels such as Story & Art and Art. |
| `my_list_status.is_rereading` | `boolean` |  |
| `my_list_status.num_chapters_read` | `integer` |  |
| `my_list_status.num_times_reread` | `integer` |  |
| `my_list_status.num_volumes_read` | `integer` |  |
| `my_list_status.reread_value` | `closed_enum_number` | Official MAL API docs define manga reread value as `int 0-5`. |
| `num_chapters` | `nullable<integer>` | Manga detail and adapted pages can show unknown chapter totals as '? chp' or 'Unknown'. |
| `num_volumes` | `nullable<integer>` | Top manga, detail, and adapted pages can show unknown volume totals as '? vol' or 'Unknown'. |
| `related_anime[].node.average_episode_duration` | `integer` |  |
| `related_anime[].node.broadcast` | `object` |  |
| `related_anime[].node.broadcast.day_of_the_week` | `enum_string` | Anime detail pages render weekday labels such as Fridays. |
| `related_anime[].node.broadcast.start_time` | `time_string` | Official MAL API docs define time values like `01:35`, and anime detail pages render 24-hour broadcast times such as `23:00`. |
| `related_anime[].node.media_type` | `closed_enum_string` | Website filters show domain-specific controlled families; anime includes TV/OVA/Movie/Special/ONA/Music/CM/PV/TV Special, manga includes Manga/One-shot/Doujinshi/Light Novel/Novel/Manhwa/Manhua. |
| `related_anime[].node.my_list_status` | `object` |  |
| `related_anime[].node.my_list_status.comments` | `string` |  |
| `related_anime[].node.my_list_status.finish_date` | `date_string` |  |
| `related_anime[].node.my_list_status.is_rewatching` | `boolean` |  |
| `related_anime[].node.my_list_status.num_episodes_watched` | `integer` |  |
| `related_anime[].node.my_list_status.num_times_rewatched` | `integer` |  |
| `related_anime[].node.my_list_status.priority` | `closed_enum_number` | Official MAL API docs define priority as `int 0-2` for both anime and manga list status updates. |
| `related_anime[].node.my_list_status.rewatch_value` | `closed_enum_number` | Official MAL API docs define anime rewatch value as `int 0-5`. |
| `related_anime[].node.my_list_status.score` | `closed_enum_number` | Official MAL API docs define score as `int 0-10`, which matches the fixed chooser in MAL list widgets. |
| `related_anime[].node.my_list_status.start_date` | `date_string` |  |
| `related_anime[].node.my_list_status.status` | `closed_enum_string` | Official MAL API docs define the full list-status sets for anime (`watching|completed|on_hold|dropped|plan_to_watch`) and manga (`reading|completed|on_hold|dropped|plan_to_read`). |
| `related_anime[].node.my_list_status.tags` | `array<string>` |  |
| `related_anime[].node.my_list_status.tags[]` | `string` |  |
| `related_anime[].node.my_list_status.updated_at` | `datetime_string` |  |
| `related_anime[].node.num_episodes` | `nullable<integer>` | Seasonal anime entries can show unknown episode totals as '? eps'. |
| `related_anime[].node.rating` | `closed_enum_string` | Anime search and detail pages show G, PG, PG-13, R, R+, and Rx. |
| `related_anime[].node.source` | `enum_string` | Observed source labels on website pages include Manga, Light novel, and Novel. |
| `related_anime[].node.start_season` | `object` |  |
| `related_anime[].node.start_season.season` | `closed_enum_string` | Official MAL API docs define seasonal values as `winter|spring|summer|fall`, which aligns with website seasonal navigation. |
| `related_anime[].node.start_season.year` | `integer` |  |
| `related_anime[].node.status` | `closed_enum_string` | Website filters show domain-specific closed status sets for anime and manga entries. |
| `related_anime[].node.studios` | `array<object>` |  |
| `related_anime[].node.studios[]` | `object` |  |
| `related_anime[].node.studios[].id` | `integer` |  |
| `related_anime[].node.studios[].name` | `string` |  |
| `related_manga[].node.id` | `integer` |  |
| `related_manga[].node.main_picture` | `object` |  |
| `related_manga[].node.main_picture.large` | `url_string` |  |
| `related_manga[].node.main_picture.medium` | `url_string` |  |
| `related_manga[].node.title` | `string` |  |
| `serialization` | `array<object>` |  |
| `serialization[]` | `object` |  |
| `serialization[].node` | `object` |  |
| `serialization[].node.id` | `integer` |  |
| `serialization[].node.name` | `string` |  |
| `serialization[].role` | `enum_string` |  |
