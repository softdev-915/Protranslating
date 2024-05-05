<template>
  <simple-basic-select
    v-model="selected"
    v-bind="wrappedProps"
    :options="options"
    :format-option="formatOption"
    :fetch-on-created="false"
    @click.native="retrieveOptions"
    entity-name="Competence Level"
    v-on="wrappedListeners"/>
</template>

<script src="./competence-level-basic-selector.js"></script>
