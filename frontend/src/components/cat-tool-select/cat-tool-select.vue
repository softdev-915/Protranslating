<template>
  <div :class="containerClass">
    <basic-select
      :selected-option="selectedOption"
      @select="onSelect"
      @click.native="retrieveOptions"
      :placeholder="placeholder"
      :is-disabled="isDisabled"
      :title="title"
      :options-available="toolsAvailable"
      :options="options">
    </basic-select>
  </div>
</template>

<script src="./cat-tool-select.js"></script>
