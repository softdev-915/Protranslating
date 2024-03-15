<template>
  <simple-basic-select
    v-model="selected"
    :options="options"
    :format-option="formatOption"
    :fetch-on-created="fetchOnCreated"
    entity-name="Ability"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    @options-loaded="onOptionsLoaded"
    @click.native="retrieveOptions"/>
</template>

<script src="./ability-selector.js"></script>
