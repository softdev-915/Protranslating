<template>
  <ajax-basic-select
    ref="abs"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    loading-icon-class="fas fa-spinner fa-pulse fa-fw"
    :class="divClass"
    :fetch-on-created="fetchOnCreated"
    :filters="filter"
    :http-client="httpClient"
    :limit="limit"
  />
</template>

<script src="./company-ajax-basic-select.js"></script>
<style scoped lang="scss" src="./company-ajax-basic-select.scss"></style>
