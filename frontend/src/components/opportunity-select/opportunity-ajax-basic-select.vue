<template>
  <ajax-basic-select
    ref="abs"
    :custom-attr="customAttr"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    :class="{'blur-loading-row': loading }"
    loading-icon-class="fas fa-spinner fa-pulse fa-fw"
    :filters="filter"
    :http-client="httpClient"
    :limit="limit"
  />
</template>

<script src="./opportunity-ajax-basic-select.js"></script>
