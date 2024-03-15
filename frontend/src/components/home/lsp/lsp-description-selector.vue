<template>
  <simple-basic-select
    v-model="selected"
    v-bind="customProps"
    v-on="customListeners"
    :placeholder="placeholder"
    :options="lspList"
    :format-option="formatOption"
    :empty-option="emptyOption"
    entity-name="LSP description"
    :title="title"
    :customAttr="getCustomAttr"
    @options-loaded="onOptionsLoaded"/>
</template>

<script src="./lsp-description-selector.js"></script>
