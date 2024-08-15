<template>
  <div>
    <!-- This grid's name is hardcoded in request-inline-edit.js-->
    <!-- update the REQUEST_GRID_NAME constant in that file if you change that -->
    <server-pagination-grid
      ref="requestInlineGrid"
      grid-name="requestInlineGrid"
      title="Requests"
      key-prop="_id"
      :cache="false"
      :service="service"
      :can-create="canCreate"
      :row-href-builder="requestRowHrefBuilder"
      @grid-edit="onEditInline($event)"
      @grid-data-loaded="onGridDataLoaded($event)"
      @grid-refresh="onRefresh($event)"
      @grid-create-new="onCreateInline($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./request-inline-grid.js"></script>
