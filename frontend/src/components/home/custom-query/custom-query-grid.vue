<template>
  <server-pagination-grid
    ref="customQueryGrid"
    grid-name="customQuery"
    title="Custom Queries"
    key-prop="name"
    :service="customQueryService"
    :can-create="canCreate"
    :components="components"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)"/>
</template>

<script src="./custom-query-grid.js"></script>
