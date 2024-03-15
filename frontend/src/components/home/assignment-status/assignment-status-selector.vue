<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :options="options"
    :format-option="formatOption"
    :fetch-on-created="false"
    entity-name="Assignment status"
    @click.native="retrieveOptions"/>
</template>

<script src="./assignment-status-selector.js"></script>
