<template>
  <div class="row px-3 py-0" data-e2e-type="rate-sub-detail">
    <div class="col px-0">
      <div class="row breakdown-icons m-0 p-0">
        <div class="col-md-9 pl-0 pr-0">
          <breakdown-selector
            v-if="!isCollapsed"
            v-model="selectedBreakdown"
            placeholder="Breakdown"
            data-e2e-type="rate-sub-detail-breakdown"
            :class="{'has-danger': isDuplicate}"
            :is-disabled="breakdownUnitPriceDisabled"
            :fetch-on-created="false"/>
          <div v-else data-e2e-type="rate-sub-detail-breakdown-read-only">
            {{ _.get(selectedBreakdown, 'text', '') }}
          </div>
        </div>
        <div
          class="col-md-3 col-xl-3 pl-2 pr-0"
          data-e2e-type="breakdownes-icons"
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
    <div class="col px-0">
      <currency-input
        v-if="!isCollapsed"
        v-model="rateDetailEdit.price"
        :disabled="breakdownUnitPriceDisabled"
        :currency="null"
        aria-label="price"
        class="form-control input-sm"
        :class="{'has-danger': isDuplicate}"
        data-e2e-type="rate-sub-detail-price"
        :allow-negative="false"/>
      <div v-else data-e2e-type="rate-sub-detail-price-read-only">
        {{ rateDetailEdit.price.toFixed(4) }}
      </div>
    </div>
    <div class="col px-0" >
      <currency-selector
        v-if="!isCollapsed"
        data-e2e-type="rate-sub-detail-currency"
        :format-option="formatCurrencySelectOption"
        v-model="selectedCurrency"
        :is-disabled="!canEdit"
        :mandatory="true"
        :class="{'has-danger': !isValidCurrency || isDuplicate}"
        :fetch-on-created="false"/>
      <div v-else data-e2e-type="rate-sub-detail-currency-read-only">
        {{ _.get(selectedCurrency, 'text', '') }}
      </div>
    </div>
    <div class="col px-0">
      <translation-unit-selector
        v-if="!isCollapsed"
        v-model="selectedTranslationUnit"
        :mandatory="true"
        :format-option="formatTranslationUnitSelectOption"
        data-e2e-type="rate-sub-detail-unit"
        placeholder="Unit"
        :class="{'has-danger': !isValidTranslationUnit || isDuplicate}"
        :fetch-on-created="false"/>
      <div v-else data-e2e-type="rate-sub-detail-unit-read-only">
        {{ _.get(selectedTranslationUnit, 'text', '') }}
      </div>
    </div>
  </div>
</template>

<script src="./rate-sub-detail.js"></script>
<style lang="scss" scoped src="./rate-detail.scss"></style>
