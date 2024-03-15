<template>
  <simple-basic-select
    v-model="selected"
    entity-name="Unit"
    :options="options"
    :format-option="formatOption"
    :filter-option="filterOption"
    @click.native="retrieveOptions"
    v-bind="wrappedProps"
    v-on="wrappedListeners"/>
</template>

<script src="./translation-unit-selector.js"></script>
