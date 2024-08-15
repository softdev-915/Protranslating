<template>
  <server-pagination-grid
    ref="ipInstructionsDeadlinesGrid"
    grid-name="ipInstructionsDeadline"
    title="Ip Instructions Deadlines"
    key-prop="name"
    :service="ipInstructionsDeadlineService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./ip-instructions-deadline-grid.js"></script>
