<template>
  <ajax-multi-select
    ref="abs"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    loading-icon-class="fas fa-spinner fa-pulse fa-fw"
    :class="{'blur-loading-row' : loading}"
    :http-client="httpClient">
  </ajax-multi-select>
</template>

<script src="./multi-direct-company-select.js"></script>
