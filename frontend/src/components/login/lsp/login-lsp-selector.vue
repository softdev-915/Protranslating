<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    placeholder="Select LSP"
    :options="lspList"
    :format-option="formatOption"
    :empty-option="emptyOption"
    entity-name="LSP"
    title="LSP"/>
</template>

<script src="./login-lsp-selector.js"></script>
