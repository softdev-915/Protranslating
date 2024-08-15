<template>
  <div>
    <server-pagination-grid
      shouldRetrieveColumns
      ref="userInlineGrid"
      :grid-name="gridName"
      title=""
      :query="query"
      :force-query-params="forceQueryParams"
      key-prop="_id"
      :service="userService"
      :can-create="canCreate"
      @grid-edit="onEditInline($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./user-grid.js"></script>

