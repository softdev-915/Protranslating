<template>
  <flat-pickr
    :value="localDate"
    @input="setDate"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    :disabled="triggeredDisabled"
  />
</template>

<script src="./flatpickr.js"></script>
