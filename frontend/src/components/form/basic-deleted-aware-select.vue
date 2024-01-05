<template>
  <basic-select
    :options="filteredOptions"
    :placeholder="placeholder"
    :selected-option="selectedOption"
    :custom-attr="deletedCustomAttr"
    :show-missing-options="true"
    :class="{'blur-loading-row' : loading}"
    @select="select"
    :is-disabled="disabled">
  </basic-select>
</template>
<script src="./basic-deleted-aware-select.js"></script>
<style lang="scss" src="./basic-deleted-aware-select.scss"></style>

