<template>
  <server-pagination-grid
    ref="mtModelGrid"
    grid-name="mt-model"
    title="Mt Models"
    key-prop="name"
    :service="mtModelService"
    :can-create="canCreate"
    :force-query-params="true"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./mt-model-grid.js"></script>
