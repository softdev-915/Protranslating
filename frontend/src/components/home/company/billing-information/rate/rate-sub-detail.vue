<template>
  <div class="col-md-7 pl-2" data-e2e-type="rate-sub-detail">
    <div class="row rate-sub-detail-row">
      <div class="col fuzzy-matches p-0 pr-1">
        <div class="row fuzzy-matches-icons m-0 p-0">
          <div class="col-md-9 pl-0 pr-0">
            <breakdown-selector
              v-if="!isCollapsed"
              v-model="selectedBreakdown"
              placeholder="Breakdown"
              data-e2e-type="rate-sub-detail-breakdown"
              title="Breakdown list"
              :format-option="formatBreakdownSelectOption"/>
            <div data-e2e-type="rate-sub-detail-breakdown-read-only" v-else>{{ selectedBreakdownName }}</div>
          </div>
          <div
            class="col-md-3 col-xl-3 pl-2 pr-0"
            data-e2e-type="fuzzy-matches-icons"
            v-if="canEdit && !isCollapsed">
            <div class="icons-container">
              <div class="col-xs-3">
                <button
                  @click.prevent="addRateDetail()"
                  class="fas fa-plus"
                  data-e2e-type="rate-add-sub-detail-button"/>
              </div>
              <div class="col-xs-3">
                <button
                  @click.prevent="deleteRateDetail()"
                  class="fas fa-close"
                  data-e2e-type="rate-delete-sub-detail-button"/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col number-col p-0 pr-1">
        <currency-input
          v-if="!isCollapsed"
          v-model="rateDetailEdit.price"
          aria-label="price"
          class="form-control input-sm"
          :currency="null"
          data-e2e-type="rate-sub-detail-price"/>
        <div data-e2e-type="rate-sub-detail-price-read-only" v-else>{{ rateDetailEdit.price.toFixed(4) }}</div>
      </div>
      <div class="col p-0 pr-1">
        <currency-selector
          v-if="!isCollapsed"
          :format-option="formatCurrencySelectOption"
          :mandatory="true"
          v-model="selectedCurrency"
          data-e2e-type="rate-sub-detail-currency"
          placeholder="Currency"
          title="Currency list"/>
        <div v-else data-e2e-type="rate-sub-detail-currency-read-only">{{ selectedCurrencyIsoCode }}</div>
      </div>
      <div class="col p-0 pr-1">
        <translation-unit-selector
          v-if="!isCollapsed"
          :mandatory="true"
          :filter="translationUnitFilter"
          v-model="selectedTranslationUnit"
          data-e2e-type="rate-sub-detail-unit"
          placeholder="Unit"
          :isDisabled="!canEdit"
          title="Unit list"/>
          <div data-e2e-type="rate-sub-detail-unit-read-only" v-else>{{ selectedTranslationUnitName }}</div>
      </div>
      <div class="col p-0 pr-1">
        <internal-department-selector
          v-if="!isCollapsed"
          v-model="selectedInternalDepartment"
          placeholder="Internal department"
          data-e2e-type="rate-sub-detail-internal-department"
          :retrieve-on-init="true"
          :mandatory="isInternalDepartmentRequired"
          title="Internal departments list"/>
        <div data-e2e-type="rate-sub-detail-internal-department-read-only" v-else>{{ selectedInternalDepartmentName }}</div>
      </div>
    </div>
  </div>
</template>

<script src="./rate-sub-detail.js"></script>
<style lang="scss" scoped src="./rate-detail.scss"></style>
