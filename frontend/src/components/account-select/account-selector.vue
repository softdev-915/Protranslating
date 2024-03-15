<template>
  <simple-basic-select
    v-model="selected"
    :placeholder="canReadAccounts ? placeholder : 'No currency'"
    :options="options"
    :format-option="formatOption"
    :filter-option="filterOption"
    @click.native="retrieveOptions"
    entity-name="Account"
    @options-loaded="onAccountsListLoaded"
    v-bind="wrappedProps"
    v-on="wrappedListeners"/>
</template>

<script src="./account-selector.js"></script>