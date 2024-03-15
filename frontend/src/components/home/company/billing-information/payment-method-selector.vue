<template>
  <simple-basic-select
    v-model="selected"
    v-bind="wrappedProps"
    :placeholder="canReadPaymentMethod ? placeholder : 'No payment method'"
    :disabled="disabled"
    :options="options"
    :format-option="formatOption"
    entity-name="Payment method"
    v-on="wrappedListeners"/>
</template>

<script src="./payment-method-selector.js"></script>
