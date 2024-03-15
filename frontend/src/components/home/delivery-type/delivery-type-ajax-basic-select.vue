<template>
  <simple-basic-select
    v-model="selected"
    :options="filteredOptions"
    :format-option="formatOption"
    entity-name="Delivery type"
    v-bind="wrappedProps"
    :disabled="isDisabled"
    v-on="wrappedListeners">
  </simple-basic-select>
</template>

<script src="./delivery-type-ajax-basic-select.js"></script>