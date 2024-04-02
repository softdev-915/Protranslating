
<template>
  <ajax-multi-select
    ref="abs"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    :placeholder="placeholderMessage"
    :isDisabled="isSelectDisabled"
    loading-icon-class="fas fa-spinner fa-pulse fa-fw"
    :class="{'blur-loading-row' : loading}"
    :http-client="httpClient">
  </ajax-multi-select>
</template>

<script src="./request-ajax-multi-select.js"></script>
