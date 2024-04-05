<template>
  <simple-basic-select
    v-model="selected"
    :options="options"
    :format-option="formatOption"
    @click.native="retrieveOptions"
    entity-name="Breakdown"
    v-bind="wrappedProps"
    v-on="wrappedListeners"/>
</template>

<script src="./breakdown-selector.js"></script>
