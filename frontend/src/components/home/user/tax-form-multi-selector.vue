<template>
  <multi-select
    :data-e2e-type="dataE2EType"
    :isDisabled="isDisabled"
    :class="{'blur-loading-row' : loading}"
    :placeholder="canRetrieve ? placeholder : 'No tax forms'"
    :selected-options="selected"
    :options="taxFormOptions"
    @select="onTaxFormSelected">
  </multi-select>
</template>

<script src="./tax-form-multi-selector.js"></script>
