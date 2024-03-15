<template>
  <big-data-set-grid
    ref="AccountsPayable"
    grid-name="ap-payment-entries"
    title="Accounts Payable"
    key-prop="id"
    :query="query"
    :row-selection="true"
    :force-warning-message-on-export="true"
    :service="service"
    :can-create="false"
    :has-import-link="false"
    :components="components"
    :selected-rows="selectedRows"
    :grid-query-reset-callback="onGridResetQuery"
    selected-row-check-property="_id"
    @grid-data-imported="onGridDataImported"
    @all-rows-selected="onAllRowsSelected"
    @row-selected="onRowSelected"
    @grid-data-loaded="onGridDataLoaded" />
</template>

<script src="./account-payable-grid.js"></script>
