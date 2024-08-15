<template>
  <div :class="containerClass">
    <basic-select
      :selected-option="selectedOption"
      :options="formattedOptions"
      :custom-attr="deletedCustomAttr"
      :mandatory="mandatory"
      :class="{ 'blur-loading-row' : loading }"
      :isDisabled="disabled"
      @select="onSelect"/>
  </div>
</template>

<script src="./request-status-select.js"></script>
<style lang="scss" src="./request-status-select.scss"></style>
