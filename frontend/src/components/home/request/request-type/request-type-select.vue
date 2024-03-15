<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :options="options"
    :format-option="formatOption"
    :empty-option="emptyOption"
    :pre-fetch-option="preFetchOption"
    :fetch-on-created="false"
    entity-name="Request type"
    @click.native="retrieveOptions"/>
</template>

<script src="./request-type-select.js"></script>
