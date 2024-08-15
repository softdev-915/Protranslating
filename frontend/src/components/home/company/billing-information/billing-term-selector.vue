<template>
  <simple-basic-select
    v-model="selected"
    v-bind="wrappedProps"
    :disabled="disabled"
    :placeholder="canReadBillingInformation ? placeholder : 'No billing term'"
    :options="options"
    :format-option="formatOption"
    entity-name="Billing term"
    v-on="wrappedListeners"/>
</template>

<script src="./billing-term-selector.js"></script>
