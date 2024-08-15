<template>
  <basic-select
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    :options="leadSourceOptions"
    :selected-option="selectedLeadSource"
    :class="{'blur-loading-row' : loading}"
    @select="onLeadSourceSelected"
    >
  </basic-select>
</template>

<script src="./lead-source-selector.js"></script>
