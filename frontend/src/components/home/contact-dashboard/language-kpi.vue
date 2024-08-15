<template>
  <div class="p-3">
    <div class="row py-2">
      <div class="col-4">
        <h5 class="d-inline-block pts-font-bold">Languages KPI</h5>
      </div>
    </div>
    <div class="row py-2">
      <div class="d-flex align-items-end my-3">
        <div class="period-to-apply ml-3">
          <label>Source</label>
          <div class="date-filter">
            <language-selector
              v-model="sourceLanguage"
              :excludedLanguages="[targetLanguage]"
              :fetch-on-created="false"
              title="Source Language"
              placeholder="English"
              data-e2e-type="language-source-language"
              customClass=" "
            />
          </div>
        </div>
        <div class="period-to-apply ml-3">
          <label>Target</label>
          <div class="date-filter">
            <language-selector
              v-model="targetLanguage"
              :excludedLanguages="[sourceLanguage]"
              :fetch-on-created="false"
              title="Target Language"
              placeholder="Spanish"
              data-e2e-type="language-target-language"
              customClass=" "
            />
          </div>
        </div>
        <div class="period-to-apply ml-3">
          <label>Period to apply</label>
          <div class="date-filter" data-e2e-type="language-kpi-date-filter">
            <period-selector v-model="datePeriod" :disabled="!canEditDate" />
          </div>
        </div>
        <button
          class="btn btn-new-primary ml-3"
          data-e2e-type="language-kpi-show-data-button"
          :disabled="!isEnabledShowTableButton"
          @click="toggleDataVisibility"
        >{{ showTableDataTitle }}</button>
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
          data-e2e-type="language-grid-table"
        />
      </div>
    </div>
  </div>
</template>
<script src="./language-kpi.js"></script>
