# Responsive grid

The responsive grid is a reactive table that provide generic actions that the user will appretiate, such as:

* Sort
* Grouping filter
* Configure the layout of the grid, this includes column arrangement, size and visibility
* Ability to save the current `configuration` layout

## Configuration

The grid's layout (column's arrangement, size and visibility) can be changed and a user may choose to save the current `configuration` thus making the layout as default. The user may save several layouts, and switch from one `configuration` to other, or no configuration at all.

At the moment, multiple configuration creation is disabled. It needs to be tested.

## Technical aspects

### Responsive grid props

You must supply the following props to the `responsive-grid` component

* `grid-name` => `string`: A *UNIQUE* name that identifies this grid. This name is used to store the grid's `configuration`.
* `title` => `string`: The title of this grid that will be shown at the top of the grid.
* `list-data` => `object`: Contains the `list` to show and the `total` result, each in its own property for instance `{ list: [], total: 0 }`.
* `key-for-item` => `function`: a function that given a row, returns the key property. This is used by `VueJS` to optimize the re-rendering process if any data changes.
* `query` => `string`: The filter condition. If you don't supply this prop, the grid will not update the search param.
* `columns` => `array`: The array of known columns. Each item must be an object with the form: `{ name: 'email', type: 'string', prop: 'email', visible: true }`. The `name` property defines the `column's` name and `prop` actual property name, `type` indicates whether the property is a `string`, `number`, `date` or an `array`. Lastly `visible` indicates whether this property is visible.

### Events

* `grid-column-move` fired by `grid-configuration-dropdown` when a `column` is re-arranged to left or right.
* `grid-column-visibility-change` fired by `grid-configuration-dropdown` when a `column` is set to visible or invisible.
* `grid-config-save` fired by `grid-configuration-dropdown` when the current grid's `configuration` is saved with a name.
* `grid-config-new` fired by `grid-configuration-dropdown` when the user creates a new `configuration` using the current grid's `configuration` as model.
* `grid-collapse-all` fired by `grid-configuration` when a user clicks the minus sign to collapse all results.
* `grid-expand-all` fired by `grid-configuration` when a user clicks the plus sign to expand all results.
* `grid-create-new` fired by `grid-configuration` when a user clicks the "Create new".
* `grid-config-selected` fired by `grid-configuration-dropdown` when a grid's `configuration` is selected (setted as default).
* `grid-config-delete` fired by `grid-configuration-dropdown` when a grid's `configuration` is deleted
* `grid-sort` fired by `grid-table-column-header` when the `sort` param has changed (sort by column).
* `grid-column-resize` fired by `grid-table-column-header` when the size of a `column` is changed
* `grid-entry-change` fired by `grid-table` when the grid's `entry size` is changed (Default is 10).
* `grid-edit` fired by `grid-table` when the user double clicks on a `row`. The row's edition view should be shown.
* `grid-page-change` fired by `responsive-grid` when the page changes.
* `grid-search` fired by `grid-table` when a user press the `enter` when the `search` input is focused (the user enters a search criteria).

Mostly all events are handled by `responsive-grid`, only `grid-entry-change`, `grid-edit`, `grid-sort`, `grid-page-change`, `grid-search` are fired to the component including the grid.

### Event data

The events that bubbles up to the `responsive-grid` parent are the following.

* `grid-entry-change` => `number`: The result size per page.
* `grid-edit` => `object`: Row's data.
* `grid-sort` => `string`: The column's `prop` or `-prop` if it's a descending order. (for example `email` and `-email`).
* `grid-page-change` => `number`: The page number to display.
* `grid-search` => `string`: The string to use as a filter.

### Key points in a grid

Every grid uses a service. The service must have a property called `columns`, most likely to be a getter like the following.

```js
get columns() {
  return COLUMNS;
}
```

The `COLUMNS` constant should look something like the following:

```js
const COLUMNS = [
  { name: 'Column name', type: 'string', prop: 'name', visible: true },
  { name: 'Role', type: 'array', prop: 'roles', visible: true },
  { name: 'Groups',
    type: 'array',
    prop: 'groups',
    val: v => v.groups.map(g => g.name),
    visible: true,
  },
  { name: 'Number', type: 'number', prop: 'number', visible: true },
  { name: 'Inactive', type: 'boolean', prop: 'inactive', visible: true },
];
```

The props define the following:

* *name*: The column's header name
* *type*: The column's type, one of the following: string | array | boolean | number
* *prop*: The object property name to extract the data from
* *val*: A function that replaces the *prop* usage. This function is given the object and must return the value.
* *visible*: The column's visibility

IF a grid adds a column, the new column will be merged with any existing config. Even if a user saves a config, if a new column is added the user WILL see the new column regarding of the saved configuration.

### The "in-memory-grid"

The "in-memory-grid" should be used whenever you have a grid which retrieves all data and perform filtering, sorting, grouping and limiting in the frontend.

### URL query params

By default the "in-memory-grid" uses the URL query params to build the filters, but if you do not want the URL to change on filter, sorting and page changing you can provide the query object as the `query` prop, that way it will not oly change the URL but also it will use it as a default query, for instance:

```html
<in-memory-grid
  [...]
  :query="{page: 2}"
  [...]
  >
</in-memory-grid>
```


### Q&A

*The app uses vuex, why isn't the state in the grid handled by vuex as well?*

A single page might contain several grids, to avoid one grid's state mess the other grid's state each grid handles it's own state

*Why do some events have handlers that only re-emit the event?*

At this moment, an event emmited from a Vuejs component using `$emit` does not bubbles (meaning that if the parent component does not handle the event, the event is lost). That's why there are several components that `$emit` the same event handled.

*Why do the service class has to provide the column's data type?*

Basically, to allow date localization and formatting. Since dates are transferred as strings in JSON, there is no "non-hacky" way to detect a JSON date format. It was easier to provide a list of columns data type. The service already knows those columns type's.

*Why isn't the row's edition part of the grid? Why do I have to supply a custom component for editing a row?*

Because upon editing a row you might want to add autocompletion, advanced validation and other cool stuff. There is simply no easy way to create a generic component that does this kind of magic.
