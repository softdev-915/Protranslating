<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :options="defaultOptions"
    title="OFAC selector"
    data-e2e-type="ofac-selector"/>
</template>

<script src="./ofac-selector.js"></script>
