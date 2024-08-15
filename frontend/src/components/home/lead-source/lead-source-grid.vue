<template>
  <server-pagination-grid
    ref="leadSourceGrid"
    grid-name="leadSource"
    title="Lead source"
    key-prop="_id"
    :service="leadSourceService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./lead-source-grid.js"></script>
