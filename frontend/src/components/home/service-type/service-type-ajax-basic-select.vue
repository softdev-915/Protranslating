<template>
  <simple-basic-select
    v-model="selected"
    :options="options"
    :format-option="formatOption"
    entity-name="Service type"
    v-bind="wrappedProps"
    :disabled="isDisabled"
    v-on="wrappedListeners">
  </simple-basic-select>
</template>

<script src="./service-type-ajax-basic-select.js"></script>