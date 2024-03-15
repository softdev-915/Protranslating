<template>
  <server-pagination-grid
    ref="templatesGrid"
    grid-name="template"
    title="Templates"
    key-prop="_id"
    :service="templateService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreate($event)">
  </server-pagination-grid>
</template>

<script src="./template-grid.js"></script>
