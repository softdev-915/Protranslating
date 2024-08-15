<template>
  <div>
    <server-pagination-grid
      ref="CompanyExternalAccountingCodesGrid"
      grid-name="CompanyExternalAccountingCodes"
      title="Company External Accounting Codes"
      key-prop="_id"
      :service="companyExternalAccountingCodesService"
      :can-create="canCreate"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreateNew($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./company-external-accounting-codes-grid.js"></script>
