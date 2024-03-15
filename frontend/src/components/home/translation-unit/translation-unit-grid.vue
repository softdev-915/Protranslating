<template>
  <server-pagination-grid
    ref="translationUnitsGrid"
    grid-name="translationUnit"
    title="Units"
    key-prop="name"
    :service="translationUnitService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./translation-unit-grid.js"></script>
