<template>
  <div>
    <server-pagination-grid
      :query="query"
      key-prop="_id"
      grid-name="companyMinimumChargeGrid"
      title="Company minimum charge Grid"
      :service="service"
      :can-create="canCreate"
      @grid-create-new="onCreate"
      @grid-edit="onEdit($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./company-minimum-charge-grid.js"></script>
