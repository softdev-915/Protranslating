<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :options="defaultOptions"
    title="Approval method selector"
    data-e2e-type="approvalMethodSelector"/>
</template>

<script src="./approval-method-selector.js"></script>
