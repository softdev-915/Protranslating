<template>
  <server-pagination-grid
    ref="billingTermsGrid"
    grid-name="billingTerm"
    title="Billing terms"
    key-prop="name"
    :service="billingTermService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./billing-term-grid.js"></script>
