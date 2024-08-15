<template>
  <server-pagination-grid
    ref="providerInstructionsGrid"
    grid-name="providerInstructions"
    title="Provider instructions"
    key-prop="name"
    :service="providerInstructionsService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./provider-instructions-grid.js"></script>
