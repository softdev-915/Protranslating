<template>
  <simple-basic-select
    v-model="selected"
    :options="options"
    :format-option="formatOption"
    entity-name="Footer template"
    v-bind="wrappedProps"
    :disabled="isDisabled"
    v-on="wrappedListeners">
  </simple-basic-select>
</template>

<script src="./footer-template-ajax-basic-select.js"></script>