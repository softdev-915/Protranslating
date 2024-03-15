<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    :options="options"
    :format-option="formatOption"
    :empty-option="{ text: '', value: {} }"
    entity-name="Certification"
    v-on="customListeners"/>
</template>

<script src="./certification-selector.js"></script>
