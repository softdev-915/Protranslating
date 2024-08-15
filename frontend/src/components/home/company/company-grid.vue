<template>
  <div>
    <server-pagination-grid
      shouldRetrieveColumns
      ref="companiesInlineGrid"
      :grid-name="gridName"
      :retrieve-strategy="retrieveStrategy"
      title=""
      :force-query-params="forceQueryParams"
      :query="query"
      key-prop="_id"
      :service="companyService"
      :can-create="canCreate"
      @grid-refresh="onRefresh($event)"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreate($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./company-grid.js"></script>

