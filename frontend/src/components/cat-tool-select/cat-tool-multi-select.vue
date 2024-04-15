<template>
  <multi-select
    @click.native="retrieveOptions"
    :options="options"
    :selected-options="selectedOptions"
    :placeholder="placeholder"
    :isDisabled="disabled"
    :title="title"
    @select="onSelect">
  </multi-select>
</template>

<script src="./cat-tool-multi-select.js"></script>
