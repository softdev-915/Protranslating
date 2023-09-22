<template>
  <simple-basic-select
    v-model="selected"
    :pre-fetch-option="preFetchOption"
    :options="options"
    :format-option="formatOption"
    :mandatory="mandatory"
    entity-name="Internal department"
    @click.native="retrieveOptions"
    v-bind="wrappedProps"
    :disabled="isDisabled"
    v-on="wrappedListeners">
  </simple-basic-select>
</template>

<script src="./internal-department-selector.js"></script>
