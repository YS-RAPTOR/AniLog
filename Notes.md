# Per List

- Each list has a source, which is the myanimelist api that the list is based on. For example, the source can be my anime list anime list, which will show all the anime in the user's anime list, or it can be my anime list manga list, which will show all the manga in the user's manga list. The source can be the seasonal anime list api, the rankings api, the search api or any other api that provides a list of anime or manga. The source will determine the entries that are shown in the list and the fields that are available for those entries. Some sources will have more fields available than others, for example the rankings api will have the rank field available, while the seasonal anime list api will not have the rank field available. Different sources will also have different options available, for example the seasonal anime list will have the year abd season fields, the search source will have the query field, and the anime list and manga list sources will the user name.
- Can select between card view and table view for each list.
- Fields shown in the list can be fully customizable.
- Each field can be added multiple times in a list (There should be a filter option to show only fields that havent been/ fields that have been added/fields that have been added multiple times ..etc.. added in the place where you add a field)
- Lists cannot be deleted, only soft deleted, which means that they can be restored at any time. This is to prevent accidental deletion of lists and to allow the user to easily restore a list if they change their mind. When a list is soft deleted, it will be moved to a separate section called "Deleted Lists" where the user can view all their deleted lists and choose to restore them.
- When editing a list settings, the list will dynamically update to show the changes as the user makes them, so the user can see how the changes they are making will affect the list in real time. For example if the user is changing the fields shown in the list, then as they add or remove fields, the list will update to show or hide those fields accordingly. This will allow the user to easily see how their changes are affecting the list and make it easier for them to customize their list to their liking. Howvever, all changes are local and if the user does not save the changes, then the list will revert back to the previous settings, so the user can experiment with different settings without worrying about losing their previous setup. The user will have the option once they make a change to reset, save as new list or save changes. Reset will reset the changes back to the previous settings, save as new list will save the changes as a new list and keep the old list intact, and save changes will save the changes to the current list and overwrite the old settings.

## Grouping and Filtering

Each List can have a grouping associated with it and there can be multiple fields used for grouping which will create a composite grouping. The order of the fields will determine how to sorting of the different composite groups are done. An example is a grouping with both season and year fields, which will create a composite group with the format "Season: ${season} Year: ${year}". The sorting of the composite groups will be done first by season and then by year. The format of the composite group can also be customized by the user, with the default format being the one shown in the example. We will be using js template literals for the formatting, so the user can use any format they want and can also include other text in the format. So for example the groupings could look like the below:

- Spring 2026
- Winter 2026
- Fall 2025
- ....

Also note that a entry can be part of multiple groupings. For example if we are grouping by genre and studio, then an anime that has multiple genres and studios will be part of multiple groups. For example if an anime has the genres action and comedy and the studios studio A and studio B, then it will be part of the groups "Genre: Action Studio: Studio A", "Genre: Action Studio: Studio B", "Genre: Comedy Studio: Studio A" and "Genre: Comedy Studio: Studio B". The grouping format for this example would be "Genre: ${genre} Studio: ${studio}". The sorting of the groups in this example would be first by genre and then by studio.

However also note that the manual bucketing and remainder bucketing are mutually exclusive to each other, so if an entry is part of a manual bucket then it cannot be part of the remainder bucket and vice versa. So for example if we are grouping by mean score with the manual buckets being 0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6-7, 7-8, 8-9 and 9-10 and the remainder bucket being grouped using the other method, then an anime with a mean score of 7.5 will be part of the manual bucket "7-8" and will not be part of the remainder bucket. An anime with a mean score of 10 will be part of the manual bucket "9-10" and will not be part of the remainder bucket. An anime with a mean score of 10.5 will not be part of any manual bucket and will be part of the remainder bucket. Same for genres, if we had a manual bucket that checks if the first character of the genre is between A and M, then an anime with the genre action will be part of that manual bucket and will not be part of the remainder bucket, while an anime with the genre romance will not be part of that manual bucket and will be part of the remainder bucket.

Filtering will be considered a subset of grouping, since the you can define one group with all the custom filters you want and the remainder be discarded, which will effectively filter the list with the custom filters you set up. For example if we want to filter the list to only show anime with a mean score between 7 and 8 and with the genre action, then we can set up a grouping with one manual bucket that has the filters mean score between 7 and 8 and genre contains action, and then have the remainder bucket be discarded. This will result in a grouping with only one group that contains all the anime that have a mean score between 7 and 8 and have the genre action, which is effectively filtering the list by those criteria.

The manual bucketing system will use filter operation where each field can be filtered on using the different filter operations available for that field type. For example, for the mean score field, the filter operations would be between, greater than, less than, equals and not equals. For the genre field, the filter operations would be contains, does not contain, equals and not equals. There will also be different functions that are available, for example for the mean score field there will be a function to round the mean score to the nearest integer, while for the title field there will be a function to get the first letter of the title. These functions can then be used in the filters, for example we can have a filter that checks if the rounded mean score is between 7 and 8, or if the first letter of the title is between A and M. The available functions will be based on the most commonly used functions for that type. For example for string fields, common functions would be getting the first letter by index, getting the length of the string and getting the word count of the string, while for date fields common functions would be getting the year, month and day of the date. Filters can then be combined for greater filtering capabilities. For example we can have a filter that checks if the mean score is between 7 and 8 and the genre contains action. Another example is to check if a score is not between 5 and 8 or has the genre action. The filters will be applied to the entire list and will affect both the grouping and sorting of the list.

- Filtering can be across multiple fields as long as the types match. For example you can filter by shows which I rated higher than the mean score, lower than the mean score, higher than the mean score, which can allow you to create a very nice grouping of shows that you rated higher than the mean score, which can be a good way to find hidden gems that you might have rated higher than the average user. Another example is to filter by shows that aired before a certain date and have a certain genre, which can be a good way to find older shows in a specific genre.

- Filterting can also be done as long as the types match for example (this is a stupid example) if you want to get the length(title) and compare it to the mean score, you can do that since both of them are numbers, even though they are different types. This can allow for some interesting groupings, for example you can group by the length of the title and compare it to the mean score to see if there is any correlation between the length of the title and the mean score.

## Sorting

For sorting multiple keys can be setup to create a sorting hierarchy. The sorting keys can be the same as the grouping keys or can be different. The sorting keys will determine the order of the entries within each group. For example if we are grouping by season and year and sorting by mean score, then the entries within each season and year group will be sorted by their mean score. The sorting can be either ascending or descending.

## Tracking

Some fields can be marked as trackable, which means that the user can choose to track the changes in that field over time. For each trackable field the user can set up a filter where the user will have access to two extra values, current value and previous value, and can use these values in the filter operations and functions that are available for that field type. For example if the mean score field is trackable, then the user can set up a filter that checks if the current mean score is greater than the previous mean score, which will show all the anime that have had an increase in their mean score. Or do a check to see if a new episode has aired by checking if the current episode number is greater than the previous episode number. or check if I read the manga, which is where I set the progress of the anime > currently aired episodes.

When the filter criteria is met, the user can choose any actions to happen:

- Notify me: This will send a notification to the user when the criteria is met.
- Update list status: This will update the status of the anime to a status that the user can choose.
- Export data: Will export the list data, but will expose it as a notification.

Per list the user can customize the polling frequency for the tracked fields, and can also choose to only track changes that meet certain criteria.

## Export

- The user can export the settings of the list, which includes the fields shown, the grouping and sorting setup, and the tracking setup. This will allow the user to easily share their list setup with others or to save it for future use, This will be implemented in the settings screen.
- The user can also export the data of the list, which includes the anime in the list and their associated data as a json file. Will be directly implemented on the list screen.

### Export Scripts (configured in settings)

- User gives a js script with one function that takes in the list data and outputs a string. I want to have a nyaa.si magnet link export plugin, which will output a string with the magnet links of all the anime in the list that have a nyaa.si entry. The user can then copy this string and use it as they wish. This will be implemented in the settings screen.

## Integrations

- I want a youtube music integration where the user can link their youtube music account and have a playlist controlled by the anime in their list. For example the user can have a playlist that has all the openings and endings of the anime in their list, and the playlist will be updated automatically when the user adds or removes anime from their list. The user can also choose to only include certain types of songs in the playlist, for example only include openings or only include songs from anime with a mean score above 8.

## External Links

- In the settings screen the user can setup external links for an anime/manga. For example the user can setup a netflix link that will search for the specific anime title on netflix, or a crunchyroll link that will search for the specific anime title on crunchyroll. Then in the list screen a new field called external links will be available, which will show the different external links that the user has set up for that anime. This will allow the user to easily access the anime on different platforms. The user can setup any field they want for the external links. They will get the anime object as a parameter, so they can use any field in the anime object to create the link. For example they can use the title field to create a search link for netflix, or they can use the my anime list id field to create a direct link to the anime on my anime list.

- In UI it will automatically get the favicon of the website and use it as the icon for the external link, so the netflix link will have the netflix icon and the crunchyroll link will have the crunchyroll icon. This will make it easier for the user to identify the different external links.

## Table View

- Each field is a column/multiple columns in the table view.

## Card View

- Each field is a part of the card.
    - Can either be part of the main body or the card alt state( hover/presssing button on card to enable alt state)
- The design of card view is goind to be based around grids. The number of rows and columns in the grid can be customizable, along with their relative sizes. (3x3 is the max).
    - Each field will be assigned to a specific cell in the grid, and will take up space in the grid. Each grid cell can itself have a layout like left to right, right to left, top to bottom and bottom to top which will decided how the fields in the cell are laid out.

# Per Field

- Card View and Table View React Component
    - Props: Some provided by the system (like the Anime Object), Some provided by the user (like the layout, styling).
    - Props provided by user must have default values.
    - To make the prop values user selectable, we cannot have a react component for each type so it will be made procedurally.
    - Therefore the specific types of the props must be a finite list, and must be runtime reflectable.
    - Table view and card view can have different props.

- Filtering Methods: Each field type will have different filter operations available to them:
    - Strings: contains, equals, starts with, ends with
    - Numbers: between, greater than, less than, equals, greater than or equal to, less than or equal to
    - Dates: between, before, after, on
    - Booleans: equals (true or false)

- Function Methods: Each field type will have different functions available to them that can be used in the filters:
    - Strings: letter by index, length, word count
    - Numbers: round, floor, ceil, divide, multiply, add, subtract, remainder, decimal part, integer part
    - Dates: year, month, day, day of week

- Other functionality can be gained by using the composite filters, and, or, not

- Grouping Methods:
    - Each field type will have a manual bucketing section where the users can create custom buckets using the different filter operations available on the field type.
    - Then there will be a remainder section where all the items that did not filter into any of the manual buckets will be grouped together. This remainder section can be turned on or off and can be renamed to something custom. This is where diffrent automatic grouping methods will come into play. Each field type will have different automatic grouping methods available to them. One common grouping method is other, which will group the entire remainder section into one bucket. Another common grouping method is none, which will not group the remainder section at all and will just ignore the groupings. Also since the groupings the sorting method for each grouping can also be configured asc, desc. The default grouping method will probably be other with the sorting method being the one most commonly used for that type . The rest of the grouping methods are more specifc per type.
        - Strings: by Value, by First Letter, by Length, by Word Count
        - Dates: by Year, by Month, by Day
    - Each field will have a default grouping setup while some fields will be marked as ungroupable and will not have any grouping methods available to them. The default grouping setup will be based on the most commonly used grouping methods for that type. For example, for the my anime list status field the default grouping setup would probably be the manual buckets being each of the values with the equals filter and the remainder section being grouped using the other method. For the mean score field, the default grouping setup would probably be the manual buckets being between filters of 1 point each and the remainder section being grouped using the other method. For the studio field, since there are so many different values and no specific format, it would probably be best to have no default manual buckets and just have the remainder section grouped using the by Value method and with a sort method ascending.

- Sorting Methods: Each field will provide either a way to sort ascending or descending order. Some fields will not be sortable and will be marked as unsortable. The default sorting method for each field will be based on the most commonly used sorting method for that type. For example, for the mean score field the default sorting method would probably be descending, while for the title field the default sorting method would probably be ascending.
