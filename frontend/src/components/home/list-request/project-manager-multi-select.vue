<template>
  <multi-select
    :selected-options="selected"
    :options="projectManagerOptions"
    :class="{'blur-loading-row': loading}"
    data-e2e-type="project-managers-select"
    @click.native="retrieveOptions"
    @select="onProjectManagerSelect"
    v-bind="wrappedProps"
    v-on="wrappedListeners">
  </multi-select>
</template>

<script src="./project-manager-multi-select.js"></script>
