<template>
  <server-pagination-grid
    ref="assignmentStatusGrid"
    grid-name="assignmentStatus"
    title="Assignment status"
    key-prop="name"
    :service="assignmentStatusService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./assignment-status-grid.js"></script>
