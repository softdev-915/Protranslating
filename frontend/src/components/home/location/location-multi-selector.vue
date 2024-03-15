<template>
  <multi-select
    :class="{'blur-loading-row' : loading}"
    :selected-options="selectedLocations"
    :options="locationsOptions"
    @select="onSelected">
  </multi-select>
</template>

<script src="./location-multi-selector.js"></script>

