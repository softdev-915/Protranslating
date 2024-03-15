<template>
  <server-pagination-grid
    ref="taxFormGrid"
    grid-name="taxForm"
    title="Tax form"
    key-prop="_id"
    :service="taxFormService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./tax-form-grid.js"></script>
