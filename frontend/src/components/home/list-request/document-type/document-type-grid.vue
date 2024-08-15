<template>
  <server-pagination-grid
    ref="documentTypeGrid"
    grid-name="documentType"
    title="Document type"
    key-prop="_id"
    :service="documentTypeService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./document-type-grid.js"></script>
