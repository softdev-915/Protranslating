<template>
  <simple-basic-select
    v-model="selected"
    placeholder="Time to deliver"
    :options="options"
    :format-option="formatOption"
    :filter-option="filterOption"
    @click.native="_retrieve"
    entity-name="TimeToDeliver"
    @options-loaded="onCurrencyListLoaded"
    :fetch-on-created="fetchOnCreated"
    v-bind="wrappedProps"
    v-on="wrappedListeners"/>
</template>

<script src="./time-to-deliver-select.js"></script>
