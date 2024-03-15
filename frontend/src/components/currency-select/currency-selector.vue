<template>
  <simple-basic-select
    v-model="selected"
    placeholder="Currencies"
    :options="options"
    :format-option="formatOption"
    :filter-option="filterOption"
    @click.native="_retrieve"
    entity-name="Currency"
    @options-loaded="onCurrencyListLoaded"
    :fetch-on-created="fetchOnCreated"
    v-bind="wrappedProps"
    v-on="wrappedListeners"/>
</template>

<script src="./currency-selector.js"></script>
