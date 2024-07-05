<template>
  <ajax-basic-select
    ref="abs"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    loading-icon-class="fas fa-spinner fa-pulse fa-fw"
    :class="divClass"
    :fetch-on-created="fetchOnCreated"
    :filters="filter"
    :http-client="httpClient"/>
</template>

<script src="./external-accounting-code-ajax-select.js"></script>
