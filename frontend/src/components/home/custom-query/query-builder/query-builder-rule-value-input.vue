<template>
  <div class="row align-items-center">
    <div class="col-3" :class="{ 'has-danger': typeError !== '' }">
      <simple-basic-select
        v-model="result.type"
        :options="typeSelectOptions"
        placeholder="Select value type"
        @change="result.value = ''"
        :is-error="typeError !== ''"
        data-e2e-type="custom-query-filter-rule-value-type"/>
      <span class="form-control-feedback">{{ typeError }}</span>
    </div>
    <div v-if="!isTypeEmpty" class="col-9" :class="{ 'has-danger': valueError !== '' }">
      <simple-basic-select
        v-if="result.type === 'field'"
        v-model="result.value"
        :options="fieldOptions"
        :format-option="formatFieldSelectOption"
        :empty-option="{ text: '', value: {} }"
        :is-error="valueError !== ''"
        data-e2e-type="custom-query-filter-rule-value-field-value"
      />
      <template v-else-if="result.type === 'value'">
        <div v-if="fieldType === 'Boolean'">
          <div class="form-check form-check-inline">
            <label class="form-check-label">
              <input
                v-model="result.value"
                type="radio"
                class="form-check-input"
                :value="true"
                data-e2e-type="custom-query-filter-rule-value-boolean-value"> True
            </label>
          </div>
          <div class="form-check form-check-inline">
            <label class="form-check-label">
              <input
                v-model="result.value"
                type="radio"
                class="form-check-input"
                :value="false"
                data-e2e-type="custom-query-filter-rule-value-boolean-value"> False
            </label>
          </div>
        </div>
        <template v-else-if="fieldType === 'Date'">
          <div class="row">
            <div class="col-4">
              <simple-basic-select
                v-model="dateType"
                :options="dateTypeSelectOptions"
                placeholder="Select date type"
                data-e2e-type="custom-query-filter-rule-date-type"
                @change="result.value = ''"
              />
            </div>
            <div class="col-8">
              <utc-flatpickr
                v-if="dateType === 'date'"
                v-model="result.value"
                class="form-control"
                :config="{ enableTime: true, time_24hr: true }"
                data-e2e-type="custom-query-filter-rule-value-date-value"
              />
              <div v-else-if="dateType === 'range'" data-e2e-type="custom-query-filter-rule-value-date-range-value-block">
                <input
                  :value="result.value"
                  type="text"
                  class="form-control"
                  readonly
                  data-e2e-type="custom-query-filter-rule-value-date-value"
                  @click="showDateRangePicker = true"
                >
                <dynamic-utc-range-flatpickr
                  v-show="showDateRangePicker"
                  v-model="result.value"
                  class="tooltip-content border border-dark rounded"
                  :config="{ enableTime: true, time_24hr: true, inline: true, allowInput: false, fmt: 'YYYY-MM-DDTHH:mm:ss.000\\Z' }"
                  :allowed-ranges="['lastYear', 'thisYear', 'previousThirtyDays', 'previousSevenDays', 'yesterday', 'today']"
                  @apply="showDateRangePicker = false"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="form-check form-check-inline">
            <label class="form-check-label">
              <input v-model="showValueOptions" type="radio" class="form-check-input" :value="false">
              Enter value
            </label>
          </div>
          <div class="form-check form-check-inline">
            <label class="form-check-label">
              <input v-model="showValueOptions" type="radio" class="form-check-input" :value="true">
              Search from options
            </label>
          </div>
          <multi-select
            v-if="showValueOptions"
            :options="valueOptions"
            :selected-options="selectedOptions"
            data-e2e-type="custom-query-filter-rule-value-option-value"
            @select="onSelectValueOption"
          />
          <template v-else>
            <input
              v-if="['Number', 'Decimal128'].includes(fieldType)"
              v-model.number="result.value"
              type="number"
              class="form-control"
              data-e2e-type="custom-query-filter-rule-value-number-value"
            >
            <input
              v-else
              v-model="result.value"
              type="text"
              class="form-control"
              placeholder="Empty string"
              data-e2e-type="custom-query-filter-rule-value-string-value"
            >
          </template>
        </template>
      </template>
      <span class="form-control-feedback">{{ valueError }}</span>
    </div>
  </div>
</template>

<script src="./query-builder-rule-value-input.js"></script>
