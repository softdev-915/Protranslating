<template>
  <div class="p-3">
    <div class="row py-2">
      <div class="col-4">
        <h5 class="d-inline-block pts-font-bold">Invoices KPI</h5>
      </div>
    </div>
    <div class="row py-2">
      <div class="d-flex align-items-end my-3">
        <div class="period-to-apply ml-3">
          <label>Period to apply</label>
          <div class="date-filter" data-e2e-type="invoices-kpi-date-filter">
            <period-selector v-model="datePeriod" :disabled="!canEditDate" />
          </div>
        </div>
        <button
          class="btn btn-new-primary ml-3"
          data-e2e-type="invoices-kpi-show-data-button"
          @click="toggleDataVisibility"
        >{{ showDataLabel }}</button>
      </div>
    </div>
    <div v-show="isDataVisible" class="row py-2">
      <div class="col-12">
        <simple-grid-table
          :list-data="kpiData"
          :page="page"
          :limit="pageSize"
          :columns="columns"
          :loading="isLoadingKpiData"
          @grid-page-change="onPageChange"
          @grid-entry-change="onPageSizeChange"
          data-e2e-type="invoice-grid-table"
        />
      </div>
    </div>
  </div>
</template>
<script src="./invoice-kpi.js"></script>
