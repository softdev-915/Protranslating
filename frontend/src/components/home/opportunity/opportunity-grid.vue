<template>
  <server-pagination-grid
    ref="opportunityGrid"
    grid-name="opportunityGrid"
    title="Opportunities Grid"
    key-prop="_id"
    :service="opportunityService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./opportunity-grid.js"></script>
