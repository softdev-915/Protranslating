<template>
  <server-pagination-grid
    ref="groupsGrid"
    grid-name="group"
    title="Groups"
    key-prop="name"
    :service="groupService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./group-grid.js"></script>
