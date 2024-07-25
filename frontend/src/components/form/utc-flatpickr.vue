<template>
  <flat-pickr
    :disabled="triggeredDisabled"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    v-model="clientDateStr"></flat-pickr>
</template>

<script src="./utc-flatpickr.js"></script>
