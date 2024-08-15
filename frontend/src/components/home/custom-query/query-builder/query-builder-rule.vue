<template>
  <div class="vqb-rule card" :data-e2e-type="`custom-query-filter-rule-${index}`">
    <div class="row align-items-center">
      <div class="col-2">{{ rule.label }}</div>
      <div
        v-if="!isOperatorsEmpty"
        class="col-2"
        :class="{ 'has-danger': operatorError !== '' }">
        <simple-basic-select
          v-model="query.operator"
          :options="rule.operators"
          placeholder="Select operator"
          :is-error="operatorError !== ''"
          data-e2e-type="custom-query-filter-rule-operator"/>
        <span class="form-control-feedback">{{ operatorError }}</span>
      </div>
      <div class="col-6">
        <query-builder-rule-value-input
          v-if="isValueNeeded"
          v-model="query.value"
          :field-type="rule.fieldType"
          :field-options="rule.fields"
          :field="rule.label"
          :error="error"/>
      </div>
      <div class="col-1">
        <button
          type="button"
          class="close ml-auto"
          v-html="labels.removeRule"
          data-e2e-type="custom-query-filter-rule-remove"
          @click="remove"></button>
      </div>
    </div>
  </div>
</template>

<script src="./query-builder-rule.js"></script>
