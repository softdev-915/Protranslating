<template>
  <simple-basic-select
      id="customerTierLevelSelector"
      v-model="selected"
      v-bind="wrappedProps"
      :options="options"
      :placeholder="placeholder"
      title="Customer Tier Level"
      data-e2e-type="customerTierLevelSelector"
      v-on="wrappedListeners"/>
</template>

<script src="./customer-tier-level-selector.js"></script>
