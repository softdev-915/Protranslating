<template>
  <ajax-basic-select
    ref="abs"
    :filters="filter"
    :http-client="httpClient"
    :selected-option="selectedBill"
    :class="{ 'blur-loading-row' : loading }"
    :limit="limit"
    @select="onBillSelect"
    :placeholder="placeholder"
    :is-disabled="isDisabled"
    :fetch-on-created="fetchOnCreated"
  />
</template>

<script src="./bill-ajax-select.js"></script>
