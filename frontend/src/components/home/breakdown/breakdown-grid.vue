<template>
  <server-pagination-grid
    ref="BreakdownsGrid"
    grid-name="breakdown"
    title="Breakdown"
    key-prop="name"
    :service="breakdownService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./breakdown-grid.js"></script>
