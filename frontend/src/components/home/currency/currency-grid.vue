<template>
  <server-pagination-grid
    ref="currencyGrid"
    grid-name="currency"
    title="Currencies"
    key-prop="name"
    :service="currencyService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./currency-grid.js"></script>
