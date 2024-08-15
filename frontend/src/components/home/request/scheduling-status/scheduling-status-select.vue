<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :options="options"
    :format-option="formatOption"
    :pre-fetch-option="preFetchOption"
    :empty-option="emptyOption"
    :fetch-on-created="false"
    entity-name="Scheduling status"
    @click.native="retrieveOptions"/>
</template>

<script src="./scheduling-status-select.js"></script>
