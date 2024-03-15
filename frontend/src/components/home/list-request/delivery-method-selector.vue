<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :options="options"
    :format-option="formatOption"
    :fetch-on-created="false"
    entity-name="Delivery method"
    @click.native="retrieveOptions"/>
</template>

<script src="./delivery-method-selector.js"></script>
