<template>
  <server-pagination-grid
    ref="mtEnginesGrid"
    grid-name="mtEngines"
    title="MT Engines"
    key-prop="name"
    :service="_service()"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./mt-engines-grid.js"></script>
