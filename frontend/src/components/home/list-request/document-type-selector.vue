<template>
  <multi-select
    :selected-options="selected"
    :options="documentTypeOptions"
    :class="{'blur-loading-row': loading}"
    @click.native="retrieveOptions"
    @select="onDocumentTypeSelected"
    v-bind="wrappedProps"
    v-on="wrappedListeners">
  </multi-select>
</template>

<script src="./document-type-selector.js"></script>
