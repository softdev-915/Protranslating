<template>
  <server-pagination-grid
    ref="ServiceTypeGrid"
    grid-name="serviceType"
    title="Service Type Grid"
    key-prop="name"
    :service="serviceTypeService"
    :can-create="canCreate"
    :can-export="false"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./service-type-grid.js"></script>
