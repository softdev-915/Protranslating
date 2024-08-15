<template>
  <server-pagination-grid
    ref="softwareRequirementGrid"
    grid-name="softwareRequirement"
    title="Software requirement"
    key-prop="_id"
    :service="softwareRequirementService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./software-requirement-grid.js"></script>
