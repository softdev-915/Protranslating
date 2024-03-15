<template>
  <multi-select
    :selected-options="selected"
    :options="softwareRequirementOptions"
    @select="onSoftwareRequirementSelected"
    @click.native="retrieveOptions"
    :class="{'blur-loading-row': loading}"
    v-bind="wrappedProps"
    v-on="wrappedListeners">
  </multi-select>
</template>

<script src="./software-requirement-selector.js"></script>
