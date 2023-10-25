<template>
  <basic-select
      id="typeSelector"
      :options="typeOptions"
      :selected-option="selected"
      :placeholder="placeholder"
      :isDisabled="disabled"
      title="Type"
      data-e2e-type="typeSelector"
      @select="onTypeSelected">
    </basic-select>
</template>

<script src="./activity-type-selector.js"></script>
