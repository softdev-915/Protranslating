<template>
  <server-pagination-grid
    ref="schedulerGrid"
    grid-name="scheduler"
    title="Scheduled jobs"
    key-prop="_id"
    :service="schedulerService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreate($event)">
  </server-pagination-grid>
</template>

<script src="./scheduler-grid.js"></script>
